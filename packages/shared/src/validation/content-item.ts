import { z } from "zod";

export const contentTypeSchema = z.enum(["prophetic_message", "sermon", "article"]);
export const contentStatusSchema = z.enum([
  "draft",
  "scheduled",
  "published",
  "unpublished",
  "archived",
]);

export const contentItemSchema = z
  .object({
    contentType: contentTypeSchema,
    title: z.string().trim().min(1).max(300),
    slug: z
      .string()
      .trim()
      .min(1)
      .max(300)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only."),
    summary: z.string().trim().max(500).optional(),
    body: z.string().trim().max(20000).optional(),
    category: z.string().trim().max(100).optional(),
    tags: z.array(z.string().trim().max(50)).max(20).default([]),
    status: contentStatusSchema,
    scheduledFor: z.string().datetime().optional().nullable(),
    coverMediaId: z.string().uuid().optional().nullable(),
    mediaId: z.string().uuid().optional().nullable(),
    // SPEC §33: required whenever a cover image is attached — enforced as
    // a required field in the editor, not just a convention.
    coverMediaAltText: z.string().trim().max(500).optional(),
  })
  .refine((data) => !data.coverMediaId || Boolean(data.coverMediaAltText), {
    message: "Alt text is required for the cover image.",
    path: ["coverMediaAltText"],
  });

export type ContentItemInput = z.infer<typeof contentItemSchema>;
