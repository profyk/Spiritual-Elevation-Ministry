"use server";

import { revalidatePath } from "next/cache";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isAdminOrAbove, canDisableRequiredDisclaimer } from "@sem/shared";

async function requireAdminSession() {
  const session = await getAdminSession();
  if (!isAdminOrAbove(session?.admin ?? null)) throw new Error("Not authorized.");
  return session!;
}

export async function updateSetting(key: string, value: string) {
  const session = await requireAdminSession();
  await adminApiFetchServer(`/admin/settings/${key}`, session.accessToken, {
    method: "PUT",
    body: JSON.stringify({ value }),
  });
  revalidatePath("/admin/settings");
}

export async function updateLegalPage(pageType: "privacy_policy" | "terms_of_use", body: string) {
  const session = await requireAdminSession();
  await adminApiFetchServer(`/admin/legal-pages/${pageType}`, session.accessToken, {
    method: "PUT",
    body: JSON.stringify({ body }),
  });
  revalidatePath("/admin/settings");
  // No revalidatePath for the public site's /privacy-policy or /terms-of-use
  // here — that page now lives in the separate frontend app and fetches
  // with cache: "no-store" (src/lib/api-client.ts), so there's no
  // same-process cache to invalidate; it just reads fresh on next request.
}

/**
 * Only Super Admin may remove the is_required protection from a disclaimer
 * (SPEC §37). There's no is_required flag in v1's website_settings schema
 * yet — disclaimers are always required — so this exists as the gate point
 * once that flag is added, rather than leaving the rule undocumented in
 * code until then.
 */
export async function assertCanDisableDisclaimer() {
  const session = await getAdminSession();
  if (!canDisableRequiredDisclaimer(session?.admin ?? null)) {
    throw new Error("Only Super Admin can disable a required disclaimer.");
  }
}
