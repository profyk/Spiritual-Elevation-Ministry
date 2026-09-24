import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { isAdminOrAbove } from "@sem/shared";
import { SettingField } from "@/components/admin/SettingField";
import { LegalPageField } from "@/components/admin/LegalPageField";

const SETTING_KEYS = [
  "whatsapp_number",
  "contact_email",
  "data_retention_months",
  "disclaimer_prophecy",
  "disclaimer_healing",
  "disclaimer_missing_person",
];

export default async function AdminSettingsPage() {
  const session = await getAdminSession();
  if (!isAdminOrAbove(session?.admin ?? null)) redirect("/admin");

  const [settings, privacyPage, termsPage] = await Promise.all([
    adminApiFetchServer<Record<string, string>>(
      `/admin/settings?keys=${SETTING_KEYS.join(",")}`,
      session!.accessToken
    ),
    adminApiFetchServer<{ body: string | null }>("/legal-pages/privacy_policy", session!.accessToken).catch(
      () => ({ body: "" })
    ),
    adminApiFetchServer<{ body: string | null }>("/legal-pages/terms_of_use", session!.accessToken).catch(() => ({
      body: "",
    })),
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
            initialValue={settings.whatsapp_number ?? ""}
          />
          <SettingField
            settingKey="contact_email"
            label="Contact email"
            initialValue={settings.contact_email ?? ""}
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
            initialValue={settings.disclaimer_prophecy ?? ""}
            multiline
          />
          <SettingField
            settingKey="disclaimer_healing"
            label="Healing disclaimer"
            initialValue={settings.disclaimer_healing ?? ""}
            multiline
          />
          <SettingField
            settingKey="disclaimer_missing_person"
            label="Missing person disclaimer"
            initialValue={settings.disclaimer_missing_person ?? ""}
            multiline
          />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Legal Pages</h2>
        <div className="space-y-6">
          <LegalPageField pageType="privacy_policy" label="Privacy Policy" initialBody={privacyPage.body ?? ""} />
          <LegalPageField pageType="terms_of_use" label="Terms of Use" initialBody={termsPage.body ?? ""} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-medium">Data Retention</h2>
        <SettingField
          settingKey="data_retention_months"
          label="Retention period (months)"
          initialValue={settings.data_retention_months ?? "24"}
        />
        <p className="mt-2 text-xs text-neutral-500">
          A daily job (.github/workflows/cron.yml) archives conversations/requests past this
          period — it only archives, never deletes (SPEC §28).
        </p>
      </section>
    </div>
  );
}
