import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { createClient } from "@/lib/supabase/server";

async function getContentItem(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("content_items")
    .select("title, summary, body, content_type, published_at")
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
  const item = await getContentItem(slug);
  return {
    title: item?.title ?? "Content",
    description: item?.summary ?? undefined,
  };
}

export default async function ContentDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const item = await getContentItem(slug);
  if (!item) notFound();

  return (
    <Container className="max-w-2xl py-12">
      <p className="text-xs uppercase tracking-wide text-neutral-400">
        {item.content_type.replace("_", " ")}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{item.title}</h1>
      {item.published_at && (
        <p className="mt-1 text-xs text-neutral-400">
          {new Date(item.published_at).toLocaleDateString()}
        </p>
      )}
      <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap text-neutral-700">
        {item.body}
      </div>
    </Container>
  );
}
