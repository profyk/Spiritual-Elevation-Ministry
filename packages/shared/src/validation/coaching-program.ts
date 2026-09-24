import { z } from "zod";

export const coachingProgramSchema = z.object({
  title: z.string().trim().min(1).max(300),
  slug: z
    .string()
    .trim()
    .min(1)
    .max(300)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
  description: z.string().trim().max(5000).optional(),
  format: z.string().trim().max(100).optional(),
  duration: z.string().trim().max(100).optional(),
  priceAmount: z.coerce.number().nonnegative().optional(),
  priceCurrency: z.string().trim().length(3).default("ZAR"),
  capacity: z.coerce.number().int().positive().optional(),
  status: z.enum(["draft", "published", "archived"]),
});

export type CoachingProgramInput = z.infer<typeof coachingProgramSchema>;
