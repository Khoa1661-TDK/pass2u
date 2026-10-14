import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import bcrypt from "bcryptjs";
import postgres from "postgres";

const LOG = process.env.NEXT_LOG ?? "next.log";
const dbUrl = process.env.DATABASE_URL ?? readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.*)$/m)?.[1]?.replace(/^"|"$/g, "");

// A throwaway approved student, made directly so these tests skip card OCR.
async function makeStudent(password: string) {
  const email = `pw.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}@example.com`;
  const sql = postgres(dbUrl!, { max: 1, onnotice: () => {} });
  await sql`
    insert into users (email, password_hash, display_name, email_verified_at, verification_status, campus)
    values (${email}, ${await bcrypt.hash(password, 10)}, 'Pw Tester', now(), 'approved', 'Hà Nội')`;
  await sql.end();
  return email;
}

async function resetLinkFor(email: string) {
  for (let i = 0; i < 20; i++) {
    const log = readFileSync(LOG, "utf8");
    const at = log.lastIndexOf(`to=${email}`);
    if (at >= 0) {
      const m = log.slice(at).match(/Liên kết đặt lại mật khẩu: (\S+)/);
      if (m) return m[1];
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error("No reset email logged for " + email);
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập" }).click();
}

test("forgot password sends a one-time link that sets a new password", async ({ page, browser }) => {
  const email = await makeStudent("oldpass123");
  // A session from before the reset gets signed out by it.
  const other = await (await browser.newContext()).newPage();
  await login(other, email, "oldpass123");
  await expect(other).toHaveURL(/\/market/);

  await page.goto("/login");
  await page.getByRole("link", { name: "Quên mật khẩu?" }).click();
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Gửi liên kết" }).click();
  await expect(page.getByText(/Nếu email này có tài khoản/)).toBeVisible();

  // Unknown emails get the same answer, so the form can't reveal who has an account.
  await page.getByLabel("Email").fill("nobody.here@example.com");
  await page.getByRole("button", { name: "Gửi liên kết" }).click();
  await expect(page.getByText(/Nếu email này có tài khoản/)).toBeVisible();

  const link = await resetLinkFor(email);
  await page.goto(link);
  await page.getByLabel("Mật khẩu mới").fill("newpass123");
  await page.getByRole("button", { name: "Lưu mật khẩu mới" }).click();
  await expect(page).toHaveURL(/\/market/);

  // The link works once.
  await page.goto(link);
  await expect(page.getByRole("heading", { name: "Link này đã hết hạn" })).toBeVisible();

  await other.goto("/market");
  await expect(other).toHaveURL(/\/login/);
  await login(other, email, "oldpass123");
  await expect(other.getByText("Email hoặc mật khẩu không đúng.")).toBeVisible();
  await login(other, email, "newpass123");
  await expect(other).toHaveURL(/\/market/);
});

test("change password in settings keeps this device signed in", async ({ page, browser }) => {
  const email = await makeStudent("oldpass123");
  const other = await (await browser.newContext()).newPage();
  await login(other, email, "oldpass123");
  await login(page, email, "oldpass123");
  await expect(page).toHaveURL(/\/market/);

  await page.goto("/me/settings");
  await page.getByLabel("Mật khẩu hiện tại").fill("wrongpass1");
  await page.getByLabel("Mật khẩu mới").fill("newpass123");
  await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
  await expect(page.getByText("Mật khẩu hiện tại không đúng.")).toBeVisible();

  await page.getByLabel("Mật khẩu hiện tại").fill("oldpass123");
  await page.getByLabel("Mật khẩu mới").fill("newpass123");
  await page.getByRole("button", { name: "Đổi mật khẩu" }).click();
  await expect(page.getByText(/Đã đổi mật khẩu/)).toBeVisible();

  await page.goto("/market");
  await expect(page).toHaveURL(/\/market/);
  await other.goto("/market");
  await expect(other).toHaveURL(/\/login/);
});
