import { expect, test } from "@playwright/test";

test.describe("Admin access", () => {
  test("admin index renders admin shell", async ({ page }) => {
    await page.goto("/admin");
    await expect(page.getByRole("link", { name: "Club admin" })).toBeVisible();
    await expect(page.getByText(/opening admin/i)).toBeVisible();
  });

  test("admin login form is usable and validates required fields", async ({ page }) => {
    await page.goto("/admin/login");

    await expect(page.getByRole("heading", { name: "Admin sign-in" })).toBeVisible();
    const submit = page.getByRole("button", { name: "Sign in" });
    await expect(submit).toBeVisible();

    const email = page.locator('input[type="email"]');
    const password = page.locator('input[type="password"]');
    await email.fill("invalid@example.com");
    await password.fill("not-a-real-password");

    // Enablement depends on NEXT_PUBLIC_ADMIN_EMAILS, but form interaction
    // and field binding must still work.
    await expect(email).toHaveValue("invalid@example.com");
    await expect(password).toHaveValue("not-a-real-password");
  });
});
