import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { EventForm } from "@/components/admin/EventForm";
import { updateEvent } from "../actions";

interface EventDetail {
  title: string;
  slug: string;
  description: string | null;
  start_at: string;
  end_at: string | null;
  location_type: "physical" | "online";
  location_address: string | null;
  online_url: string | null;
  status: "draft" | "published" | "cancelled" | "archived";
  rsvp_enabled: boolean;
  capacity: number | null;
  cover_media_id: string | null;
}

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) notFound();

  let event: EventDetail;
  try {
    event = await adminApiFetchServer<EventDetail>(`/admin/events/${id}`, session.accessToken);
  } catch {
    notFound();
  }

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
