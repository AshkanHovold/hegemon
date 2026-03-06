import { test, expect } from "@playwright/test";
import { registerAndCreateNation, navigateTo } from "./helpers";

test.describe("Cyber Operations", () => {
  test("shows 'Build Cyber Center' warning when none exists", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Cyber Ops");
    await expect(page).toHaveURL(/\/game\/cyber/, { timeout: 10_000 });

    // New nations don't have a Cyber Center
    await expect(
      page.getByText("Build a Cyber Center to unlock cyber operations")
    ).toBeVisible();
  });

  test("stats bar shows values", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Cyber Ops");
    await expect(page).toHaveURL(/\/game\/cyber/, { timeout: 10_000 });

    // Stats bar should show Cyber Center, Active Op Slots, Energy, Firewall
    await expect(page.getByText("Cyber Center").first()).toBeVisible();
    await expect(page.getByText("Active Op Slots")).toBeVisible();
    await expect(page.getByText("Energy").first()).toBeVisible();
    await expect(page.getByText("Firewall").first()).toBeVisible();
  });
});
