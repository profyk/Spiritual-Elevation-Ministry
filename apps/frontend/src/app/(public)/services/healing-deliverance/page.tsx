import type { Metadata } from "next";
import { HeartHandshake } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { MinistryRequestForm } from "@/components/forms/MinistryRequestForm";
import { getSetting } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Healing & Deliverance",
  description: "Request prayer support for healing and deliverance.",
};

export default async function HealingDeliverancePage() {
  const [healingDisclaimer, missingPersonDisclaimer] = await Promise.all([
    getSetting(
      "disclaimer_healing",
      "Prayer for healing is offered alongside — never as a replacement for — qualified medical care. If you are experiencing a medical emergency, contact your local emergency services immediately."
    ),
    getSetting(
      "disclaimer_missing_person",
      "If this concerns a missing loved one, please also contact your local police and a registered missing-persons organization. This ministry offers prayer support but is not a search-and-rescue or investigative service."
    ),
  ]);

  return (
    <Container className="max-w-3xl py-12">
      <HeartHandshake className="h-8 w-8 text-accent-ink" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-ink">Healing &amp; Deliverance</h1>
      <p className="mt-3 text-ink-muted">
        [SAMPLE] Placeholder description of the ministry&apos;s healing &amp; deliverance
        offering. Replace with real content from Admin before launch.
      </p>

      <div className="mt-6 space-y-3">
        <Disclaimer text={healingDisclaimer} />
        <Disclaimer text={missingPersonDisclaimer} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <WhatsAppButton context={{ service: "healing-deliverance" }} />
      </div>

      <div className="mt-10 rounded-lg border border-line p-6">
        <h2 className="mb-4 text-lg font-medium text-ink">
          Request Healing &amp; Deliverance Prayer
        </h2>
        <MinistryRequestForm requestType="healing_deliverance" showMissingPersonOption />
      </div>
    </Container>
  );
}
