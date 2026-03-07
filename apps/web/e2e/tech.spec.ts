import { test, expect } from "@playwright/test";
import { registerAndCreateNation } from "./helpers";

test.describe("Tech Tree", () => {
  test("page shows tech tree heading", async ({ page }) => {
    await registerAndCreateNation(page);
    await page.goto("/game/tech");

    await expect(page.getByRole("heading", { name: "Tech Tree", exact: true })).toBeVisible();
  });

  test("three branches visible", async ({ page }) => {
    await registerAndCreateNation(page);
    await page.goto("/game/tech");

    await expect(page.getByText("Military Branch")).toBeVisible();
    await expect(page.getByText("Economy Branch")).toBeVisible();
    await expect(page.getByText("Cyber Branch")).toBeVisible();
  });

  test("tech nodes show names and costs", async ({ page }) => {
    await registerAndCreateNation(page);
    await page.goto("/game/tech");

    await expect(page.getByText("Combat Training")).toBeVisible();
    await expect(page.getByText("Trade Routes")).toBeVisible();
    await expect(page.getByText("Basic Hacking")).toBeVisible();
  });
});
