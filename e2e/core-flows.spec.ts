import { test, expect, type Page, type Browser, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const fx = (f: string) => path.join(__dirname, "fixtures", f);
const run = Date.now().toString(36);

// One code, one account: earlier runs' test accounts still hold these
// codes, so release them (test accounts only) before signing up again.
const dbUrl = process.env.DATABASE_URL ?? readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");
async function releaseCode(code: string) {
  const sql = postgres(dbUrl!, { max: 1, onnotice: () => {} });
  await sql`update users set verification_status = 'rejected' where student_code = ${code} and email like '%@example.com'`;
  await sql.end();
}

async function newPage(browser: Browser) {
  const ctx: BrowserContext = await browser.newContext({ ...test.info().project.use });
  return ctx.newPage();
}

async function fillSignup(page: Page, name: string, email: string) {
  await page.goto("/signup");
  await page.getByLabel("Họ và tên").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("password123");
  // Identity details are mandatory so admins can locate a student if needed.
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await page.getByLabel("Ngày sinh").fill("2002-01-01");
  await page.getByLabel("Nơi bạn đang ở").fill("KTX FPT Hà Nội");
}

// Sign-up takes the student code and campus. No card photo.
async function signUp(browser: Browser, name: string, code: string, tag = "") {
  await releaseCode(code);
  const page = await newPage(browser);
  const email = `${name.split(" ")[0].toLowerCase()}.${run}${tag}@example.com`;
  await fillSignup(page, name, email);
  await page.getByLabel("Cơ sở").selectOption("Hà Nội");
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page.getByLabel("Mã sinh viên").fill(code);
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  // No email confirmation: sign-up goes straight to the approval wait.
  await expect(page.getByRole("heading", { name: /Đang kiểm tra thông tin/ })).toBeVisible();

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
  // The admin checks the typed details; there is no card photo.
  await expect(row.getByRole("img")).toHaveCount(0);
  await row.getByRole("button", { name: "Duyệt" }).click();
  await expect(admin.locator("li", { hasText: email })).toHaveCount(0, { timeout: 20_000 });
}

test("sign up with student code, verify, list, chat, reserve, complete", async ({ browser }) => {
  const seller = await signUp(browser, "Lan Nguyen", "SE180001");
  const buyer = await signUp(browser, "Minh Tran", "HE190002");

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
  await expect(b.getByText("Đang chờ người bán chấp nhận")).toBeVisible({ timeout: 15_000 });

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
  const student = await signUp(browser, "Lan Nguyen", "SE180001", "r");
  const admin = await adminLogin(browser);

  await admin.goto("/admin/users");
  await admin.getByLabel("Tìm sinh viên").fill(student.email);
  await admin.getByLabel("Tìm sinh viên").press("Enter");
  // Wait for the search results, or the click lands on the old list mid-reload.
  await admin.waitForURL(/\?q=/);
  await admin.getByRole("link", { name: "Lan Nguyen" }).click();
  await expect(admin).toHaveURL(/\/admin\/users\/[0-9a-f-]{36}/);

  await expect(admin.getByRole("heading", { name: "Lan Nguyen", level: 2 })).toBeVisible();
  await expect(admin.getByText("SE180001", { exact: true })).toBeVisible();
  // The full identity dossier the student provided at sign-up.
  await expect(admin.getByText("0912345678", { exact: true })).toBeVisible();
  await expect(admin.getByText("2002-01-01", { exact: true })).toBeVisible();
  await expect(admin.getByText("KTX FPT Hà Nội", { exact: true })).toBeVisible();
  await expect(admin.getByText("Ảnh thẻ đã nộp")).toHaveCount(0);
  await expect(admin.getByText(/0 tin · 0 đang hoạt động/)).toBeVisible();
  await expect(admin.getByRole("link", { name: "Xem trang công khai" })).toBeVisible();

  await admin.getByRole("button", { name: "Duyệt" }).click();
  await expect(admin.getByText("Đã duyệt")).toBeVisible({ timeout: 20_000 });

  // The student can browse right after.
  await student.page.goto("/market");
  await expect(student.page).toHaveURL(/market/);
});

test("a rejected student fixes the code and goes back to the queue", async ({ browser }) => {
  await releaseCode("SE180004");
  const student = await signUp(browser, "Hoa Le", "SE180003", "x");
  const admin = await adminLogin(browser);
  await admin.goto("/admin");
  const row = admin.locator("ul > li", { hasText: student.email }).first();
  await row.getByText("Từ chối…").click();
  await row.getByRole("button", { name: "Xác nhận từ chối" }).click();
  await expect(admin.locator("li", { hasText: student.email })).toHaveCount(0, { timeout: 20_000 });

  const p = student.page;
  await p.goto("/verify");
  await expect(p.getByText("Thông tin trước của bạn không được duyệt")).toBeVisible();
  await p.getByLabel("Mã sinh viên").fill("SE180004");
  await p.getByRole("button", { name: "Gửi duyệt lại" }).click();
  await expect(p.getByRole("heading", { name: /Đang kiểm tra thông tin/ })).toBeVisible();
  await expect(p.getByText("SE180004", { exact: true })).toBeVisible();
});

test("one student code makes only one account", async ({ browser }) => {
  // The main flow already holds HE190002 with an approved account.
  const page = await newPage(browser);
  await fillSignup(page, "Minh Tran", `minh.${run}dup@example.com`);
  await page.getByLabel("Cơ sở").selectOption("Hà Nội");
  await page.getByLabel("Mã sinh viên").fill("HE190002");
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByText("Mã sinh viên này đã được dùng cho một tài khoản khác")).toBeVisible();
});
