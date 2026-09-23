import { z } from "zod";

export const createTestimonySchema = z
  .object({
    displayName: z.string().trim().max(200).optional(),
    isAnonymous: z.boolean().default(false),
    body: z.string().trim().min(10).max(5000),
  })
  .strict();

export type CreateTestimonyInput = z.infer<typeof createTestimonySchema>;
