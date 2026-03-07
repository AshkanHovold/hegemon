import { test, expect } from "@playwright/test";
import { registerAndCreateNation, grantDevResources, navigateTo } from "./helpers";

test.describe("Rankings", () => {
  test("rankings table loads with data", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Rankings");
    await expect(page).toHaveURL(/\/game\/rankings/, { timeout: 10_000 });

    // Wait for table to load
    await expect(page.locator("table")).toBeVisible({ timeout: 10_000 });
    // Table should have at least one row with a nation name
    await expect(page.locator("table tbody tr").first()).toBeVisible();
  });

  test("filter tabs re-sort the table", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Rankings");
    await expect(page).toHaveURL(/\/game\/rankings/, { timeout: 10_000 });

    // Click military filter
    await page.getByRole("button", { name: "military" }).click();
    // The column header should change to "Military"
    await expect(page.getByRole("columnheader", { name: "Military" })).toBeVisible();

    // Click economic filter
    await page.getByRole("button", { name: "economic" }).click();
    await expect(page.getByRole("columnheader", { name: "Economic" })).toBeVisible();

    // Click overall filter (back to default)
    await page.getByRole("button", { name: "overall" }).click();
    await expect(page.getByRole("columnheader", { name: "Score" })).toBeVisible();
  });
});
