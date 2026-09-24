import { apiFetchSafe } from "@/lib/api-client";

export interface LegalPage {
  body: string | null;
  updated_at: string | null;
}

export async function getLegalPage(pageType: "privacy_policy" | "terms_of_use"): Promise<LegalPage> {
  return apiFetchSafe<LegalPage>(`/legal-pages/${pageType}`, { body: null, updated_at: null });
}
