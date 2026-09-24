/**
 * lucide-react dropped brand/logo icons — these are minimal, standalone
 * glyphs for the platforms Admin -> Settings -> Social Media can link out
 * to. All take the same props as a lucide icon (className sets size via
 * text sizing utilities) so they drop into the same layout code.
 */
type IconProps = { className?: string };

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5 3.66 9.15 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.89h2.77l-.44 2.91h-2.33V22c4.78-.79 8.44-4.94 8.44-9.94Z" />
    </svg>
  );
}

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.5s-.23-1.64-.94-2.36c-.9-.95-1.9-.95-2.36-1C16.9 3 12 3 12 3h-.01s-4.89 0-8.19.14c-.46.05-1.46.05-2.36 1C.73 4.86.5 6.5.5 6.5S.26 8.42.26 10.35v1.3c0 1.93.24 3.85.24 3.85s.23 1.64.94 2.36c.9.96 2.08.93 2.6 1.03C5.86 19.06 12 19.11 12 19.11s4.9-.01 8.2-.15c.46-.06 1.46-.06 2.36-1.02.71-.72.94-2.36.94-2.36s.24-1.92.24-3.85v-1.3c0-1.93-.24-3.85-.24-3.85ZM9.7 14.5V8.5l6 3-6 3Z" />
    </svg>
  );
}

export function TiktokIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.13-1.36 4.3 4.3 0 0 1-1.19-2.96h-3.06v13.5a2.6 2.6 0 1 1-2.19-2.57v-3.1a5.7 5.7 0 1 0 5.25 5.68V9.4a7.3 7.3 0 0 0 4.32 1.4V7.75a4.3 4.3 0 0 1-.5-1.93Z" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.24 2.5h3.3l-7.2 8.23 8.47 10.77h-6.63l-5.19-6.6-5.94 6.6H1.75l7.7-8.8L1.34 2.5h6.8l4.69 6.03Zm-1.16 17.02h1.83L7.05 4.39H5.08Z" />
    </svg>
  );
}
