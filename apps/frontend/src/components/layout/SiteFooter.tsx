import Link from "next/link";
import Image from "next/image";
import { getSetting } from "@/lib/settings";
import { FacebookIcon, InstagramIcon, YoutubeIcon, TiktokIcon, XIcon } from "@/components/icons/SocialIcons";

const SOCIAL_PLATFORMS = [
  { key: "social_facebook", label: "Facebook", Icon: FacebookIcon },
  { key: "social_instagram", label: "Instagram", Icon: InstagramIcon },
  { key: "social_youtube", label: "YouTube", Icon: YoutubeIcon },
  { key: "social_tiktok", label: "TikTok", Icon: TiktokIcon },
  { key: "social_x", label: "X", Icon: XIcon },
] as const;

export async function SiteFooter() {
  const socialLinks = await Promise.all(
    SOCIAL_PLATFORMS.map(async (platform) => ({
      ...platform,
      url: await getSetting(platform.key, ""),
    }))
  );
  const activeSocialLinks = socialLinks.filter((s) => s.url);

  return (
    <footer className="mt-auto border-t border-line bg-surface-2">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-ink-faint sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2">
          <Image src="/brand/logo.png" alt="" aria-hidden width={24} height={24} />
          &copy; {new Date().getFullYear()} Spiritual Elevation Ministry.{" "}
          <span className="italic">[SAMPLE content — replace before launch]</span>
        </p>

        {activeSocialLinks.length > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-wide text-ink-faint">Follow us</span>
            {activeSocialLinks.map(({ key, label, Icon, url }) => (
              <a
                key={key}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-ink-faint hover:text-ink-muted"
              >
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        )}

        <nav className="flex gap-4">
          <Link href="/privacy-policy" className="hover:text-ink">
            Privacy Policy
          </Link>
          <Link href="/terms-of-use" className="hover:text-ink">
            Terms of Use
          </Link>
        </nav>
      </div>
    </footer>
  );
}
