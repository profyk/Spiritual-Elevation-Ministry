import { apiFetchSafe } from "@/lib/api-client";
import { getSetting } from "@/lib/settings";

/**
 * A subtle, fixed, full-page watermark behind every page — the ministry
 * logo by default, or whatever Admin -> Settings -> Appearance uploaded
 * instead (SPEC-adjacent feature, not in the original spec: "background
 * pipeline for admin to change it").
 */
export async function SiteBackground() {
  const backgroundMediaId = await getSetting("site_background_media_id", "");
  const imageUrl = backgroundMediaId
    ? await apiFetchSafe<{ url: string }>(`/media/${backgroundMediaId}/signed-url`, { url: "" }).then(
        (r) => r.url
      )
    : "/brand/logo.png";

  if (!imageUrl) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-contain bg-center bg-no-repeat opacity-[0.05] dark:opacity-[0.08]"
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
}
