import { test, expect } from "@playwright/test";
import { registerAndCreateNation, grantDevResources, navigateTo } from "./helpers";

test.describe("Market", () => {
  test("tab switching works", async ({ page }) => {
    await registerAndCreateNation(page);

    await navigateTo(page, "Market");
    await expect(page).toHaveURL(/\/game\/market/, { timeout: 10_000 });

    // Default view should show Market Exchange
    await expect(page.getByText("Market Exchange")).toBeVisible();

    // Click Tech Points tab
    await page.getByRole("button", { name: "Tech Points" }).click();
    await expect(page).toHaveURL(/\/game\/market/);

    // Click Food tab
    await page.getByRole("button", { name: "Food" }).click();
    await expect(page).toHaveURL(/\/game\/market/);
  });

  test("place buy order → appears in Your Orders", async ({ page }) => {
    const user = await registerAndCreateNation(page);
    await grantDevResources(page, user.token);

    await navigateTo(page, "Market");
    await expect(page).toHaveURL(/\/game\/market/, { timeout: 10_000 });

    // Fill in order form
    await page.getByPlaceholder("0.00").fill("1.50");
    await page.getByPlaceholder("0").last().fill("100");

    // Click Place Buy Order
    await page.getByRole("button", { name: "Place Buy Order" }).click();

    // Should see success message
    await expect(page.getByText(/order placed/i)).toBeVisible({ timeout: 5_000 });

    // Should appear in Your Orders section
    await expect(page.getByText("Your Orders")).toBeVisible();
    await expect(page.getByText("@ $1.50")).toBeVisible();
  });

  test("cancel order", async ({ page }) => {
    const API_URL = process.env.API_URL || "http://localhost:4100";
    const user = await registerAndCreateNation(page);
    await grantDevResources(page, user.token);

    await navigateTo(page, "Market");
    await expect(page).toHaveURL(/\/game\/market/, { timeout: 10_000 });

    // Place an order first
    await page.getByPlaceholder("0.00").fill("0.50");
    await page.getByPlaceholder("0").last().fill("50");
    await page.getByRole("button", { name: "Place Buy Order" }).click();
    await expect(page.getByText(/order placed/i)).toBeVisible({ timeout: 5_000 });

    // Verify order appears with Cancel button
    await expect(page.getByText("@ $0.50")).toBeVisible({ timeout: 5_000 });

    // Get the order ID and cancel via API
    const ordersRes = await page.request.get(`${API_URL}/market/my-orders`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });
    const { orders } = await ordersRes.json();
    const openOrder = orders.find((o: { status: string }) => o.status === "OPEN" || o.status === "PARTIAL");
    expect(openOrder).toBeTruthy();

    await page.request.delete(`${API_URL}/market/orders/${openOrder.id}`, {
      headers: { Authorization: `Bearer ${user.token}` },
    });

    // Reload to see updated state
    await page.reload();
    await page.waitForLoadState("networkidle");

    // The cancelled order should show "(cancelled)" status
    await expect(page.getByText("(cancelled)")).toBeVisible({ timeout: 10_000 });
  });
});
