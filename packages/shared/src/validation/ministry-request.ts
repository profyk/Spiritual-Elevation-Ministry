import { z } from "zod";

export const requestTypeSchema = z.enum([
  "prophetic_ministry",
  "healing_deliverance",
  "coaching_interest",
  "event_rsvp",
  "general_contact",
]);
export type RequestType = z.infer<typeof requestTypeSchema>;

export const createMinistryRequestSchema = z
  .object({
    requestType: requestTypeSchema,
    concernsMissingPerson: z.boolean().default(false),
    name: z.string().trim().min(1).max(200),
    contactEmail: z.string().trim().email().optional(),
    contactPhone: z.string().trim().min(6).max(30).optional(),
    details: z.string().trim().max(5000).optional(),
  })
  .strict()
  .refine((data) => data.contactEmail || data.contactPhone, {
    message: "At least one of contactEmail or contactPhone is required.",
    path: ["contactEmail"],
  });

export type CreateMinistryRequestInput = z.infer<typeof createMinistryRequestSchema>;
