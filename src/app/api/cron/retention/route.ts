import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { writeAuditLog } from "@/lib/audit";

/**
 * Archives (never deletes — SPEC §28 requires a separate, explicit,
 * human-confirmed action for that) closed conversations and resolved
 * ministry requests past the retention period recorded in
 * website_settings.data_retention_months. Meant to run daily via an
 * external scheduler — see .github/workflows/cron.yml.
 */
export async function POST(request: Request) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const supabase = createServiceRoleClient();

  const { data: setting } = await supabase
    .from("website_settings")
    .select("value")
    .eq("key", "data_retention_months")
    .maybeSingle();

  const retentionMonths = Number(setting?.value ?? 24);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - retentionMonths);
  const cutoffIso = cutoff.toISOString();

  const { data: conversations, error: conversationsError } = await supabase
    .from("conversations")
    .select("id")
    .eq("status", "closed")
    .lt("updated_at", cutoffIso);

  const { data: requests, error: requestsError } = await supabase
    .from("ministry_requests")
    .select("id")
    .eq("status", "resolved")
    .lt("updated_at", cutoffIso);

  if (conversationsError || requestsError) {
    console.error("retention: query failed", conversationsError, requestsError);
    return NextResponse.json({ error: "Query failed." }, { status: 500 });
  }

  const conversationIds = (conversations ?? []).map((c: { id: string }) => c.id);
  const requestIds = (requests ?? []).map((r: { id: string }) => r.id);

  if (conversationIds.length > 0) {
    await supabase.from("conversations").update({ status: "archived" }).in("id", conversationIds);
    await Promise.all(
      conversationIds.map((id: string) =>
        writeAuditLog(supabase, {
          actorId: null,
          action: "conversation.retention_archive",
          entityType: "conversations",
          entityId: id,
          changes: { retentionMonths },
        })
      )
    );
  }

  if (requestIds.length > 0) {
    await supabase.from("ministry_requests").update({ status: "archived" }).in("id", requestIds);
    await Promise.all(
      requestIds.map((id: string) =>
        writeAuditLog(supabase, {
          actorId: null,
          action: "ministry_request.retention_archive",
          entityType: "ministry_requests",
          entityId: id,
          changes: { retentionMonths },
        })
      )
    );
  }

  return NextResponse.json({
    archivedConversations: conversationIds.length,
    archivedRequests: requestIds.length,
    retentionMonths,
  });
}
