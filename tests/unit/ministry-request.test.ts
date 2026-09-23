import { describe, expect, it } from "vitest";
import { createMinistryRequestSchema } from "@/lib/validation/ministry-request";

describe("createMinistryRequestSchema", () => {
  it("accepts a valid request with only an email", () => {
    const result = createMinistryRequestSchema.safeParse({
      requestType: "prophetic_ministry",
      name: "Sample Visitor",
      contactEmail: "visitor@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a request with neither email nor phone", () => {
    const result = createMinistryRequestSchema.safeParse({
      requestType: "healing_deliverance",
      name: "Sample Visitor",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields", () => {
    const result = createMinistryRequestSchema.safeParse({
      requestType: "general_contact",
      name: "Sample Visitor",
      contactPhone: "+27821234567",
      isAdmin: true,
    });
    expect(result.success).toBe(false);
  });
});
