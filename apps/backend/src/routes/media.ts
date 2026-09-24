import { Router } from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import { createAnonClient, createServiceRoleClient } from "../lib/supabase";
import { getMediaSignedUrl } from "../lib/media-storage";
import { checkRateLimit, getClientIp } from "../lib/rate-limit";
import { uploadMetadataSchema, validateUpload } from "@sem/shared";
import type { AdminRole } from "@sem/shared";

const ROLE_RANK: Record<AdminRole, number> = { moderator: 0, staff: 1, admin: 2, super_admin: 3 };

export const mediaRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

const VISITOR_UPLOAD_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

mediaRouter.post("/media", upload.single("file"), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: "No file provided." });

  const parsedMeta = uploadMetadataSchema.safeParse({
    kind: req.body.kind,
    context: req.body.context,
    conversationId: req.body.conversationId || undefined,
  });
  if (!parsedMeta.success) {
    return res.status(400).json({ error: "Invalid upload metadata.", issues: parsedMeta.error.flatten() });
  }
  const { kind, context, conversationId } = parsedMeta.data;

  const validation = validateUpload(kind, file.mimetype, file.size, file.buffer);
  if (!validation.ok) return res.status(400).json({ error: validation.error });

  // Resolve identity + permission. Every branch fixes exactly one of
  // uploadedByAdmin/uploadedByVisitor, matching the DB check constraint.
  let uploadedByAdmin: string | null = null;
  let uploadedByVisitor: string | null = null;
  let pathPrefix: string;
  const bucket = context === "admin" ? "media" : "attachments";

  const isStaffCaller = async (): Promise<boolean> => {
    if (!req.userId || !req.userClient) return false;
    const { data } = await req.userClient
      .from("admin_users")
      .select("role, is_active")
      .eq("id", req.userId)
      .maybeSingle();
    return Boolean(data?.is_active && ROLE_RANK[data.role as AdminRole] >= ROLE_RANK.staff);
  };

  if (context === "admin") {
    if (!(await isStaffCaller())) return res.status(403).json({ error: "Not authorized." });
    uploadedByAdmin = req.userId!;
    pathPrefix = `admin/${uploadedByAdmin}`;
  } else if (context === "chat") {
    if (!conversationId) return res.status(400).json({ error: "conversationId is required for chat uploads." });
    if (!req.userId || !req.userClient) return res.status(401).json({ error: "No session." });

    if (await isStaffCaller()) {
      uploadedByAdmin = req.userId;
      pathPrefix = `staff/${uploadedByAdmin}`;
    } else {
      const { allowed } = checkRateLimit(`media-upload:${getClientIp(req)}`, VISITOR_UPLOAD_RATE_LIMIT);
      if (!allowed) return res.status(429).json({ error: "Too many uploads. Please slow down." });

      const { data: conversation } = await req.userClient
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("visitor_auth_id", req.userId)
        .maybeSingle();
      if (!conversation) return res.status(404).json({ error: "Conversation not found." });

      uploadedByVisitor = req.userId;
      pathPrefix = `visitor/${uploadedByVisitor}`;
    }
  } else {
    // context === "testimony"
    if (!req.userId) return res.status(401).json({ error: "No visitor session." });

    const { allowed } = checkRateLimit(`media-upload:${getClientIp(req)}`, VISITOR_UPLOAD_RATE_LIMIT);
    if (!allowed) return res.status(429).json({ error: "Too many uploads. Please slow down." });

    uploadedByVisitor = req.userId;
    pathPrefix = `visitor/${uploadedByVisitor}`;
  }

  const objectPath = `${pathPrefix}/${randomUUID()}-${sanitizeFilename(file.originalname)}`;
  const serviceClient = createServiceRoleClient();

  // Storage RLS is deny-all on both buckets — every write goes through the
  // service-role client here, after the permission check above.
  const { error: uploadError } = await serviceClient.storage
    .from(bucket)
    .upload(objectPath, file.buffer, { contentType: file.mimetype, upsert: false });

  if (uploadError) {
    console.error("storage upload failed", uploadError);
    return res.status(500).json({ error: "Upload failed." });
  }

  const { data: mediaRow, error: insertError } = await serviceClient
    .from("media")
    .insert({
      bucket,
      storage_path: objectPath,
      media_kind: kind,
      mime_type: file.mimetype,
      size_bytes: file.size,
      uploaded_by_admin: uploadedByAdmin,
      uploaded_by_visitor: uploadedByVisitor,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("media row insert failed", insertError);
    await serviceClient.storage.from(bucket).remove([objectPath]);
    return res.status(500).json({ error: "Upload failed." });
  }

  res.status(201).json({ id: mediaRow.id });
});

mediaRouter.get("/media/:id/signed-url", async (req, res) => {
  const client = req.userClient ?? createAnonClient();
  const url = await getMediaSignedUrl(req.params.id, client);
  if (!url) return res.status(404).json({ error: "Not found." });
  res.json({ url });
});
