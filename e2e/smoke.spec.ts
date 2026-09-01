import { test, expect } from "@playwright/test";

test.describe("Paykop storefront smoke", () => {
  test("home page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Paykop/i);
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /sign in/i })).toBeVisible();
  });

  test("protected route redirects to login", async ({ page }) => {
    await page.goto("/account");
    await expect(page).toHaveURL(/\/login/);
  });

  test("agent route redirects unauthenticated users", async ({ page }) => {
    await page.goto("/agent");
    await expect(page).toHaveURL(/\/login/);
  });

  test("products page loads", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("body")).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto("/search?q=test");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /search/i })).toBeVisible();
  });

  test("seller kyc redirects unauthenticated users", async ({ page }) => {
    await page.goto("/seller/kyc");
    await expect(page).toHaveURL(/\/login/);
  });
});
