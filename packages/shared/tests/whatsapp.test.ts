import { describe, expect, it } from "vitest";
import { buildWhatsAppLink } from "../src/whatsapp";

describe("buildWhatsAppLink", () => {
  it("strips non-digit characters from the number", () => {
    const link = buildWhatsAppLink("+27 82 123 4567", { service: "general" });
    expect(link).toBe(
      "https://wa.me/27821234567?text=" + encodeURIComponent("Hi, I'd like to get in touch with the ministry.")
    );
  });

  it("includes contextual messages per service", () => {
    const link = buildWhatsAppLink("+27821234567", { service: "healing-deliverance" });
    expect(decodeURIComponent(link)).toContain("healing and deliverance");
  });

  it("falls back to a generic coaching message when no program title is given", () => {
    const link = buildWhatsAppLink("+27821234567", { service: "coaching" });
    expect(decodeURIComponent(link)).toContain("coaching programs");
  });
});
