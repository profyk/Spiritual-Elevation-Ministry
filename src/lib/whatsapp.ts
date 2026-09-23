/**
 * The single place a wa.me link is ever constructed (SPEC §18). Every
 * WhatsApp CTA on the site must go through this function — never build a
 * wa.me URL inline elsewhere.
 */

export type WhatsAppContext =
  | { service: "prophetic-ministry" }
  | { service: "healing-deliverance" }
  | { service: "coaching"; programTitle?: string }
  | { service: "events"; eventTitle?: string }
  | { service: "general" };

const CONTEXT_MESSAGES: Record<WhatsAppContext["service"], (ctx: WhatsAppContext) => string> = {
  "prophetic-ministry": () =>
    "Hi, I'd like to request prophetic ministry.",
  "healing-deliverance": () =>
    "Hi, I'd like prayer for healing and deliverance.",
  coaching: (ctx) =>
    ctx.service === "coaching" && ctx.programTitle
      ? `Hi, I'm interested in the "${ctx.programTitle}" coaching program.`
      : "Hi, I'd like more information about your coaching programs.",
  events: (ctx) =>
    ctx.service === "events" && ctx.eventTitle
      ? `Hi, I'd like more information about "${ctx.eventTitle}".`
      : "Hi, I'd like more information about your upcoming events.",
  general: () => "Hi, I'd like to get in touch with the ministry.",
};

/**
 * @param whatsappNumber E.164 number (e.g. "+27821234567"), read from
 *   website_settings by the caller — never hardcoded (SPEC §18).
 */
export function buildWhatsAppLink(
  whatsappNumber: string,
  context: WhatsAppContext = { service: "general" }
): string {
  const digitsOnly = whatsappNumber.replace(/[^\d]/g, "");
  const message = CONTEXT_MESSAGES[context.service](context);
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
