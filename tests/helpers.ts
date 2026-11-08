import { Page, expect } from "@playwright/test";

export const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
export const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? "changeme123";

export function uniqueEmail(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

export async function loginAs(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  // Wait for URL to change (manual router.push)
  await page.waitForURL(/\/(dashboard|admin)/, { timeout: 15000 });
}

export async function registerInvestor(
  page: Page,
  { name, email, password }: { name: string; email: string; password: string },
) {
  await page.goto("/register");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /create account/i }).click();
  // Wait for URL to change (manual router.push)
  await page.waitForURL(/\/dashboard/, { timeout: 15000 });
  await expect(page.getByText("Wallet balance")).toBeVisible();
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL(/\/(login|register)/, { timeout: 15000 });
}
