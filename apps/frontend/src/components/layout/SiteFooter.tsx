import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-neutral-200 bg-neutral-50">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-8 text-sm text-neutral-500 sm:px-6 sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} Spiritual Elevation Ministry.{" "}
          <span className="italic">[SAMPLE content — replace before launch]</span>
        </p>
        <nav className="flex gap-4">
          <Link href="/privacy-policy" className="hover:text-neutral-800">
            Privacy Policy
          </Link>
          <Link href="/terms-of-use" className="hover:text-neutral-800">
            Terms of Use
          </Link>
        </nav>
      </div>
    </footer>
  );
}
