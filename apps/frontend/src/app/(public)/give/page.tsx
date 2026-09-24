import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { getSetting } from "@/lib/settings";

export const metadata: Metadata = {
  title: "Give / Support",
  description: "Ways to support Spiritual Elevation Ministry.",
};

export default async function GivePage() {
  const contactEmail = await getSetting("contact_email", "");

  return (
    <Container className="max-w-2xl py-12">
      <h1 className="text-2xl font-semibold text-ink">Give / Support the Ministry</h1>
      <p className="mt-4 text-ink-muted">
        Your giving helps sustain this ministry&apos;s prophetic ministry, healing &amp;
        deliverance prayer, coaching, and events. We don&apos;t process donations online yet —
        reach out to us directly and we&apos;ll arrange the best way for you to give (bank
        transfer, in person, or another method).
      </p>

      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-accent-ink">
        [SAMPLE] Placeholder — replace with the ministry&apos;s real bank details or giving
        instructions from Admin before launch.
      </p>

      <div className="mt-8 flex flex-wrap gap-3">
        <WhatsAppButton context={{ service: "give" }} />
        {contactEmail && (
          <a
            href={`mailto:${contactEmail}`}
            className="inline-flex items-center justify-center rounded-md border border-line px-4 py-2.5 text-sm font-medium text-ink-muted hover:bg-surface-2"
          >
            Email us
          </a>
        )}
      </div>
    </Container>
  );
}
