import type { MetadataRoute } from "next";
import { apiFetch } from "@/lib/api-client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "",
  "/about",
  "/services/prophetic-ministry",
  "/services/healing-deliverance",
  "/services/coaching",
  "/services/events",
  "/sermons",
  "/testimonies",
  "/contact",
  "/privacy-policy",
  "/terms-of-use",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  try {
    const [content, events] = await Promise.all([
      apiFetch<{ slug: string; published_at: string | null }[]>("/content"),
      apiFetch<{ slug: string }[]>("/events"),
    ]);

    const contentEntries: MetadataRoute.Sitemap = content.map((item) => ({
      url: `${SITE_URL}/sermons/${item.slug}`,
      lastModified: item.published_at ?? undefined,
    }));

    const eventEntries: MetadataRoute.Sitemap = events.map((event) => ({
      url: `${SITE_URL}/services/events/${event.slug}`,
    }));

    return [...staticEntries, ...contentEntries, ...eventEntries];
  } catch {
    // Backend unreachable — fall back to static routes only rather than
    // failing sitemap generation entirely.
    return staticEntries;
  }
}
