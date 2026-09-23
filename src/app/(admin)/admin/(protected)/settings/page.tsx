import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isAdminOrAbove } from "@/lib/permissions";
import { SettingField } from "@/components/admin/SettingField";
import { LegalPageField } from "@/components/admin/LegalPageField";

async function getSettingsMap(keys: string[]) {
  const supabase = await createClient();
  const { data } = await supabase.from("website_settings").select("key, value").in("key", keys);
  const map = new Map((data ?? []).map((row) => [row.key, row.value as string]));
  return map;
}

async function getLegalPage(pageType: "privacy_policy" | "terms_of_use") {
  const supabase = await createClient();
  const { data } = await supabase
    .from("legal_pages")
    .select("body")
    .eq("page_type", pageType)
    .maybeSingle();
  return data?.body ?? "";
}

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!isAdminOrAbove(session?.admin ?? null)) redirect("/admin");

  const settingKeys = [
    "whatsapp_number",
    "contact_email",
    "data_retention_months",
    "disclaimer_prophecy",
    "disclaimer_healing",
    "disclaimer_missing_person",
  ];
  const [settings, privacyBody, termsBody] = await Promise.all([
    getSettingsMap(settingKeys),
    getLegalPage("privacy_policy"),
    getLegalPage("terms_of_use"),
  ]);

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <section>
        <h2 className="mb-4 text-lg font-medium">Communication</h2>
        <div className="space-y-4">
          <SettingField
            settingKey="whatsapp_number"
            label="WhatsApp number (E.164, e.g. +27821234567)"
            initialValue={settings.get("whatsapp_number") ?? ""}
          />
          <SettingField
            settingKey="contact_email"
            label="Contact email"
            initialValue={settings.get("contact_email") ?? ""}
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Required Disclaimers</h2>
        <p className="mb-4 text-xs text-neutral-500">
          Editable by Admin+. Only Super Admin can remove a disclaimer&apos;s required status
          (SPEC §37) — not yet exposed in this UI, so these always stay required for now.
        </p>
        <div className="space-y-4">
          <SettingField
            settingKey="disclaimer_prophecy"
            label="Prophecy disclaimer"
            initialValue={settings.get("disclaimer_prophecy") ?? ""}
            multiline
          />
          <SettingField
            settingKey="disclaimer_healing"
            label="Healing disclaimer"
            initialValue={settings.get("disclaimer_healing") ?? ""}
            multiline
          />
          <SettingField
            settingKey="disclaimer_missing_person"
            label="Missing person disclaimer"
            initialValue={settings.get("disclaimer_missing_person") ?? ""}
            multiline
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Legal Pages</h2>
        <div className="space-y-6">
          <LegalPageField pageType="privacy_policy" label="Privacy Policy" initialBody={privacyBody} />
          <LegalPageField pageType="terms_of_use" label="Terms of Use" initialBody={termsBody} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Data Retention</h2>
        <SettingField
          settingKey="data_retention_months"
          label="Retention period (months)"
          initialValue={settings.get("data_retention_months") ?? "24"}
        />
        <p className="mt-2 text-xs text-neutral-500">
          A scheduled job to actually archive/delete past this period isn&apos;t built yet
          (SPEC §28) — this setting is recorded but not yet enforced.
        </p>
      </section>
    </div>
  );
}
