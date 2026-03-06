import { test, expect } from "@playwright/test";
import { registerAndCreateNation, navigateTo } from "./helpers";

test.describe("Alliance", () => {
  test("shows no-alliance view with browse/create tabs", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Alliance");
    await expect(page).toHaveURL(/\/game\/alliance/, { timeout: 10_000 });

    // Should see the no-alliance view
    await expect(
      page.getByText("Join or create an alliance")
    ).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("button", { name: "Browse Alliances" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Create Alliance" })).toBeVisible();
  });

  test("create alliance via UI", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Alliance");
    await expect(page).toHaveURL(/\/game\/alliance/, { timeout: 10_000 });

    // Switch to Create tab
    await page.getByRole("button", { name: "Create Alliance" }).click();

    // Fill in alliance details using placeholders
    const id = `${Date.now()}`.slice(-6);
    await page.getByPlaceholder("Steel Pact").fill(`TestAlliance${id}`);
    await page.getByPlaceholder("SP").fill(`T${id.slice(0, 4)}`);

    // Click the submit button (the last "Create Alliance" button in the form)
    await page.locator("form, .space-y-4").last().getByRole("button", { name: /Create Alliance/i }).click();

    // Should now see the alliance view with member list
    await expect(page.getByRole("heading", { name: "Members" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText("(you)")).toBeVisible();
  });
});
