import { z } from "zod";

export const serviceContextSchema = z.enum([
  "prophetic_ministry",
  "healing_deliverance",
  "coaching",
  "events",
  "general",
]);

export const startConversationSchema = z
  .object({
    serviceContext: serviceContextSchema,
    visitorName: z.string().trim().min(1).max(200),
    contactEmail: z.string().trim().email().optional(),
    contactPhone: z.string().trim().min(6).max(30).optional(),
    firstMessage: z.string().trim().min(1).max(5000),
  })
  .strict()
  .refine((data) => data.contactEmail || data.contactPhone, {
    message: "At least one of contactEmail or contactPhone is required.",
    path: ["contactEmail"],
  });

export type StartConversationInput = z.infer<typeof startConversationSchema>;

export const sendMessageSchema = z
  .object({
    conversationId: z.string().uuid(),
    body: z.string().trim().max(5000).optional(),
    attachmentMediaId: z.string().uuid().optional(),
  })
  .strict()
  .refine((data) => (data.body && data.body.length > 0) || data.attachmentMediaId, {
    message: "A message needs text, an attachment, or both.",
    path: ["body"],
  });

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
