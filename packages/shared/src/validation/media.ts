import { z } from "zod";

export const mediaKindSchema = z.enum(["image", "audio", "video", "document"]);
export type MediaKind = z.infer<typeof mediaKindSchema>;

export const uploadContextSchema = z.enum(["admin", "chat", "testimony"]);
export type UploadContext = z.infer<typeof uploadContextSchema>;

/**
 * Fields sent alongside the file in the multipart form body of
 * POST /api/media. `conversationId` is required when context is "chat" —
 * checked in the route handler, not here, since it depends on the other
 * field's value.
 */
export const uploadMetadataSchema = z.object({
  kind: mediaKindSchema,
  context: uploadContextSchema,
  conversationId: z.string().uuid().optional(),
});
