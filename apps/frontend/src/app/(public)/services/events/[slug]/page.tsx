import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { EventRsvpForm } from "@/components/forms/EventRsvpForm";
import { apiFetch } from "@/lib/api-client";

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  start_at: string;
  location_address: string | null;
  online_url: string | null;
  rsvp_enabled: boolean;
  coverUrl: string | null;
  coverAlt: string;
}

async function getEvent(slug: string): Promise<EventDetail | null> {
  try {
    return await apiFetch<EventDetail>(`/events/${slug}`);
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEvent(slug);
  return { title: event?.title ?? "Event" };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEvent(slug);
  if (!event) notFound();

  return (
    <Container className="max-w-2xl py-12">
      {event.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
        <img src={event.coverUrl} alt={event.coverAlt} className="mb-6 aspect-video w-full rounded-lg object-cover" />
      )}
      <h1 className="text-2xl font-semibold text-ink">{event.title}</h1>
      <p className="mt-2 text-sm text-ink-faint">
        {new Date(event.start_at).toLocaleString(undefined, {
          dateStyle: "full",
          timeStyle: "short",
        })}
        {event.location_address ? ` · ${event.location_address}` : ""}
        {event.online_url ? " · Online" : ""}
      </p>

      {event.description && <p className="mt-6 text-ink-muted">{event.description}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <WhatsAppButton context={{ service: "events", eventTitle: event.title }} />
      </div>

      {event.rsvp_enabled && (
        <div className="mt-10 rounded-lg border border-line p-6">
          <h2 className="mb-4 text-lg font-medium text-ink">RSVP</h2>
          <EventRsvpForm eventId={event.id} />
        </div>
      )}
    </Container>
  );
}
