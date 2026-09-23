import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

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
    const supabase = await createClient();

    const [{ data: content }, { data: events }] = await Promise.all([
      supabase
        .from("content_items")
        .select("slug, published_at")
        .eq("status", "published"),
      supabase.from("events").select("slug").eq("status", "published"),
    ]);

    const contentEntries: MetadataRoute.Sitemap = (content ?? []).map((item) => ({
      url: `${SITE_URL}/sermons/${item.slug}`,
      lastModified: item.published_at ?? undefined,
    }));

    const eventEntries: MetadataRoute.Sitemap = (events ?? []).map((event) => ({
      url: `${SITE_URL}/services/events/${event.slug}`,
    }));

    return [...staticEntries, ...contentEntries, ...eventEntries];
  } catch {
    // No live Supabase project configured — fall back to static routes only
    // rather than failing sitemap generation entirely.
    return staticEntries;
  }
}
