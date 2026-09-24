import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { EventRsvpForm } from "@/components/forms/EventRsvpForm";
import { createClient } from "@/lib/supabase/server";
import { getMediaSignedUrl } from "@/lib/media/get-signed-url.server";

async function getEvent(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select(
      "id, title, description, start_at, end_at, location_type, location_address, online_url, rsvp_enabled, status, cover_media_id"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  return data;
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

  const coverUrl = await getMediaSignedUrl(event.cover_media_id);

  return (
    <Container className="max-w-2xl py-12">
      {coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
        <img src={coverUrl} alt="" className="mb-6 aspect-video w-full rounded-lg object-cover" />
      )}
      <h1 className="text-2xl font-semibold text-neutral-900">{event.title}</h1>
      <p className="mt-2 text-sm text-neutral-500">
        {new Date(event.start_at).toLocaleString(undefined, {
          dateStyle: "full",
          timeStyle: "short",
        })}
        {event.location_address ? ` · ${event.location_address}` : ""}
        {event.online_url ? " · Online" : ""}
      </p>

      {event.description && <p className="mt-6 text-neutral-700">{event.description}</p>}

      <div className="mt-8 flex flex-wrap gap-3">
        <WhatsAppButton context={{ service: "events", eventTitle: event.title }} />
      </div>

      {event.rsvp_enabled && (
        <div className="mt-10 rounded-lg border border-neutral-200 p-6">
          <h2 className="mb-4 text-lg font-medium text-neutral-900">RSVP</h2>
          <EventRsvpForm eventId={event.id} />
        </div>
      )}
    </Container>
  );
}
