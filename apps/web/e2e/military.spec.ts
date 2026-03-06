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

  test("attack flow: search → select → attack → result banner", async ({ page, request }) => {
    const API_URL = process.env.API_URL || "http://localhost:4100";

    // Create attacker with a nation
    const attacker = await registerAndCreateNation(page);

    // Create a second user as defender (via API)
    const id = `${Date.now()}-def`;
    const regRes = await request.post(`${API_URL}/auth/register`, {
      data: { email: `e2e-${id}@test.local`, username: `e2e_${id}`, password: "Test123!" },
    });
    expect(regRes.ok()).toBeTruthy();
    const { token: defenderToken } = await regRes.json();

    // Get round and create defender nation
    const roundRes = await request.get(`${API_URL}/round/active`);
    const { round } = await roundRes.json();
    const defenderName = `DefNation-${id}`;
    await request.post(`${API_URL}/nation`, {
      data: { name: defenderName, roundId: round.id },
      headers: { Authorization: `Bearer ${defenderToken}` },
    });

    // Grant resources to attacker
    await grantDevResources(page, attacker.token);

    // Navigate to military page
    await navigateTo(page, "Military");
    await expect(page).toHaveURL(/\/game\/military/, { timeout: 10_000 });

    // Search for the defender nation
    await page.getByPlaceholder("Search nations...").fill(defenderName);

    // Select the target
    const targetButton = page.getByText(defenderName);
    await expect(targetButton).toBeVisible({ timeout: 5_000 });
    await targetButton.click();

    // Click attack
    const attackButton = page.getByRole("button", { name: new RegExp(`Attack ${defenderName}`, "i") });
    await expect(attackButton).toBeEnabled();
    await attackButton.click();

    // Should see victory or defeat banner
    await expect(
      page.getByText(/Victory!|Defeat!/i)
    ).toBeVisible({ timeout: 10_000 });
  });
});
