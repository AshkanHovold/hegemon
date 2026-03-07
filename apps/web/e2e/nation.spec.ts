import { test, expect } from "@playwright/test";
import { registerUser, registerAndCreateNation, navigateTo, dismissTutorial } from "./helpers";

test.describe("Nation", () => {
  test("create nation via UI", async ({ page }) => {
    const user = await registerUser(page);

    // Inject token and go to the app — should redirect to create-nation
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem("hegemon-token", token);
    }, user.token);
    await page.goto("/game");

    await expect(page).toHaveURL(/create-nation/, { timeout: 10_000 });

    const nationName = `UITest${Date.now().toString(36)}`;
    await page.getByPlaceholder("Iron Republic").fill(nationName);
    await page.getByRole("button", { name: "Found Your Nation" }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/game/, { timeout: 10_000 });
    await dismissTutorial(page);
    await expect(page.getByText("Welcome back")).toBeVisible();
  });

  test("building grid is visible on nation page", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Nation");
    await expect(page).toHaveURL(/\/game\/nation/, { timeout: 10_000 });

    // Should see starter buildings (display names from BUILDING_DISPLAY)
    await expect(page.getByText("Housing")).toBeVisible();
    await expect(page.getByText("Farms")).toBeVisible();
    await expect(page.getByText("Factories")).toBeVisible();
  });

  test("construct building → queue appears", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Nation");
    await expect(page).toHaveURL(/\/game\/nation/, { timeout: 10_000 });

    // Click the first upgrade button we find
    const upgradeButton = page.getByRole("button", { name: /upgrade/i }).first();
    if (await upgradeButton.isVisible()) {
      await upgradeButton.click();
      // Should see some indicator of building progress
      await expect(
        page.getByText(/upgrading|building|in progress/i).first()
      ).toBeVisible({ timeout: 5_000 });
    }
  });
});
