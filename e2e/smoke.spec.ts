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

  test("protected route shows sign-in gate", async ({ page }) => {
    await page.goto("/account");
    await expect(page.getByRole("heading", { name: /sign in required/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in/i })).toHaveAttribute(
      "href",
      /\/login/,
    );
  });

  test("agent route shows sign-in gate for unauthenticated users", async ({ page }) => {
    await page.goto("/agent");
    await expect(page.getByRole("heading", { name: /agent sign in required/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sign in as agent/i })).toHaveAttribute(
      "href",
      /\/login/,
    );
  });

  test("products page loads", async ({ page }) => {
    await page.goto("/products");
    await expect(page.locator("body")).toBeVisible();
  });

  test("search page loads", async ({ page }) => {
    await page.goto("/search?q=test");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.getByRole("heading", { name: /Results for/i })).toBeVisible();
  });

  test("seller kyc shows sign-in gate for unauthenticated users", async ({ page }) => {
    await page.goto("/seller/kyc");
    await expect(page.getByRole("heading", { name: /seller sign in required/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^sign in$/i })).toHaveAttribute(
      "href",
      /\/login/,
    );
  });
});
