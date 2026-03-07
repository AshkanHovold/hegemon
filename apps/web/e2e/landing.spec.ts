import { test, expect } from "@playwright/test";

test.describe("Landing Page", () => {
  test("hero section shows title and CTA buttons", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "HEGEMON" })).toBeVisible();
    await expect(page.getByText("Build your nation")).toBeVisible();
    await expect(page.getByRole("link", { name: /Play Now/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Login/i }).first()).toBeVisible();
  });

  test("stats bar shows game metrics", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByText("Building Types", { exact: true })).toBeVisible();
    await expect(page.getByText("Troop Types", { exact: true })).toBeVisible();
  });

  test("feature cards visible", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { name: "Economy" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Military" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Cyber Warfare" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Alliances" })).toBeVisible();
  });

  test("Play Now links to register page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /Play Now/i }).first().click();
    await expect(page).toHaveURL(/\/register/, { timeout: 5_000 });
  });

  test("Login links to login page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: /Login/i }).first().click();
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
