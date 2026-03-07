import { test, expect } from "@playwright/test";
import { registerAndCreateNation, grantDevResources, navigateTo } from "./helpers";

test.describe("Military", () => {
  test("troop table shows all 5 unit types", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Military");
    await expect(page).toHaveURL(/\/game\/military/, { timeout: 10_000 });

    // All 5 unit types should be visible in the troop overview table
    const table = page.locator("table");
    await expect(table.getByText("Infantry")).toBeVisible();
    await expect(table.getByText("Tanks")).toBeVisible();
    await expect(table.getByText("Air Force")).toBeVisible();
    await expect(table.getByText("Drones")).toBeVisible();
    await expect(table.getByText("Navy")).toBeVisible();
  });

  test("train troops → queue visible", async ({ page }) => {
    const user = await registerAndCreateNation(page);

    // Grant resources so we can afford training
    await grantDevResources(page, user.token);

    await navigateTo(page, "Military");
    await expect(page).toHaveURL(/\/game\/military/, { timeout: 10_000 });

    // Set quantity and click Train
    const trainButton = page.getByRole("button", { name: /^Train \d+/ });
    await expect(trainButton).toBeVisible();
    await trainButton.click();

    // Training queue section should appear
    await expect(page.getByText("Training Queue")).toBeVisible({ timeout: 5_000 });
  });

  test("attack flow: select target → confirm dialog appears", async ({ page }) => {
    const attacker = await registerAndCreateNation(page);
    await grantDevResources(page, attacker.token);

    await navigateTo(page, "Military");
    await expect(page).toHaveURL(/\/game\/military/, { timeout: 10_000 });

    // Wait for nation list to load
    const nationButtons = page.locator(".max-h-36 button");
    await expect(nationButtons.first()).toBeVisible({ timeout: 10_000 });
    await nationButtons.first().click();

    // Select troops
    await page.getByText("Send All").click();

    // Click attack button
    const attackBtn = page.getByRole("button", { name: /^Attack / });
    await attackBtn.scrollIntoViewIfNeeded();
    await expect(attackBtn).toBeEnabled({ timeout: 5_000 });
    await attackBtn.click();

    // Confirm dialog should appear with attack details
    await expect(page.getByRole("heading", { name: "Confirm Attack" })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText(/troops.*against/i)).toBeVisible();
    await expect(page.getByRole("button", { name: "Launch Attack" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Cancel the attack (targets are likely shielded in test)
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("heading", { name: "Confirm Attack" })).not.toBeVisible();
  });
});
