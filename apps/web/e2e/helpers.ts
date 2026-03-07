import { type Page, expect } from "@playwright/test";

const API_URL = process.env.API_URL || "http://localhost:4100";
const DEV_SECRET = process.env.DEV_SECRET || "hegemon-dev";

let userCounter = 0;

function uniqueId(): string {
  return `${Date.now()}-${++userCounter}-${Math.random().toString(36).slice(2, 6)}`;
}

/** Register a new user via API. Returns { token, email, password, username }. */
export async function registerUser(page: Page) {
  const id = uniqueId();
  const email = `e2e-${id}@test.local`;
  const username = `e2e_${id}`;
  const password = "Test123!";

  const res = await page.request.post(`${API_URL}/auth/register`, {
    data: { email, username, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();

  return { token: body.token as string, email, password, username, userId: body.user.id as string };
}

/** Register user, create nation, inject token into localStorage, navigate to /game. */
export async function registerAndCreateNation(page: Page) {
  const user = await registerUser(page);

  // Get active round
  const roundRes = await page.request.get(`${API_URL}/round/active`);
  expect(roundRes.ok()).toBeTruthy();
  const { round } = await roundRes.json();

  // Create nation
  const nationName = `TN${Date.now().toString(36)}${(++userCounter).toString(36)}`;
  const nationRes = await page.request.post(`${API_URL}/nation`, {
    data: { name: nationName, roundId: round.id },
    headers: { Authorization: `Bearer ${user.token}` },
  });
  expect(nationRes.ok()).toBeTruthy();

  // Inject token into localStorage and navigate
  await page.goto("/");
  await page.evaluate((token) => {
    localStorage.setItem("hegemon-token", token);
  }, user.token);
  await page.goto("/game");
  await page.waitForLoadState("networkidle");

  // Dismiss the tutorial overlay if it appears
  await dismissTutorial(page);

  return { ...user, nationName };
}

/** Dismiss the tutorial overlay if visible. */
export async function dismissTutorial(page: Page) {
  const skipBtn = page.getByText("Skip Tutorial");
  if (await skipBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await skipBtn.click();
    // Wait for overlay to disappear
    await skipBtn.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  }
}

/** Log in via the actual login form UI. */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("commander@hegemon.io").fill(email);
  await page.getByPlaceholder("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022").fill(password);
  await page.getByRole("button", { name: "Login" }).click();
}

/** Navigate to a game page via sidebar link. Scoped to <aside> to avoid Quick Actions ambiguity. */
export async function navigateTo(page: Page, label: string) {
  await page.locator("aside").getByRole("link", { name: label }).click();
}

/** Grant dev resources to a nation via API. */
export async function grantDevResources(page: Page, token: string) {
  const res = await page.request.post(`${API_URL}/nation/dev/grant`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-dev-secret": DEV_SECRET,
    },
    data: {},
  });
  expect(res.ok()).toBeTruthy();
}

/** Complete all build/train queues instantly via API. */
export async function completeAllQueues(page: Page, token: string) {
  const res = await page.request.post(`${API_URL}/nation/dev/complete-all`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-dev-secret": DEV_SECRET,
    },
    data: {},
  });
  expect(res.ok()).toBeTruthy();
}
