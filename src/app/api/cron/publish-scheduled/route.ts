import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { writeAuditLog } from "@/lib/audit";

/**
 * Flips content_items from 'scheduled' to 'published' once scheduled_for
 * has passed (SPEC §23). Meant to run every few minutes via an external
 * scheduler — see .github/workflows/cron.yml — not on a request path.
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  const { data: due, error: selectError } = await supabase
    .from("content_items")
    .select("id, title")
    .eq("status", "scheduled")
    .lte("scheduled_for", now);

  if (selectError) {
    console.error("publish-scheduled: select failed", selectError);
    return NextResponse.json({ error: "Query failed." }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  const ids = due.map((item: { id: string }) => item.id);
  const { error: updateError } = await supabase
    .from("content_items")
    .update({ status: "published", published_at: now })
    .in("id", ids);

  if (updateError) {
    console.error("publish-scheduled: update failed", updateError);
    return NextResponse.json({ error: "Update failed." }, { status: 500 });
  }

  // System-initiated change, no human actor — audit_log.actor_id stays
  // null rather than being attributed to whoever happened to set the
  // schedule.
  await Promise.all(
    due.map((item: { id: string; title: string }) =>
      writeAuditLog(supabase, {
        actorId: null,
        action: "content.auto_published",
        entityType: "content_items",
        entityId: item.id,
        changes: { title: item.title },
      })
    )
  );

  return NextResponse.json({ published: due.length });
}
