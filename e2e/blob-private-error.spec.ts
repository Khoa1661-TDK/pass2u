// Regression test for the private-Blob-store incident: a failing upload must
// show an actionable message inside the form, not crash the page (raw 500 with
// digest). The app must be pointed at the fake Blob API first (the @vercel/blob
// SDK honors VERCEL_BLOB_API_URL), with any dummy token so it takes the Blob
// code path:
//   node e2e/mock-blob-api.cjs &
//   VERCEL_BLOB_API_URL=http://127.0.0.1:4555 BLOB_READ_WRITE_TOKEN=blobur_us1_0_st001_mock npm run dev
import { test, expect, type Page, type Browser, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";
import path from "node:path";
import postgres from "postgres";

const fx = (f: string) => path.join(__dirname, "fixtures", f);
const run = Date.now().toString(36);
const dbUrl =
  process.env.DATABASE_URL ??
  readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");

// Same helpers as core-flows.spec.ts (kept local to avoid touching that suite).
async function releaseCode(code: string) {
  const sql = postgres(dbUrl!, { max: 1, onnotice: () => {} });
  await sql`update users set verification_status = 'rejected' where student_code = ${code} and email like '%@example.com'`;
  await sql.end();
}

async function newPage(browser: Browser) {
  const ctx: BrowserContext = await browser.newContext({ ...test.info().project.use });
  return ctx.newPage();
}

async function approvedSeller(browser: Browser) {
  const code = `SE${Math.floor(200000 + Math.random() * 699999)}`;
  await releaseCode(code);
  const page = await newPage(browser);
  const email = `blobtest.${run}@example.com`;
  await page.goto("/signup");
  await page.getByLabel("Họ và tên").fill("Blob Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill("password123");
  await page.getByLabel("Số điện thoại").fill("0912345678");
  await page.getByLabel("Ngày sinh").fill("2002-01-01");
  await page.getByLabel("Nơi bạn đang ở").fill("KTX FPT Hà Nội");
  await page.getByLabel("Cơ sở").selectOption("Hà Nội");
  await page.getByLabel("Mã sinh viên").fill(code);
  await page.getByRole("button", { name: "Tạo tài khoản" }).click();
  await expect(page.getByRole("heading", { name: /Đang kiểm tra thông tin/ })).toBeVisible();

  const admin = await newPage(browser);
  await admin.goto("/login");
  await admin.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "admin@pass2u.local");
  await admin.getByLabel("Mật khẩu").fill(process.env.ADMIN_PASSWORD ?? "admin12345");
  await admin.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(admin).toHaveURL(/\/market/);
  await admin.goto("/admin");
  await admin.waitForLoadState("networkidle");
  await admin.locator("ul > li", { hasText: email }).first().getByRole("button", { name: "Duyệt" }).click();
  await expect(admin.locator("li", { hasText: email })).toHaveCount(0, { timeout: 20_000 });

  await page.goto("/verify");
  await expect(page).toHaveURL(/market/, { timeout: 20_000 });
  return page;
}

test("blob private-store upload error shows inline, form survives", async ({ browser }) => {
  test.setTimeout(90_000);
  const page = await approvedSeller(browser);

  await page.goto("/listings/new");
  await page.getByLabel("Thêm ảnh").setInputFiles(fx("item.png"));
  await page.getByLabel("Tiêu đề").fill(`Broken fan ${run}`);
  await page.getByLabel("Giá").fill("150000");
  await page.getByLabel("Chuyên mục").selectOption("dorm");
  await page.getByLabel("Tình trạng").selectOption("good");
  await page.getByLabel("Mô tả").fill("Reproducing the private Blob store incident.");
  await page.getByRole("button", { name: "Đăng tin" }).click();

  // 1. Actionable Vietnamese message, straight from blobError() in storage.ts.
  // #form-error, not getByRole("alert"): Next.js also mounts an empty route-announcer alert.
  const alert = page.locator("#form-error");
  await expect(alert).toContainText("Blob store private cũ", { timeout: 30_000 });
  await expect(alert).toContainText("Environment Variables");
  // 2. The raw SDK/API text must not leak to the user.
  await expect(page.getByText(/Cannot use public access on a private store/)).toHaveCount(0);
  // 3. No crash: still on the form, listing was NOT created.
  const title = `Broken fan ${run}`;
  await expect(page.getByRole("button", { name: "Đăng tin" }).first()).toBeVisible();
  expect(page.url()).toContain("/listings/new");
  const sql = postgres(dbUrl!, { max: 1, onnotice: () => {} });
  const [cnt] = await sql<{ n: string }[]>`select count(*)::text n from listings where title = ${title}`;
  await sql.end();
  expect(Number(cnt.n)).toBe(0);

  await page.screenshot({ path: "test-results/blob-private-error.png", fullPage: true });
});
