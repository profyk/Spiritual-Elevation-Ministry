import { NextResponse } from "next/server";
import { createClient, createServiceRoleClient } from "@/lib/supabase/server";
import { getAdminSession } from "@/lib/auth/get-admin";
import { isStaffOrAbove } from "@/lib/permissions";
import { uploadMetadataSchema } from "@/lib/validation/media";
import { validateUpload } from "@/lib/media/validation";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

const VISITOR_UPLOAD_RATE_LIMIT = { limit: 20, windowMs: 60 * 60 * 1000 };

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
}

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }

  const parsedMeta = uploadMetadataSchema.safeParse({
    kind: formData.get("kind"),
    context: formData.get("context"),
    conversationId: formData.get("conversationId") || undefined,
  });
  if (!parsedMeta.success) {
    return NextResponse.json(
      { error: "Invalid upload metadata.", issues: parsedMeta.error.flatten() },
      { status: 400 }
    );
  }
  const { kind, context, conversationId } = parsedMeta.data;

  const bytes = new Uint8Array(await file.arrayBuffer());
  const validation = validateUpload(kind, file.type, file.size, bytes);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  // Resolve identity + permission for this upload. Every branch below
  // either 401/403s or fixes exactly who owns the resulting media row —
  // never both an admin and a visitor, matching the DB check constraint.
  const adminSession = await getAdminSession();
  const isStaffUpload = isStaffOrAbove(adminSession?.admin ?? null);

  let bucket: "media" | "attachments";
  let uploadedByAdmin: string | null = null;
  let uploadedByVisitor: string | null = null;
  let pathPrefix: string;

  if (context === "admin") {
    if (!isStaffUpload) {
      return NextResponse.json({ error: "Not authorized." }, { status: 403 });
    }
    bucket = "media";
    uploadedByAdmin = adminSession!.admin.id;
    pathPrefix = `admin/${uploadedByAdmin}`;
  } else if (context === "chat") {
    if (!conversationId) {
      return NextResponse.json({ error: "conversationId is required for chat uploads." }, { status: 400 });
    }

    if (isStaffUpload) {
      bucket = "attachments";
      uploadedByAdmin = adminSession!.admin.id;
      pathPrefix = `staff/${uploadedByAdmin}`;
    } else {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ error: "No visitor session." }, { status: 401 });
      }

      const ip = getClientIp(request);
      const { allowed } = checkRateLimit(`media-upload:${ip}`, VISITOR_UPLOAD_RATE_LIMIT);
      if (!allowed) {
        return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
      }

      // RLS naturally scopes this to conversations owned by the caller —
      // an empty result means either it doesn't exist or isn't theirs;
      // either way, a 404 is the right response.
      const { data: conversation } = await supabase
        .from("conversations")
        .select("id")
        .eq("id", conversationId)
        .eq("visitor_auth_id", user.id)
        .maybeSingle();
      if (!conversation) {
        return NextResponse.json({ error: "Conversation not found." }, { status: 404 });
      }

      bucket = "attachments";
      uploadedByVisitor = user.id;
      pathPrefix = `visitor/${user.id}`;
    }
  } else {
    // context === "testimony"
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "No visitor session." }, { status: 401 });
    }

    const ip = getClientIp(request);
    const { allowed } = checkRateLimit(`media-upload:${ip}`, VISITOR_UPLOAD_RATE_LIMIT);
    if (!allowed) {
      return NextResponse.json({ error: "Too many uploads. Please slow down." }, { status: 429 });
    }

    bucket = "attachments";
    uploadedByVisitor = user.id;
    pathPrefix = `visitor/${user.id}`;
  }

  const objectPath = `${pathPrefix}/${crypto.randomUUID()}-${sanitizeFilename(file.name)}`;
  const serviceClient = createServiceRoleClient();

  // Storage RLS is deliberately deny-all on both buckets (see
  // 0002_storage_and_media_policies.sql) — every write goes through the
  // service-role client here, after the permission check above, not
  // through a client-facing storage policy.
  const { error: uploadError } = await serviceClient.storage
    .from(bucket)
    .upload(objectPath, bytes, { contentType: file.type, upsert: false });

  if (uploadError) {
    console.error("storage upload failed", uploadError);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  const { data: mediaRow, error: insertError } = await serviceClient
    .from("media")
    .insert({
      bucket,
      storage_path: objectPath,
      media_kind: kind,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by_admin: uploadedByAdmin,
      uploaded_by_visitor: uploadedByVisitor,
    })
    .select("id")
    .single();

  if (insertError) {
    console.error("media row insert failed", insertError);
    await serviceClient.storage.from(bucket).remove([objectPath]);
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }

  return NextResponse.json({ id: mediaRow.id }, { status: 201 });
}
