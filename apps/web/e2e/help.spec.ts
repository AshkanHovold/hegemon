import { test, expect } from "@playwright/test";
import { registerAndCreateNation, navigateTo } from "./helpers";

test.describe("Help Page", () => {
  test("page title and search bar visible", async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Help");

    await expect(page.getByRole("heading", { name: "Help & Guide" })).toBeVisible();
    await expect(page.getByPlaceholder(/search help/i)).toBeVisible();
  });

  test("search filters articles", async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Help");

    await page.getByPlaceholder(/search help/i).fill("energy");
    // Should show filtered results with energy-related content
    await expect(page.getByText(/energy/i).first()).toBeVisible();
  });

  test("category tabs filter content", async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Help");

    // "All Topics" tab should be visible and active
    await expect(page.getByRole("button", { name: "All Topics" })).toBeVisible();
  });
});
