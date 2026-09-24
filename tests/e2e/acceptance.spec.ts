import { test, expect } from "@playwright/test";
import { provisionTestAdmin } from "./utils/provision-admin";

/**
 * The SPEC §39 acceptance journey:
 *   1. A visitor opens the site on a mobile viewport and starts a chat.
 *   2. They pick a service, enter their details, and send a message.
 *   3. An admin opens the conversation and replies.
 *   4. The visitor sees the reply in real time.
 *   5. A second visitor cannot access the first conversation.
 *   6. An admin note is never visible to the visitor.
 *
 * WRITTEN BUT NOT EXECUTED in this environment — needs a real Supabase
 * project (NEXT_PUBLIC_SUPABASE_URL/ANON_KEY) plus
 * E2E_SUPABASE_SERVICE_ROLE_KEY to provision/clean up the test admin
 * account, and the dev server (or PLAYWRIGHT_BASE_URL) actually serving
 * pages backed by that project. None of that exists in this sandbox.
 */

test.describe("SPEC §39 acceptance journey", () => {
  test.skip(
    !process.env.E2E_SUPABASE_SERVICE_ROLE_KEY,
    "Requires E2E_SUPABASE_SERVICE_ROLE_KEY against a real Supabase project — see docs/DEPLOYMENT.md."
  );

  let admin: Awaited<ReturnType<typeof provisionTestAdmin>>;

  test.beforeAll(async () => {
    // "staff" — Communication/Requests are staff+ features and staff
    // doesn't require MFA, so this test stays focused on the chat
    // journey rather than also driving the MFA enrollment UI (that's
    // admin-mfa.spec.ts's job).
    admin = await provisionTestAdmin("staff");
  });

  test.afterAll(async () => {
    await admin?.cleanup();
  });

  test("visitor chat -> admin reply in real time -> isolated from a second visitor -> notes stay private", async ({
    browser,
  }) => {
    // ── 1-2. Visitor, mobile viewport, starts a chat ──────────────────
    const visitor = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const visitorPage = await visitor.newPage();

    await visitorPage.goto("/");
    await visitorPage.getByRole("button", { name: "Open chat" }).click();
    await visitorPage.getByLabel("What's this about?").selectOption("healing_deliverance");
    await visitorPage.getByLabel("Your name").fill("E2E Visitor One");
    await visitorPage.getByLabel("Email").fill(`visitor-one-${Date.now()}@example.test`);

    const visitorMessage = `E2E acceptance test message ${Date.now()}`;
    await visitorPage.getByLabel("Message").fill(visitorMessage);
    await visitorPage.getByRole("button", { name: "Start chat" }).click();

    await expect(visitorPage.getByText(visitorMessage)).toBeVisible();

    // ── 3. Admin signs in and replies ──────────────────────────────────
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();

    await adminPage.goto("/admin/login");
    await adminPage.getByLabel("Email").fill(admin.email);
    await adminPage.getByLabel("Password").fill(admin.password);
    await adminPage.getByRole("button", { name: "Sign in" }).click();
    await adminPage.waitForURL("**/admin");

    await adminPage.goto("/admin/communication");
    await adminPage.getByText("E2E Visitor One").click();
    await adminPage.waitForURL(/\/admin\/communication\/.+/);
    const conversationId = adminPage.url().split("/").pop();

    const staffReply = `E2E staff reply ${Date.now()}`;
    await adminPage.getByPlaceholder("Reply…").fill(staffReply);
    await adminPage.getByRole("button", { name: "Send", exact: true }).click();
    await expect(adminPage.getByText(staffReply)).toBeVisible();

    // Admin adds an internal note — must never reach the visitor.
    const internalNote = `E2E internal note ${Date.now()} — staff only`;
    await adminPage.getByPlaceholder("Add a note…").fill(internalNote);
    await adminPage.getByRole("button", { name: "Add" }).click();
    await expect(adminPage.getByText(internalNote)).toBeVisible();

    // ── 4. Visitor sees the reply live, with no reload ─────────────────
    await expect(visitorPage.getByText(staffReply)).toBeVisible({ timeout: 15_000 });

    // ── 6. The note is never visible to the visitor, in any form ───────
    await expect(visitorPage.getByText(internalNote)).toHaveCount(0);
    expect(await visitorPage.content()).not.toContain(internalNote);

    // ── 5. A second, independent visitor cannot access it ──────────────
    // Product-level check: a fresh browser (no stored conversation id)
    // opens its own new conversation, not the first visitor's thread.
    const secondVisitor = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const secondVisitorPage = await secondVisitor.newPage();
    await secondVisitorPage.goto("/");
    await secondVisitorPage.getByRole("button", { name: "Open chat" }).click();
    await expect(secondVisitorPage.getByLabel("Your name")).toBeVisible();
    await expect(secondVisitorPage.getByText(visitorMessage)).toHaveCount(0);

    // Direct-access check: even an unauthenticated REST call for this
    // exact conversation id returns nothing — the real RLS proof (this is
    // the same boundary supabase/tests/database/rls.test.sql exercises
    // from inside Postgres; this hits it over the actual network path a
    // client would use).
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && anonKey && conversationId) {
      const restResponse = await secondVisitorPage.request.get(
        `${supabaseUrl}/rest/v1/conversations?id=eq.${conversationId}`,
        { headers: { apikey: anonKey } }
      );
      expect(await restResponse.json()).toEqual([]);
    }

    await visitor.close();
    await adminContext.close();
    await secondVisitor.close();
  });
});
