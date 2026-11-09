// PRODUCTION smoke test for the Blob store fix. Run EXPLICITLY against prod:
//   BASE_URL=https://pass2u.vercel.app PROD_SMOKE=1 ADMIN_EMAIL=... ADMIN_PASSWORD=... \
//     npx playwright test e2e/prod-blob-smoke.spec.ts
// No local DB access (releaseCode/db-count helpers from other specs are intentionally absent).
// If the upload SUCCEEDS the test listing is deleted again (blob removed via deleteListing).
import { test, expect, type Page, type Browser, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";

const fx = (f: string) => path.join(__dirname, "fixtures", f);
const run = Date.now().toString(36);

test.skip(process.env.PROD_SMOKE !== "1", "explicit production smoke — set PROD_SMOKE=1");

async function newPage(browser: Browser) {
  const ctx: BrowserContext = await browser.newContext({ ...test.info().project.use });
  return ctx.newPage();
}

// Sign up a fresh student, retrying on student-code collisions with real users.
async function signupSeller(browser: Browser) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const page = await newPage(browser);
    const code = `SE${Math.floor(200000 + Math.random() * 699999)}`;
    const phone = `09${Math.floor(10000000 + Math.random() * 89999999)}`;
    const email = `prodsmoke.${run}.${attempt}@example.com`;
    await page.goto("/signup");
    await page.getByLabel("Họ và tên").fill("Smoke Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Mật khẩu").fill("password123");
    await page.getByLabel("Số điện thoại").fill(phone);
    await page.getByLabel("Ngày sinh").fill("2002-01-01");
    await page.getByLabel("Nơi bạn đang ở").fill("KTX FPT Hà Nội");
    await page.getByLabel("Cơ sở").selectOption("Hà Nội");
    await page.getByLabel("Mã sinh viên").fill(code);
    await page.getByRole("button", { name: "Tạo tài khoản" }).click();
    const ok = await page
      .getByRole("heading", { name: /Đang kiểm tra thông tin/ })
      .waitFor({ timeout: 8_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) return { page, email };
    await page.context().close();
  }
  throw new Error("could not sign up a smoke-test student in 3 attempts");
}

async function approve(browser: Browser, email: string) {
  const admin = await newPage(browser);
  await admin.goto("/login");
  await admin.getByLabel("Email").fill(process.env.ADMIN_EMAIL!);
  await admin.getByLabel("Mật khẩu").fill(process.env.ADMIN_PASSWORD!);
  await admin.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(admin, "admin login failed — check ADMIN_EMAIL/ADMIN_PASSWORD for prod")
    .toHaveURL(/\/(market|admin)/, { timeout: 15_000 });
  await admin.goto("/admin");
  await admin.waitForLoadState("networkidle");
  await admin.locator("ul > li", { hasText: email }).first().getByRole("button", { name: "Duyệt" }).click();
  await expect(admin.locator("li", { hasText: email })).toHaveCount(0, { timeout: 20_000 });
  await admin.context().close();
}

test("prod: approved student uploads a listing image via Vercel Blob", async ({ browser }) => {
  test.setTimeout(360_000);
  const { page, email } = await signupSeller(browser);
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    await approve(browser, email);
  } else {
    // Manual mode: open /verify and wait; a human approves the pending account in /admin.
    console.log(`APPROVAL NEEDED: approve the pending "Smoke Tester" account ${email} in /admin (up to 5 min).`);
  }
  await page.goto("/verify");
  await expect(page, "waiting for manual admin approval").toHaveURL(/market/, { timeout: 300_000 });

  const title = `Prod smoke fan ${run}`;
  await page.goto("/listings/new");
  await page.getByLabel("Thêm ảnh").setInputFiles(fx("item.png"));
  await page.getByLabel("Tiêu đề").fill(title);
  await page.getByLabel("Giá").fill("9000");
  await page.getByLabel("Chuyên mục").selectOption("dorm");
  await page.getByLabel("Tình trạng").selectOption("good");
  await page.getByLabel("Mô tả").fill("Temporary prod upload test — will be deleted.");

  const alert = page.locator("#form-error");
  await page.getByRole("button", { name: "Đăng tin" }).first().click();
  await Promise.race([
    page.waitForURL(/\/listings\/[0-9a-f-]+/, { timeout: 45_000 }),
    alert.waitFor({ state: "visible", timeout: 45_000 }),
  ]);

  await page.screenshot({ path: "test-results/prod-smoke-outcome.png", fullPage: true });

  if (page.url().includes("/listings/new")) {
    const msg = await alert.innerText();
    throw new Error(`UPLOAD FAILED on prod, inline message was:\n"${msg}"`);
  }

  // Success: the page is the fresh listing detail. Prove the image really came from Blob.
  const srcs = await page.locator("main img").evaluateAll((imgs) => imgs.map((i) => i.src));
  console.log("IMG SRCS:", JSON.stringify(srcs));
  expect(srcs.join(" ")).toMatch(/blob\.vercel-storage\.com/);

  // Cleanup: delete the listing (server action also del()s the blobs).
  await page.locator("summary", { hasText: "Xóa tin đăng" }).click();
  await page.getByRole("button", { name: "Xóa vĩnh viễn" }).click();
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: "test-results/prod-smoke-deleted.png", fullPage: true });
});

// Sanity: login page + the fixed bundle is what's deployed (title only; no secrets).
test("prod: landing and login pages render", async ({ page }) => {
  test.skip(process.env.PROD_SMOKE !== "1", "explicit production smoke — set PROD_SMOKE=1");
  await page.goto("/");
  await expect(page.locator("h1")).toBeVisible();
  await page.goto("/login");
  await expect(page.getByLabel("Email")).toBeVisible();
});
