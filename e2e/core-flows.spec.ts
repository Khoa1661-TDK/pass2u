import { test, expect, type Page, type Browser, type BrowserContext } from "@playwright/test";
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
      const m = log.slice(at).match(/Liên kết xác nhận: (\S+)/);
      if (m) return m[1];
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("No confirmation email logged for " + email);
}

async function newPage(browser: Browser, camera = false) {
  const ctx: BrowserContext = await browser.newContext({
    ...test.info().project.use,
    ...(camera ? { permissions: ["camera"] } : {}),
  });
  return ctx.newPage();
}

async function fillSignup(page: Page, name: string, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Họ và tên").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("password123");
}

// The student ID is presented during sign-up now: code, campus, and card photo.
// The name must match the name printed on the fixture card, so emails carry the tag.
async function signUp(browser: Browser, name: string, code: string, card: string, tag = "") {
  const page = await newPage(browser);
  const email = `${name.split(" ")[0].toLowerCase()}.${run}${tag}@example.com`;
  await fillSignup(page, name, email);
  await page.getByLabel("Cơ sở").selectOption("Hà Nội");
  await page.locator('input[name="idCard"]').setInputFiles(fx(card));
  // Let the card reader finish so it can't overwrite the typed code.
  await expect(page.getByText(/từ thẻ của bạn|Không đọc được/)).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Mã sinh viên").fill(code);
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByRole("heading", { name: "Kiểm tra hộp thư" })).toBeVisible();

  // Unconfirmed users can't reach the marketplace.
  await page.goto("/market");
  await expect(page).toHaveURL(/check-email/);

  await page.goto(await confirmLinkFor(email));
  await page.getByRole("link", { name: "Tiếp tục", exact: true }).click();
  await expect(page.getByRole("heading", { name: /Đang kiểm tra thẻ/ })).toBeVisible();

  // Pending users still can't browse.
  await page.goto("/market");
  await expect(page).toHaveURL(/verify/);
  return { page, email };
}

async function adminLogin(browser: Browser) {
  const page = await newPage(browser);
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "admin@pass2u.test");
  await page.getByLabel("Mật khẩu").fill(process.env.ADMIN_PASSWORD ?? "admin12345");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/market/);
  return page;
}

async function approve(admin: Page, email: string) {
  await admin.goto("/admin");
  await admin.waitForLoadState("networkidle");
  const row = admin.locator("ul > li", { hasText: email }).first();
  await expect(row.getByRole("img")).toBeVisible();
  // Server-side card checks are shown to the admin.
  await expect(row.getByLabel("Kiểm tra thẻ tự động")).toContainText("Có tên trên thẻ");
  await expect(row.getByLabel("Kiểm tra thẻ tự động")).toContainText("Có chữ FPT");
  await row.getByRole("button", { name: "Duyệt" }).click();
  await expect(admin.locator("li", { hasText: email })).toHaveCount(0, { timeout: 20_000 });
}

test("sign up with ID, verify, list, chat, reserve, complete", async ({ browser }) => {
  const seller = await signUp(browser, "Lan Nguyen", "SE180001", "card-lan.png");
  const buyer = await signUp(browser, "Minh Tran", "HE190002", "card-minh.png");

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
  await s.getByLabel("Thêm ảnh").setInputFiles([fx("item.png"), fx("item2.png")]);
  const title = `Desk fan ${run}`;
  await s.getByLabel("Tiêu đề").fill(title);
  await s.getByLabel("Giá").fill("120000");
  await s.getByLabel("Chuyên mục").selectOption("dorm");
  await s.getByLabel("Tình trạng").selectOption("good");
  await s.getByLabel("Mô tả").fill("Quiet three-speed fan, used one semester in Dom A.");
  await s.getByRole("button", { name: "Đăng tin" }).click();
  await expect(s.getByRole("heading", { name: title })).toBeVisible();
  await expect(s.getByText("120.000 ₫")).toBeVisible();

  // Buyer finds it with search + filters.
  const b = buyer.page;
  await b.goto(`/market?q=${encodeURIComponent(title)}&category=dorm&type=sell`);
  await b.getByRole("link", { name: new RegExp(title) }).click();
  await b.getByRole("button", { name: "Gửi tin nhắn" }).click();
  await expect(b).toHaveURL(/inbox\//);
  await expect(b.getByText("Chào bạn! Món này còn không?")).toBeVisible();
  await b.getByRole("button", { name: "Xin giữ món" }).click();
  await expect(b.getByText("Đang chờ người bán chấp nhận")).toBeVisible();

  // Seller accepts, then completes.
  await s.goto("/inbox");
  await s.getByRole("link", { name: /Minh Tran/ }).click();
  await s.getByRole("textbox", { name: "Tin nhắn" }).fill("Sure, meet at the library at 5pm?");
  await s.getByRole("button", { name: "Gửi", exact: true }).click();
  await expect(s.getByText("meet at the library")).toBeVisible();
  await s.getByRole("button", { name: "Chấp nhận" }).click();
  await expect(s.getByText("Đã giữ cho người mua này")).toBeVisible();
  await s.getByRole("button", { name: "Đánh dấu đã bán xong" }).click();
  await expect(s.getByText("Giao dịch đã hoàn tất")).toBeVisible();

  // Completed listings leave the market but show on the profile.
  await b.goto(`/market?q=${encodeURIComponent(title)}`);
  await expect(b.getByRole("heading", { name: "Không có tin khớp bộ lọc" })).toBeVisible();
  await s.goto("/me?tab=completed");
  await expect(s.getByText(title)).toBeVisible();

  // Moderation: a report can get a listing removed.
  await s.goto("/listings/new");
  await s.getByLabel("Thêm ảnh").setInputFiles(fx("item.png"));
  await s.getByRole("radio", { name: "Tặng miễn phí" }).check({ force: true });
  await s.getByLabel("Tiêu đề").fill(`Old notes ${run}`);
  await s.getByLabel("Chuyên mục").selectOption("textbooks");
  await s.getByLabel("Tình trạng").selectOption("fair");
  await s.getByLabel("Mô tả").fill("Handwritten MAE101 notes, free to a good home.");
  await s.getByRole("button", { name: "Đăng tin" }).click();
  await expect(s.getByText("Miễn phí", { exact: true }).first()).toBeVisible();
  const url = s.url();

  await b.goto(url);
  await b.getByText("Báo cáo tin đăng này").click();
  await b.getByLabel("Có vấn đề gì?").fill("Testing the report flow");
  await b.getByRole("button", { name: "Gửi báo cáo" }).click();
  await expect(b.getByText("Quản trị viên sẽ xem xét")).toBeVisible();

  await admin.goto("/admin/reports");
  await admin.locator("li", { hasText: `Old notes ${run}` }).getByRole("button", { name: "Gỡ tin đăng" }).click();
  await b.goto(url);
  await expect(b.getByRole("heading", { name: "Trang này không tồn tại" })).toBeVisible();
});

test("signed-out visitors are sent to sign in", async ({ page }) => {
  for (const p of ["/market", "/inbox", "/admin", "/listings/new"]) {
    await page.goto(p);
    await expect(page).toHaveURL(/\/login/);
  }
});

test("admin opens a student record and approves from it", async ({ browser }) => {
  const student = await signUp(browser, "Lan Nguyen", "SE180001", "card-lan.png", "r");
  const admin = await adminLogin(browser);

  await admin.goto("/admin/users");
  await admin.getByLabel("Tìm sinh viên").fill(student.email);
  await admin.getByLabel("Tìm sinh viên").press("Enter");
  await admin.getByRole("link", { name: "Lan Nguyen" }).click();
  await expect(admin).toHaveURL(/\/admin\/users\/[0-9a-f-]{36}/);

  await expect(admin.getByRole("heading", { name: "Lan Nguyen", level: 2 })).toBeVisible();
  await expect(admin.getByText("SE180001", { exact: true })).toBeVisible();
  await expect(admin.getByRole("img", { name: /Ảnh thẻ sinh viên do Lan Nguyen nộp/ })).toBeVisible();
  await expect(admin.getByLabel("Kiểm tra thẻ tự động")).toContainText("Có tên trên thẻ");
  await expect(admin.getByLabel("Kiểm tra thẻ tự động")).toContainText("Có chữ FPT");
  await expect(admin.getByText(/0 tin · 0 đang hoạt động/)).toBeVisible();
  await expect(admin.getByRole("link", { name: "Xem trang công khai" })).toBeVisible();

  await admin.getByRole("button", { name: "Duyệt" }).click();
  await expect(admin.getByText("Đã duyệt")).toBeVisible({ timeout: 20_000 });

  // The student can browse right after.
  await student.page.goto("/market");
  await expect(student.page).toHaveURL(/market/);
});

test("card reader fills the student code from a photo", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await newPage(browser);
  await page.goto("/signup");
  await page.locator('input[name="idCard"]').setInputFiles(fx("card-ocr.png"));
  await expect(page.getByText("Đã đọc được SE190123 từ thẻ của bạn", { exact: false })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel("Mã sinh viên")).toHaveValue("SE190123");
});

test("scanner opens the camera and captures the framed card", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await newPage(browser, true);
  await page.goto("/signup");
  await page.getByRole("button", { name: "Quét thẻ" }).click();
  const dialog = page.getByRole("dialog", { name: "Quét thẻ sinh viên của bạn" });
  await expect(dialog).toBeVisible();
  await page.waitForFunction(() => (document.querySelector("video") as HTMLVideoElement)?.videoWidth > 0);
  if (process.env.SHOT_DIR) await page.screenshot({ path: `${process.env.SHOT_DIR}/scanner.png` });
  await dialog.getByRole("button", { name: "Chụp thẻ" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByAltText("Xem trước thẻ sinh viên của bạn")).toBeVisible();
  const files = await page.locator('input[name="idCard"]').evaluate((i) => (i as HTMLInputElement).files?.length);
  expect(files).toBe(1);
});

test("server rejects a card that doesn't match or isn't an FPT card", async ({ browser }) => {
  test.setTimeout(120_000);
  const page = await newPage(browser);
  await fillSignup(page, "Checktest Hoa", `checktest.${run}@example.com`);
  await page.getByLabel("Cơ sở").selectOption("Hà Nội");
  await page.locator('input[name="idCard"]').setInputFiles(fx("card-lan.png"));
  await expect(page.getByText(/từ thẻ của bạn|Không đọc được/)).toBeVisible({ timeout: 60_000 });
  await page.getByLabel("Mã sinh viên").fill("SE111111");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByText("Thẻ của bạn ghi SE180001, nhưng bạn nhập SE111111")).toBeVisible({ timeout: 60_000 });

  await page.locator('input[name="idCard"]').setInputFiles(fx("item.png"));
  await expect(page.getByText(/từ thẻ của bạn|Không đọc được/)).toBeVisible({ timeout: 60_000 });
  // The failed submit cleared the password (it is never echoed back), so type it again.
  await page.getByLabel("Mật khẩu").fill("password123");
  await page.getByLabel("Mã sinh viên").fill("SE111111");
  await page.getByLabel("Cơ sở").selectOption("Hà Nội");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByText("Đây không giống thẻ sinh viên Đại học FPT")).toBeVisible({ timeout: 60_000 });
  await expect(page).toHaveURL(/signup/);
});
