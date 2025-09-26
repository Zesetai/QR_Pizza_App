import { test, expect } from "@playwright/test";

test("home page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/Welcome/)).toBeVisible();
});

test("can navigate to build page", async ({ page }) => {
  await page.goto("/");
  await page.click("text=Build Your Own");
  await expect(page.getByText(/Build Your Own Pizza/)).toBeVisible();
});
