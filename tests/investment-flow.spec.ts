import { test, expect } from "@playwright/test";
import {
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  uniqueEmail,
  loginAs,
  registerInvestor,
  logout,
} from "./helpers";

test("full ledger flow: admin creates a company, credits a wallet, and invests on the member's behalf", async ({
  page,
}) => {
  const runId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  const companyName = `Playwright Ventures ${runId}`;
  const investorEmail = uniqueEmail("ledger-flow");
  const investorName = `Ledger Flow Investor ${runId}`;

  // Admin creates a company.
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.getByLabel("Company name").fill(companyName);
  await page.getByLabel("Sector").fill("Testing");
  await page.getByLabel("Description").fill("A company created by a test.");
  await page.getByRole("button", { name: /create company/i }).click();
  await expect(page.getByText(companyName)).toBeVisible();

  // Register the investor who will receive funds.
  await logout(page);
  await registerInvestor(page, {
    name: investorName,
    email: investorEmail,
    password: "testpassword123",
  });

  // The investor can see the company but has no way to invest themselves.
  await expect(page.getByText(companyName)).toBeVisible();
  await expect(page.getByPlaceholder("Amount")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /^invest$/i })).toHaveCount(0);

  await logout(page);

  // Admin credits the new investor's wallet.
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.getByText(investorName).click();
  await expect(page).toHaveURL(/\/admin\/users\//);

  await page.getByLabel("Amount").first().fill("500");
  await page.getByLabel("Note").fill("Received $500 via bank transfer");
  await page.getByRole("button", { name: /add funds/i }).click();

  await expect(page.getByText("$500.00", { exact: true })).toBeVisible();
  await expect(page.getByText("ADMIN CREDIT")).toBeVisible();

  // Admin invests on the member's behalf, as instructed outside the app.
  await page.getByLabel("Company").selectOption({ label: companyName });
  await page.getByLabel("Amount").nth(1).fill("150");
  await page.getByRole("button", { name: /place investment/i }).click();

  await expect(page.getByText("$350.00", { exact: true })).toBeVisible();
  await expect(page.getByText("INVESTMENT", { exact: true })).toBeVisible();

  // Active money on the company page reflects the placed investment
  // (it appears twice: the headline stat and the per-member legend row).
  await page.getByRole("link", { name: "Investment Club" }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await page.getByText(companyName).click();
  await expect(page.getByText("$150.00", { exact: true }).first()).toBeVisible();

  await logout(page);

  // The investor sees their own holding reflected, read-only.
  await loginAs(page, investorEmail, "testpassword123");
  await expect(page.getByText("$350.00", { exact: true })).toBeVisible();
  await expect(page.getByText(companyName).first()).toBeVisible();
});

test("a closed company is hidden from investors", async ({ page }) => {
  const companyName = `Closed Co ${Date.now()}`;
  const investorEmail = uniqueEmail("closed-co");

  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
  await page.getByLabel("Company name").fill(companyName);
  await page.getByLabel("Description").fill("Will be closed.");
  await page.getByRole("button", { name: /create company/i }).click();

  await page.getByText(companyName).click();
  await page.getByLabel("Status").selectOption("CLOSED");
  await page.getByRole("button", { name: /save changes/i }).click();
  // Wait for the submit to fully round-trip (button returns from "Working…")
  // before asserting, rather than racing the in-flight server action.
  await expect(
    page.getByRole("button", { name: /save changes/i }),
  ).toBeVisible();
  await expect(page.getByLabel("Status")).toHaveValue("CLOSED");

  await logout(page);
  await registerInvestor(page, {
    name: "Closed Co Checker",
    email: investorEmail,
    password: "testpassword123",
  });

  await expect(page.getByText(companyName)).not.toBeVisible();
});
