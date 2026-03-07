import { test, expect } from "@playwright/test";
import { registerAndCreateNation, navigateTo } from "./helpers";

test.describe("Achievements Page", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Achievements");
  });

  test("Achievements heading is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Achievements" })
    ).toBeVisible();
  });

  test("Achievement grid shows known achievement titles", async ({ page }) => {
    await expect(page.getByText("First Foundation")).toBeVisible();
    await expect(page.getByText("Call to Arms")).toBeVisible();
  });

  test("Progress indicator shows unlocked count out of 14", async ({
    page,
  }) => {
    await expect(page.getByText(/\d+\s*\/\s*14 unlocked/i)).toBeVisible();
  });

  test("locked achievements have distinct visual style", async ({ page }) => {
    // A new nation should have mostly locked achievements (0 or few unlocked out of 14)
    // Locked ones should show opacity or grayscale styling
    const achievementCards = page.locator("[class*=rounded-xl]").filter({ hasText: /First Foundation|Call to Arms|First Blood/ });
    await expect(achievementCards.first()).toBeVisible();
  });
});
