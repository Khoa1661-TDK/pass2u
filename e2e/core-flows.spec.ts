import { test, expect, type Page, type Browser } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const LOG = process.env.NEXT_LOG ?? "next.log";
const fx = (f: string) => path.join(__dirname, "fixtures", f);
const run = Date.now().toString(36);

async function confirmLinkFor(email: string) {
  for (let i = 0; i < 20; i++) {
    const log = readFileSync(LOG, "utf8");
    const at = log.lastIndexOf(`to=${email}`);
    if (at >= 0) {
      const m = log.slice(at).match(/Confirm link: (\S+)/);
      if (m) return m[1];
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("No confirmation email logged for " + email);
}

async function signUpAndConfirm(browser: Browser, name: string) {
  const ctx = await browser.newContext({ ...test.info().project.use, permissions: ["camera"] });
  const page = await ctx.newPage();
  const email = `${name.split(" ")[0].toLowerCase()}.${run}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
  await page.goto(await confirmLinkFor(email));
  await page.getByRole("link", { name: "Continue to ID verification" }).click();
  return page;
}

async function signUpAndSubmitId(browser: Browser, name: string, code: string, card: string) {
  const ctx = await browser.newContext({ ...test.info().project.use });
  const page = await ctx.newPage();
  const email = `${name.split(" ")[0].toLowerCase()}.${run}@example.com`;
  await page.goto("/");
  await page.getByRole("link", { name: "Join", exact: true }).click();
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("password123");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();

  // Unconfirmed users can't reach the marketplace.
  await page.goto("/market");
  await expect(page).toHaveURL(/check-email/);

  await page.goto(await confirmLinkFor(email));
  await page.getByRole("link", { name: "Continue to ID verification" }).click();
  await page.locator('input[name="idCard"]').setInputFiles(fx(card));
  // Let the card reader finish so it can't overwrite the typed code.
  await expect(page.getByText(/couldn't read the code|from your card/)).toBeVisible({ timeout: 30_000 });
  await page.getByLabel("Student code").fill(code);
  await page.getByLabel("Campus").selectOption("Hà Nội");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByRole("heading", { name: /checking your ID/ })).toBeVisible();

  // Pending users still can't browse.
  await page.goto("/market");
  await expect(page).toHaveURL(/verify/);
  return { page, email };
}

async function adminLogin(browser: Browser) {
  const ctx = await browser.newContext({ ...test.info().project.use });
  const page = await ctx.newPage();
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "admin@pass2u.test");
  await page.getByLabel("Password").fill(process.env.ADMIN_PASSWORD ?? "admin12345");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/market/);
  return page;
}

async function approve(admin: Page, email: string) {
  await admin.goto("/admin");
  await admin.waitForLoadState("networkidle");
  const row = admin.locator("ul > li", { hasText: email }).first();
  await expect(row.getByRole("img")).toBeVisible();
  // Server-side card checks are shown to the admin.
  await expect(row.getByLabel("Automatic card checks")).toContainText("Name on card");
  await expect(row.getByLabel("Automatic card checks")).toContainText("FPT card wording");
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(admin.locator("li", { hasText: email })).toHaveCount(0, { timeout: 20_000 });
}

test("sign up, verify, list, chat, reserve, complete", async ({ browser }) => {
  const seller = await signUpAndSubmitId(browser, "Lan Nguyen", "SE180001", "card-lan.png");
  const buyer = await signUpAndSubmitId(browser, "Minh Tran", "HE190002", "card-minh.png");

  // ID photos are not visible to students.
  const sellerId = await seller.page.evaluate(() => fetch("/api/admin/id/00000000-0000-0000-0000-000000000000").then((r) => r.status));
  expect(sellerId).toBe(403);

  const admin = await adminLogin(browser);
  await approve(admin, seller.email);
  await approve(admin, buyer.email);

  // Seller posts an item.
  const s = seller.page;
  await s.goto("/verify");
  await expect(s).toHaveURL(/market/);
  await s.goto("/listings/new");
  await s.getByLabel("Add photos").setInputFiles([fx("item.png"), fx("item2.png")]);
  const title = `Desk fan ${run}`;
  await s.getByLabel("Title").fill(title);
  await s.getByLabel("Price").fill("120000");
  await s.getByLabel("Category").selectOption("dorm");
  await s.getByLabel("Condition").selectOption("good");
  await s.getByLabel("Description").fill("Quiet three-speed fan, used one semester in Dom A.");
  await s.getByRole("button", { name: "Publish listing" }).click();
  await expect(s.getByRole("heading", { name: title })).toBeVisible();
  await expect(s.getByText("120.000 ₫")).toBeVisible();

  // Buyer finds it with search + filters.
  const b = buyer.page;
  await b.goto(`/market?q=${encodeURIComponent(title)}&category=dorm&type=sell`);
  await b.getByRole("link", { name: new RegExp(title) }).click();
  await b.getByRole("button", { name: "Send message" }).click();
  await expect(b).toHaveURL(/inbox\//);
  await expect(b.getByText("Is this still available?")).toBeVisible();
  await b.getByRole("button", { name: "Request to reserve" }).click();
  await expect(b.getByText("Waiting for the seller to accept")).toBeVisible();

  // Seller accepts, then completes.
  await s.goto("/inbox");
  await s.getByRole("link", { name: /Minh Tran/ }).click();
  await s.getByRole("textbox", { name: "Message" }).fill("Sure, meet at the library at 5pm?");
  await s.getByRole("button", { name: "Send", exact: true }).click();
  await expect(s.getByText("meet at the library")).toBeVisible();
  await s.getByRole("button", { name: "Accept" }).click();
  await expect(s.getByText("Reserved for this buyer")).toBeVisible();
  await s.getByRole("button", { name: "Mark as completed" }).click();
  await expect(s.getByText("Exchange completed")).toBeVisible();

  // Completed listings leave the market but show on the profile.
  await b.goto(`/market?q=${encodeURIComponent(title)}`);
  await expect(b.getByRole("heading", { name: "Nothing matches those filters" })).toBeVisible();
  await s.goto("/me?tab=completed");
  await expect(s.getByText(title)).toBeVisible();

  // Moderation: a report can get a listing removed.
  await s.goto("/listings/new");
  await s.getByLabel("Add photos").setInputFiles(fx("item.png"));
  await s.getByRole("radio", { name: "Give away" }).check({ force: true });
  await s.getByLabel("Title").fill(`Old notes ${run}`);
  await s.getByLabel("Category").selectOption("textbooks");
  await s.getByLabel("Condition").selectOption("fair");
  await s.getByLabel("Description").fill("Handwritten MAE101 notes, free to a good home.");
  await s.getByRole("button", { name: "Publish listing" }).click();
  await expect(s.getByText("Free", { exact: true }).first()).toBeVisible();
  const url = s.url();

  await b.goto(url);
  await b.getByText("Report this listing").click();
  await b.getByLabel("What’s wrong?").fill("Testing the report flow");
  await b.getByRole("button", { name: "Send report" }).click();
  await expect(b.getByText("An admin will review")).toBeVisible();

  await admin.goto("/admin/reports");
  await admin.locator("li", { hasText: `Old notes ${run}` }).getByRole("button", { name: "Remove listing" }).click();
  await b.goto(url);
  await expect(b.getByRole("heading", { name: "This page isn’t here" })).toBeVisible();
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  for (const p of ["/market", "/inbox", "/admin", "/listings/new"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("card reader fills the student code from a photo", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await signUpAndConfirm(browser, "Ocrtest Lan");
  await page.locator('input[name="idCard"]').setInputFiles(fx("card-ocr.png"));
  await expect(page.getByText("Read SE190123 from your card", { exact: false })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel("Student code")).toHaveValue("SE190123");
});

test("scanner opens the camera and captures the framed card", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await signUpAndConfirm(browser, "Scantest Minh");
  await page.getByRole("button", { name: "Scan card" }).click();
  const dialog = page.getByRole("dialog", { name: "Scan your student card" });
  await expect(dialog).toBeVisible();
  await page.waitForFunction(() => (document.querySelector("video") as HTMLVideoElement)?.videoWidth > 0);
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/scanner.png` });
  await dialog.getByRole("button", { name: "Capture card" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByAltText("Your ID card preview")).toBeVisible();
  const files = await page.locator('input[name="idCard"]').evaluate((i) => (i as HTMLInputElement).files?.length);
  expect(files).toBe(1);
});

test("server rejects a card that doesn't match or isn't an FPT card", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await signUpAndConfirm(browser, "Checktest Hoa");
  await page.locator('input[name="idCard"]').setInputFiles(fx("card-lan.png"));
  await expect(page.getByText(/from your card|couldn't read/)).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Student code").fill("SE111111");
  await page.getByLabel("Campus").selectOption("Hà Nội");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("Your card shows SE180001, but you entered SE111111")).toBeVisible({ timeout: 60_000 });

  await page.locator('input[name="idCard"]').setInputFiles(fx("item.png"));
  await expect(page.getByText(/from your card|couldn't read/)).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Student code").fill("SE111111");
  await page.getByLabel("Campus").selectOption("Hà Nội");
  await page.getByRole("button", { name: "Submit for review" }).click();
  await expect(page.getByText("doesn't look like an FPT University student card")).toBeVisible({ timeout: 60_000 });
});
