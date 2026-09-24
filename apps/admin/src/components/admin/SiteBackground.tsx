import { adminApiFetchServer } from "@/lib/api-client";

/**
 * A subtle, fixed, full-page watermark behind every admin page (login
 * included, so no session is assumed) — the ministry logo by default, or
 * whatever Settings -> Appearance uploaded instead. Same setting the
 * public frontend reads; both public routes on the backend, so no access
 * token is needed here.
 */
export async function SiteBackground() {
  const settings = await adminApiFetchServer<Record<string, string>>(
    "/settings?keys=site_background_media_id",
    undefined
  ).catch(() => ({}) as Record<string, string>);
  const backgroundMediaId = settings.site_background_media_id ?? "";

  const imageUrl = backgroundMediaId
    ? await adminApiFetchServer<{ url: string }>(`/media/${backgroundMediaId}/signed-url`, undefined)
        .then((r) => r.url)
        .catch(() => "")
    : "/brand/logo.png";

  if (!imageUrl) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 bg-contain bg-center bg-no-repeat opacity-[0.03] dark:opacity-[0.06]"
      style={{ backgroundImage: `url(${imageUrl})` }}
    />
  );
}
