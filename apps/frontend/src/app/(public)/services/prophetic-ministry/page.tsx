import type { Metadata } from "next";
import { Flame } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Disclaimer } from "@/components/ui/Disclaimer";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { MinistryRequestForm } from "@/components/forms/MinistryRequestForm";
import { getSetting } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Prophetic Ministry",
  description: "Request prophetic ministry and prayer for guidance.",
};

export default async function PropheticMinistryPage() {
  const disclaimer = await getSetting(
    "disclaimer_prophecy",
    "Prophetic words offered by this ministry are for encouragement and spiritual guidance. They are not a guaranteed prediction of future events and should not be used as the sole basis for major life, medical, financial, or legal decisions."
  );

  return (
    <Container className="max-w-3xl py-12">
      <Flame className="h-8 w-8 text-amber-800" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Prophetic Ministry</h1>
      <p className="mt-3 text-neutral-600">
        [SAMPLE] Placeholder description of the ministry&apos;s prophetic ministry offering.
        Replace with real content from Admin before launch.
      </p>

      <div className="mt-6">
        <Disclaimer text={disclaimer} />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <WhatsAppButton context={{ service: "prophetic-ministry" }} />
      </div>

      <div className="mt-10 rounded-lg border border-neutral-200 p-6">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">Request Prophetic Ministry</h2>
        <MinistryRequestForm requestType="prophetic_ministry" />
      </div>
    </Container>
  );
}
