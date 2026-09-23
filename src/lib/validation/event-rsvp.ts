import { z } from "zod";

export const createEventRsvpSchema = z
  .object({
    eventId: z.string().uuid(),
    name: z.string().trim().min(1).max(200),
    contactEmail: z.string().trim().email().optional(),
    contactPhone: z.string().trim().min(6).max(30).optional(),
    attendeeCount: z.number().int().min(1).max(20).default(1),
  })
  .strict()
  .refine((data) => data.contactEmail || data.contactPhone, {
    message: "At least one of contactEmail or contactPhone is required.",
    path: ["contactEmail"],
  });

export type CreateEventRsvpInput = z.infer<typeof createEventRsvpSchema>;
