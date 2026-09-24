import { test, expect } from "@playwright/test";

// Placeholder smoke test until the public homepage is built (Phase 2).
// The full acceptance journey (SPEC §39) — visitor chat, admin reply,
// cross-visitor isolation, note invisibility — is added in Phase 4.
test("homepage responds", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.ok()).toBeTruthy();
});
