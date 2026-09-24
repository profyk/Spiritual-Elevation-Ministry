import { z } from "zod";

export const eventSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().trim().max(5000).optional(),
  startAt: z.string().min(1),
  endAt: z.string().optional(),
  locationType: z.enum(["physical", "online"]),
  locationAddress: z.string().trim().max(500).optional(),
  onlineUrl: z.string().trim().url().optional().or(z.literal("")),
  status: z.enum(["draft", "published", "cancelled", "archived"]),
  rsvpEnabled: z.boolean().default(false),
  capacity: z.coerce.number().int().positive().optional(),
  coverMediaId: z.string().uuid().optional().nullable(),
});

export type EventInput = z.infer<typeof eventSchema>;
