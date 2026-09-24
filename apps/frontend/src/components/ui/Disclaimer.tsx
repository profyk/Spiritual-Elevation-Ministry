import { AlertCircle } from "lucide-react";

/**
 * Renders one of the three required disclaimers (SPEC §37). Text is passed
 * in from website_settings/legal_pages by the caller so it stays editable
 * from Admin -> Settings, never hardcoded per-page.
 */
export function Disclaimer({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-md border border-accent-line bg-accent-surface p-4 text-sm text-accent-ink">
      <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
      <p>{text}</p>
    </div>
  );
}
