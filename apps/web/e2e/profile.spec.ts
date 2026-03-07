import { test, expect } from "@playwright/test";
import { registerAndCreateNation, navigateTo } from "./helpers";

test.describe("Profile Page", () => {
  test.beforeEach(async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Profile");
  });

  test("Profile & Settings heading is visible", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Profile & Settings" })
    ).toBeVisible();
  });

  test("Lifetime stats section shows stat labels", async ({ page }) => {
    const stats = ["Rounds Played", "Total Wins"];
    for (const label of stats) {
      await expect(page.getByText(label)).toBeVisible();
    }
  });

  test("Nation settings section shows round info", async ({ page }) => {
    await expect(page.getByText(/round/i)).toBeVisible();
  });

  test("Account settings section exists", async ({ page }) => {
    await expect(page.getByText(/account settings/i)).toBeVisible();
  });
});
