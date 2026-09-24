import { test, expect } from "@playwright/test";
import { provisionTestAdmin } from "./utils/provision-admin";
import { generateTotp } from "./utils/totp";

/**
 * SPEC §22: Admin/Super Admin MFA is mandatory, not optional. This proves
 * a fresh Super Admin is forced through TOTP enrollment before reaching
 * anything else, and that a later sign-in requires a fresh code.
 *
 * WRITTEN BUT NOT EXECUTED — same requirements as acceptance.spec.ts.
 */

test.describe("mandatory admin MFA (SPEC §22)", () => {
  test.skip(
    !process.env.E2E_SUPABASE_SERVICE_ROLE_KEY,
    "Requires E2E_SUPABASE_SERVICE_ROLE_KEY against a real Supabase project — see docs/DEPLOYMENT.md."
  );

  let admin: Awaited<ReturnType<typeof provisionTestAdmin>>;

  test.beforeAll(async () => {
    admin = await provisionTestAdmin("super_admin");
  });

  test.afterAll(async () => {
    await admin?.cleanup();
  });

  test("a fresh Super Admin is forced to enroll TOTP before reaching the dashboard", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(admin.email);
    await page.getByLabel("Password").fill(admin.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    // The (protected) layout redirects here — no enrolled factor yet.
    await page.waitForURL("**/admin/mfa/enroll");

    const secretLocator = page.getByText(/Enter this key manually:/);
    await expect(secretLocator).toBeVisible();
    const secretText = await secretLocator.textContent();
    const secret = secretText?.split(":").pop()?.trim().replace(/\s+/g, "");
    expect(secret).toBeTruthy();

    const code = generateTotp(secret!);
    await page.getByPlaceholder("6-digit code").fill(code);
    await page.getByRole("button", { name: "Verify & continue" }).click();

    await page.waitForURL("**/admin");
    await expect(page.getByText("Dashboard")).toBeVisible();
  });

  test("a later sign-in requires a fresh TOTP challenge, not just the password", async ({ page, context }) => {
    // First, enroll (same as above) so there's a verified factor to
    // challenge on the second sign-in.
    await page.goto("/admin/login");
    await page.getByLabel("Email").fill(admin.email);
    await page.getByLabel("Password").fill(admin.password);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin/mfa/enroll");

    const secretLocator = page.getByText(/Enter this key manually:/);
    await expect(secretLocator).toBeVisible();
    const secretText = await secretLocator.textContent();
    const secret = secretText?.split(":").pop()?.trim().replace(/\s+/g, "");
    await page.getByPlaceholder("6-digit code").fill(generateTotp(secret!));
    await page.getByRole("button", { name: "Verify & continue" }).click();
    await page.waitForURL("**/admin");

    // Sign out, clearing the session, then sign in again — this time the
    // factor already exists, so it should challenge instead of re-enroll.
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.waitForURL("**/admin/login");

    await page.getByLabel("Email").fill(admin.email);
    await page.getByLabel("Password").fill(admin.password);
    await page.getByRole("button", { name: "Sign in" }).click();

    await page.waitForURL("**/admin/mfa/verify");
    await page.getByPlaceholder("6-digit code").fill(generateTotp(secret!));
    await page.getByRole("button", { name: "Verify" }).click();

    await page.waitForURL("**/admin");
    await expect(page.getByText("Dashboard")).toBeVisible();

    await context.close();
  });
});
