import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { apiFetchSafe } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Events & Conferences",
  description: "Upcoming gatherings, services, and conferences.",
};

interface EventListItem {
  id: string;
  title: string;
  slug: string;
  start_at: string;
  location_address: string | null;
  coverUrl: string | null;
}

async function getUpcomingEvents(): Promise<EventListItem[]> {
  return apiFetchSafe<EventListItem[]>("/events?upcoming=true", []);
}

export default async function EventsPage() {
  const events = await getUpcomingEvents();

  return (
    <Container className="max-w-3xl py-12">
      <CalendarDays className="h-8 w-8 text-amber-800" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Events &amp; Conferences</h1>
      <p className="mt-3 text-neutral-600">Upcoming ministry gatherings.</p>

      <div className="mt-8 space-y-4">
        {events.length === 0 && (
          <p className="text-sm text-neutral-500">No upcoming events published yet.</p>
        )}
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/services/events/${event.slug}`}
            className="flex gap-4 rounded-lg border border-neutral-200 p-5 hover:border-amber-800"
          >
            {event.coverUrl && (
              // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
              <img
                src={event.coverUrl}
                alt=""
                className="h-16 w-16 flex-shrink-0 rounded-md object-cover"
              />
            )}
            <div>
              <h2 className="font-medium text-neutral-900">{event.title}</h2>
              <p className="mt-1 text-sm text-neutral-500">
                {new Date(event.start_at).toLocaleString(undefined, {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
                {event.location_address ? ` · ${event.location_address}` : ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </Container>
  );
}
