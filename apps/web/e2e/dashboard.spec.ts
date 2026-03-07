import { test, expect } from "@playwright/test";
import { registerAndCreateNation, navigateTo } from "./helpers";

test.describe("Dashboard", () => {
  test("shows welcome message with username", async ({ page }) => {
    const { username } = await registerAndCreateNation(page);

    await expect(page.getByText(`Welcome back, ${username}`)).toBeVisible();
  });

  test("all 6 resource cards are visible", async ({ page }) => {
    await registerAndCreateNation(page);

    // Resource cards in main content area
    const main = page.getByRole("main");
    await expect(main.getByText("Cash")).toBeVisible();
    await expect(main.getByText("Materials")).toBeVisible();
    await expect(main.getByText("Tech Points")).toBeVisible();
    await expect(main.getByText("Population")).toBeVisible();
    await expect(main.getByText("Food")).toBeVisible();
  });

  test("round status bar shows round info", async ({ page }) => {
    await registerAndCreateNation(page);

    await expect(page.getByText(/Round \d+/)).toBeVisible();
    await expect(page.getByText(/Day \d+ of \d+/)).toBeVisible();
  });

  test("quick action links navigate correctly", async ({ page }) => {
    await registerAndCreateNation(page);

    // Verify quick action links are present
    const quickActions = page.locator("main");
    await expect(quickActions.getByRole("link", { name: "Build" })).toBeVisible();
    await expect(quickActions.getByRole("link", { name: "Train" })).toBeVisible();
    await expect(quickActions.getByRole("link", { name: "Cyber Ops" })).toBeVisible();
    await expect(quickActions.getByRole("link", { name: "Market" })).toBeVisible();

    // Click Build and verify navigation
    await quickActions.getByRole("link", { name: "Build" }).click();
    await expect(page).toHaveURL(/\/game\/nation/, { timeout: 10_000 });
  });

  test("shield status shown for new nation", async ({ page }) => {
    await registerAndCreateNation(page);

    await expect(page.getByText("Beginner Shield Active")).toBeVisible();
  });

  test("energy status section visible", async ({ page }) => {
    await registerAndCreateNation(page);

    await expect(page.getByText("Energy Status")).toBeVisible();
  });

  test("daily bonus button exists", async ({ page }) => {
    await registerAndCreateNation(page);

    await expect(page.getByRole("button", { name: "Claim Daily Bonus" })).toBeVisible();
  });
});
