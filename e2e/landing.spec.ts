import { test, expect } from "@playwright/test";

for (const width of [360, 768, 1280]) {
  test(`landing has no horizontal scroll at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    await expect(page.getByRole("searchbox", { name: "Search listings" })).toBeVisible();
  });
}

test("hero search and categories lead into the market", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("searchbox", { name: "Search listings" }).fill("quạt");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/login\?next=%2Fmarket%3Fq%3D/);
  await page.goto("/");
  await page.getByRole("link", { name: /Electronics/ }).click();
  await expect(page).toHaveURL(/next=%2Fmarket%3Fcategory%3Delectronics/);
});

