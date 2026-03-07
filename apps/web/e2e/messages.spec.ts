import { test, expect } from "@playwright/test";
import { registerAndCreateNation, navigateTo } from "./helpers";

test.describe("Messages", () => {
  test("messages heading visible with count", async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Messages");

    await expect(page.getByRole("heading", { name: "Messages" })).toBeVisible();
    await expect(page.getByText(/\d+ messages/)).toBeVisible();
  });

  test("empty inbox shows no messages", async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Messages");

    await expect(page.getByText("No messages yet")).toBeVisible();
  });

  test("compose button toggles compose form", async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Messages");

    // Click Compose
    await page.getByRole("button", { name: "Compose" }).click();
    await expect(page.getByText("New Message")).toBeVisible();
    await expect(page.getByPlaceholder("Search nations...")).toBeVisible();
    await expect(page.getByPlaceholder("Message subject")).toBeVisible();
    await expect(page.getByPlaceholder("Write your message...")).toBeVisible();

    // Click Cancel to close
    await page.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByText("New Message")).not.toBeVisible();
  });

  test("send button disabled without all fields", async ({ page }) => {
    await registerAndCreateNation(page);
    await navigateTo(page, "Messages");

    await page.getByRole("button", { name: "Compose" }).click();
    const sendBtn = page.getByRole("button", { name: "Send Message" });
    await expect(sendBtn).toBeDisabled();
  });
});
