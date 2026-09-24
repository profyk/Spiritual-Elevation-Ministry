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
  coverMediaAltText: string | null;
}

interface Rsvp {
  id: string;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  attendee_count: number;
  created_at: string;
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

  const rsvps = await adminApiFetchServer<Rsvp[]>(`/admin/events/${id}/rsvps`, session.accessToken).catch(
    () => []
  );
  const totalAttendees = rsvps.reduce((sum, r) => sum + r.attendee_count, 0);

  const boundAction = updateEvent.bind(null, id);

  return (
    <div className="max-w-2xl space-y-10">
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
            coverMediaAltText: event.coverMediaAltText,
          }}
        />
      </div>

      {event.rsvp_enabled && (
        <section>
          <h2 className="mb-4 text-lg font-medium">
            RSVPs ({rsvps.length} {rsvps.length === 1 ? "reply" : "replies"}, {totalAttendees}{" "}
            {totalAttendees === 1 ? "attendee" : "attendees"}
            {event.capacity ? ` of ${event.capacity} capacity` : ""})
          </h2>
          {rsvps.length === 0 ? (
            <p className="text-sm text-ink-faint">No RSVPs yet.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-line">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-line bg-surface-2 text-ink-muted">
                  <tr>
                    <th className="px-4 py-2 font-medium">Name</th>
                    <th className="px-4 py-2 font-medium">Contact</th>
                    <th className="px-4 py-2 font-medium">Attendees</th>
                    <th className="px-4 py-2 font-medium">Submitted</th>
                  </tr>
                </thead>
                <tbody>
                  {rsvps.map((rsvp) => (
                    <tr key={rsvp.id} className="border-b border-line-faint last:border-0">
                      <td className="px-4 py-2">{rsvp.name}</td>
                      <td className="px-4 py-2 text-ink-muted">
                        {rsvp.contact_email ?? rsvp.contact_phone ?? "—"}
                      </td>
                      <td className="px-4 py-2">{rsvp.attendee_count}</td>
                      <td className="px-4 py-2 text-ink-faint">
                        {new Date(rsvp.created_at).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
