import { test, expect } from "@playwright/test";
import { ADMIN_EMAIL, ADMIN_PASSWORD, loginAs } from "./helpers";

const widths = [320, 375, 768, 1024, 1440];

for (const width of widths) {
  test(`no horizontal overflow on the admin dashboard at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(hasOverflow).toBe(false);
  });
}

test("admin nav bar stays usable at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  await expect(page.getByText("Investment Club")).toBeVisible();
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
});

test("primary buttons meet the 44px touch target minimum", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);

  const button = page.getByRole("button", { name: /create company/i });
  const box = await button.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
});
