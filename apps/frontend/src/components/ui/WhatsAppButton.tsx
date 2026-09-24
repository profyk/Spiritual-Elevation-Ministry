import { MessageCircle } from "lucide-react";
import { buildWhatsAppLink, type WhatsAppContext } from "@sem/shared";
import { getWhatsAppNumber } from "@/lib/settings";

export async function WhatsAppButton({
  context,
  label = "Chat on WhatsApp",
  className = "",
}: {
  context: WhatsAppContext;
  label?: string;
  className?: string;
}) {
  const number = await getWhatsAppNumber();

  if (!number) {
    // No number configured yet (SPEC §41 placeholder) — omit rather than
    // render a dead link (SPEC §38: no fake buttons).
    return null;
  }

  return (
    <a
      href={buildWhatsAppLink(number, context)}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-md border border-success-line bg-success px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-success-hover ${className}`}
    >
      <MessageCircle className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}
