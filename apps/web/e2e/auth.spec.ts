import { test, expect } from "@playwright/test";
import { registerUser, registerAndCreateNation, loginViaUI } from "./helpers";

test.describe("Authentication", () => {
  test("register via UI → redirects to create-nation", async ({ page }) => {
    await page.goto("/register");

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await page.getByPlaceholder("Commander_X").fill(`e2e_reg_${id}`);
    await page.getByPlaceholder("commander@hegemon.io").fill(`e2e-reg-${id}@test.local`);
    await page.getByPlaceholder("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").fill("Test123!");
    await page.getByRole("button", { name: "Create Account" }).click();

    // Should redirect to /game which then redirects to create-nation (no nation yet)
    await expect(page).toHaveURL(/create-nation/, { timeout: 10_000 });
    await expect(page.getByText("Name Your Nation")).toBeVisible();
  });

  test("login with valid credentials → dashboard", async ({ page }) => {
    // Register a user with a nation first
    const user = await registerAndCreateNation(page);

    // Clear localStorage and go to login
    await page.evaluate(() => localStorage.clear());
    await loginViaUI(page, user.email, user.password);

    await expect(page).toHaveURL(/\/game/, { timeout: 10_000 });
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("login with invalid credentials → shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByPlaceholder("commander@hegemon.io").fill("nonexistent@test.local");
    await page.getByPlaceholder("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").fill("wrongpassword");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText(/invalid credentials/i)).toBeVisible({ timeout: 5_000 });
  });

  test("protected route → redirects to /login when not authenticated", async ({ page }) => {
    // Navigate to base URL first so we have a page context
    await page.goto("/");
    await page.evaluate(() => localStorage.removeItem("hegemon-token"));
    await page.goto("/game");

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test("public-only route → redirects to /game when authenticated", async ({ page }) => {
    await registerAndCreateNation(page);

    // Try to visit /login while authenticated
    await page.goto("/login");
    await expect(page).toHaveURL(/\/game/, { timeout: 10_000 });
  });

  test("logout → returns to landing page", async ({ page }) => {
    await registerAndCreateNation(page);

    // Click logout in sidebar (button contains ⏻ + "Logout" text)
    await page.locator("aside").getByText("Logout").click();

    // After logout, ProtectedRoute redirects to /login
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
