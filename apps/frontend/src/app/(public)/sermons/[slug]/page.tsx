import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { apiFetch } from "@/lib/api-client";

interface ContentDetail {
  title: string;
  summary: string | null;
  body: string | null;
  content_type: string;
  published_at: string | null;
  coverUrl: string | null;
  media: { url: string; mimeType: string } | null;
}

async function getContentItem(slug: string): Promise<ContentDetail | null> {
  try {
    return await apiFetch<ContentDetail>(`/content/${slug}`);
  } catch {
    return null;
  }
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
      {item.coverUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
        <img src={item.coverUrl} alt="" className="mb-6 aspect-video w-full rounded-lg object-cover" />
      )}

      <p className="text-xs uppercase tracking-wide text-neutral-400">
        {item.content_type.replace("_", " ")}
      </p>
      <h1 className="mt-1 text-2xl font-semibold text-neutral-900">{item.title}</h1>
      {item.published_at && (
        <p className="mt-1 text-xs text-neutral-400">
          {new Date(item.published_at).toLocaleDateString()}
        </p>
      )}

      {item.media && item.media.mimeType.startsWith("audio/") && (
        <audio controls src={item.media.url} className="mt-6 w-full">
          Your browser doesn&apos;t support audio playback.
        </audio>
      )}
      {item.media && item.media.mimeType.startsWith("video/") && (
        // No transcript/captions pipeline yet (jsx-a11y/media-has-caption
        // isn't enabled in this project's lint config, so nothing flags
        // this — noted here as a known gap, not an oversight).
        <video controls src={item.media.url} className="mt-6 w-full rounded-lg">
          Your browser doesn&apos;t support video playback.
        </video>
      )}

      <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap text-neutral-700">
        {item.body}
      </div>
    </Container>
  );
}
