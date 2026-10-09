import { test, expect } from "@playwright/test";

test("saved settings show up right away", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(process.env.ADMIN_EMAIL ?? "admin@pass2u.test");
  await page.getByLabel("Mật khẩu").fill(process.env.ADMIN_PASSWORD ?? "admin12345");
  await page.getByRole("button", { name: "Đăng nhập" }).click();
  await expect(page).toHaveURL(/\/market/);
  await page.goto("/me/settings");
  const name = `Admin ${Date.now() % 10000}`;
  await page.getByLabel("Tên hiển thị").fill(name);
  await page.getByRole("button", { name: "Lưu thay đổi" }).click();
  await expect(page.getByText("Đã lưu.")).toBeVisible();
  await expect(page.getByLabel("Tên hiển thị")).toHaveValue(name);
  // Client-side navigation to the public profile must show the new name.
  await page.locator("details").evaluate((d) => ((d as HTMLDetailsElement).open = true));
  await page.locator('a[href^="/u/"]').dispatchEvent("click");
  await expect(page).toHaveURL(/\/u\//);
  await expect(page.getByRole("heading", { name })).toBeVisible();
});
