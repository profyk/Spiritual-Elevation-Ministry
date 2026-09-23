import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { MinistryRequestForm } from "@/components/forms/MinistryRequestForm";

export const metadata: Metadata = {
  title: "Talk to the Ministry",
  description: "Get in touch with Spiritual Elevation Ministry.",
};

export default function ContactPage() {
  return (
    <Container className="max-w-2xl py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Talk to the Ministry</h1>
      <p className="mt-3 text-neutral-600">
        Reach out for prayer, questions, or anything else. A live chat option is coming soon —
        for now, send a message below or reach us on WhatsApp.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <WhatsAppButton context={{ service: "general" }} />
      </div>

      <div className="mt-10 rounded-lg border border-neutral-200 p-6">
        <MinistryRequestForm requestType="general_contact" showMissingPersonOption />
      </div>
    </Container>
  );
}
