import Image from "next/image";
import { Flame, HeartHandshake, Compass, CalendarDays } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { LinkButton } from "@/components/ui/Button";
import { WhatsAppButton } from "@/components/ui/WhatsAppButton";
import { apiFetchSafe } from "@/lib/api-client";

interface RecentContentItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content_type: string;
}

const SERVICES = [
  {
    href: "/services/prophetic-ministry",
    title: "Prophetic Ministry",
    description: "Request prophetic ministry and prayer for guidance.",
    Icon: Flame,
  },
  {
    href: "/services/healing-deliverance",
    title: "Healing & Deliverance",
    description: "Prayer support for healing and deliverance.",
    Icon: HeartHandshake,
  },
  {
    href: "/services/coaching",
    title: "Life & Spiritual Coaching",
    description: "Structured coaching programs for spiritual growth.",
    Icon: Compass,
  },
  {
    href: "/services/events",
    title: "Events & Conferences",
    description: "Upcoming gatherings, services, and conferences.",
    Icon: CalendarDays,
  },
];

async function getRecentContent(): Promise<RecentContentItem[]> {
  return apiFetchSafe<RecentContentItem[]>("/content?limit=3", []);
}

export default async function HomePage() {
  const recentContent = await getRecentContent();

  return (
    <>
      <section className="bg-accent-surface">
        <Container className="flex flex-col items-start gap-6 py-16">
          <Image
            src="/brand/logo.png"
            alt="Spiritual Elevation Ministry"
            width={120}
            height={120}
            priority
            className="drop-shadow-sm"
          />
          <p className="text-xs font-medium uppercase tracking-wide text-accent-ink">
            [SAMPLE] Placeholder hero content — replace before launch
          </p>
          <h1 className="max-w-2xl text-3xl font-semibold text-ink sm:text-4xl">
            Spiritual Elevation Ministry
          </h1>
          <p className="max-w-xl text-ink-muted">
            A ministry offering prophetic ministry, healing &amp; deliverance prayer, spiritual
            coaching, and events. Reach out below — we&apos;d love to connect with you.
          </p>
          <div className="flex flex-wrap gap-3">
            <LinkButton href="/contact">Talk to the Ministry</LinkButton>
            <WhatsAppButton context={{ service: "general" }} />
          </div>
        </Container>
      </section>

      <Container className="py-16">
        <h2 className="mb-8 text-xl font-semibold text-ink">Our Services</h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          {SERVICES.map(({ href, title, description, Icon }) => (
            <a
              key={href}
              href={href}
              className="flex gap-4 rounded-lg border border-line p-5 transition-colors hover:border-accent-line"
            >
              <Icon className="h-6 w-6 flex-shrink-0 text-accent-ink" aria-hidden="true" />
              <div>
                <h3 className="font-medium text-ink">{title}</h3>
                <p className="mt-1 text-sm text-ink-muted">{description}</p>
              </div>
            </a>
          ))}
        </div>
      </Container>

      {recentContent.length > 0 && (
        <Container className="pb-16">
          <h2 className="mb-8 text-xl font-semibold text-ink">
            Recent Messages &amp; Teachings
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            {recentContent.map((item) => (
              <a
                key={item.id}
                href={`/sermons/${item.slug}`}
                className="rounded-lg border border-line p-5 hover:border-accent-line"
              >
                <p className="text-xs uppercase tracking-wide text-ink-faint">
                  {item.content_type.replace("_", " ")}
                </p>
                <h3 className="mt-1 font-medium text-ink">{item.title}</h3>
                {item.summary && (
                  <p className="mt-1 text-sm text-ink-muted line-clamp-2">{item.summary}</p>
                )}
              </a>
            ))}
          </div>
        </Container>
      )}
    </>
  );
}
