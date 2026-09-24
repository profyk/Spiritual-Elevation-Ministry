import Image from "next/image";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-24 text-center">
      <Image src="/brand/logo.png" alt="Spiritual Elevation Ministry" width={96} height={96} />
      <div>
        <h1 className="text-2xl font-semibold text-ink">Page not found</h1>
        <p className="mt-2 max-w-sm text-ink-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        Back to home
      </Link>
    </div>
  );
}
