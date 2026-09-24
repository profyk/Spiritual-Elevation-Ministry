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
      <h1 className="text-2xl font-semibold text-neutral-900">Sermons &amp; Teachings</h1>
      <p className="mt-3 text-neutral-600">Prophetic messages, sermons, and articles.</p>

      <div className="mt-8 space-y-4">
        {items.length === 0 && (
          <p className="text-sm text-neutral-500">No content published yet.</p>
        )}
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/sermons/${item.slug}`}
            className="block rounded-lg border border-neutral-200 p-5 hover:border-amber-800"
          >
            <p className="text-xs uppercase tracking-wide text-neutral-400">
              {item.content_type.replace("_", " ")}
            </p>
            <h2 className="mt-1 font-medium text-neutral-900">{item.title}</h2>
            {item.summary && <p className="mt-1 text-sm text-neutral-600">{item.summary}</p>}
          </Link>
        ))}
      </div>
    </Container>
  );
}
