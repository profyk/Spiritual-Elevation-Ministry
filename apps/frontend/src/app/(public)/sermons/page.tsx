import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { apiFetchSafe } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Sermons & Teachings",
  description: "Prophetic messages, sermons, and articles.",
};

interface ContentListItem {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  content_type: string;
}

async function getPublishedContent(): Promise<ContentListItem[]> {
  return apiFetchSafe<ContentListItem[]>("/content", []);
}

export default async function SermonsPage() {
  const items = await getPublishedContent();

  return (
    <Container className="max-w-3xl py-12">
      <h1 className="text-2xl font-semibold text-ink">Sermons &amp; Teachings</h1>
      <p className="mt-3 text-ink-muted">Prophetic messages, sermons, and articles.</p>

      <div className="mt-8 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-ink-faint">No content published yet.</p>
        )}
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/sermons/${item.slug}`}
            className="block rounded-lg border border-line p-5 hover:border-accent-line"
          >
            <p className="text-xs uppercase tracking-wide text-ink-faint">
              {item.content_type.replace("_", " ")}
            </p>
            <h2 className="mt-1 font-medium text-ink">{item.title}</h2>
            {item.summary && <p className="mt-1 text-sm text-ink-muted">{item.summary}</p>}
          </Link>
        ))}
      </div>
    </Container>
  );
}
