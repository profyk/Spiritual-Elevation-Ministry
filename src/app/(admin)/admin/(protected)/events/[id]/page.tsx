import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/admin/EventForm";
import { updateEvent } from "../actions";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select(
      "title, slug, description, start_at, end_at, location_type, location_address, online_url, status, rsvp_enabled, capacity, cover_media_id"
    )
    .eq("id", id)
    .maybeSingle();

  if (!event) notFound();

  const boundAction = updateEvent.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit event</h1>
      <EventForm
        action={boundAction}
        submitLabel="Save changes"
        initialValues={{
          title: event.title,
          slug: event.slug,
          description: event.description ?? "",
          startAt: event.start_at.slice(0, 16),
          endAt: event.end_at ? event.end_at.slice(0, 16) : "",
          locationType: event.location_type,
          locationAddress: event.location_address ?? "",
          onlineUrl: event.online_url ?? "",
          status: event.status,
          rsvpEnabled: event.rsvp_enabled,
          capacity: event.capacity ? String(event.capacity) : "",
          coverMediaId: event.cover_media_id,
        }}
      />
    </div>
  );
}
