import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  uniqueEmail,
  loginAs,
  registerInvestor,
  logout,
} from "./helpers";

test("unauthenticated visitor is redirected to login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("a new investor can register, lands on dashboard, and cannot reach /admin", async ({
  page,
}) => {
  const email = uniqueEmail("investor");

  await registerInvestor(page, {
    name: "Playwright Investor",
    email,
    password: "testpassword123",
  });

  await page.goto("/admin");
  await expect(page).toHaveURL(/\/dashboard/);
});

test("admin can sign in and reach the admin console", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await expect(page).toHaveURL(/\/admin/);
  await expect(page.getByRole("heading", { name: "Add a company" })).toBeVisible();
});

test("invalid credentials show an error instead of crashing", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@example.com");
  await page.getByLabel("Password").fill("wrongpassword");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(
    page.getByText(/invalid email or password/i),
  ).toBeVisible();
});

test("sign out returns to the login page", async ({ page }) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await logout(page);
  await expect(page).toHaveURL(/\/login/);
});
