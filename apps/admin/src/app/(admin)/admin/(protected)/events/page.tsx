import Link from "next/link";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";

interface EventListItem {
  id: string;
  title: string;
  status: string;
  start_at: string;
  rsvp_enabled: boolean;
}

export default async function AdminEventsPage() {
  const session = await getAdminSession();
  const events = session
    ? await adminApiFetchServer<EventListItem[]>("/admin/events", session.accessToken)
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Events</h1>
        <Link
          href="/admin/events/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New event
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Starts</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">RSVP</th>
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr key={event.id} className="border-b border-line-faint last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/admin/events/${event.id}`} className="text-accent-ink hover:underline">
                    {event.title}
                  </Link>
                </td>
                <td className="px-4 py-2 text-ink-faint">
                  {new Date(event.start_at).toLocaleString()}
                </td>
                <td className="px-4 py-2 capitalize">{event.status}</td>
                <td className="px-4 py-2">{event.rsvp_enabled ? "Yes" : "No"}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-ink-faint">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
