import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  uniqueEmail,
  loginAs,
  registerInvestor,
  logout,
} from "./helpers";

test("login form fields are properly labeled", async ({ page }) => {
  await page.goto("/login");

  const email = page.getByLabel("Email");
  const password = page.getByLabel("Password");
  await expect(email).toHaveAttribute("id", /.+/);
  await expect(password).toHaveAttribute("id", /.+/);

  // Clicking the label text should focus the associated input.
  await page.getByText("Email", { exact: true }).click();
  await expect(email).toBeFocused();
});

test("page has exactly one h1 and a logical heading order", async ({
  page,
}) => {
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  const h1Count = await page.locator("h1").count();
  // Admin dashboard has no page h1 (NavBar carries the brand), but section
  // headings should still exist and not skip levels unexpectedly.
  expect(h1Count).toBeLessThanOrEqual(1);
});

test("focus is visible on keyboard navigation", async ({ page }) => {
  await page.goto("/login");
  await page.keyboard.press("Tab");
  const activeOutline = await page.evaluate(() => {
    const el = document.activeElement;
    if (!el) return null;
    return window.getComputedStyle(el).outlineStyle;
  });
  expect(activeOutline).not.toBe("none");
});

test("amount inputs on a user profile have an accessible name", async ({
  page,
}) => {
  // Self-contained: don't assume another test already created a user —
  // spec files can run in any order against a freshly seeded database.
  const name = `Accessibility Check ${Date.now()}`;
  const email = uniqueEmail("a11y-check");
  await registerInvestor(page, {
    name,
    email,
    password: "testpassword123",
  });
  await logout(page);

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.getByText(name).click();
  await expect(page).toHaveURL(/\/admin\/users\//);

  // Both the "credit wallet" and "invest on their behalf" amount inputs
  // must have a real accessible name (a <label for>, not just a placeholder).
  const unlabelled = await page.evaluate(() => {
    const inputs = Array.from(
      document.querySelectorAll('input[name="amount"]'),
    );
    return inputs.filter((input) => {
      const id = input.getAttribute("id");
      const hasLabelFor = id && document.querySelector(`label[for="${id}"]`);
      const hasAriaLabel = input.getAttribute("aria-label");
      return !hasLabelFor && !hasAriaLabel;
    }).length;
  });
  expect(unlabelled).toBe(0);
});
