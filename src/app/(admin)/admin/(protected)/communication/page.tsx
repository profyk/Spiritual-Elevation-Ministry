import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const TABS: { value: string; label: string; statuses: string[] }[] = [
  { value: "active", label: "Active", statuses: ["open", "assigned", "pending_visitor"] },
  { value: "closed", label: "Closed", statuses: ["closed"] },
  { value: "archived", label: "Archived", statuses: ["archived"] },
];

export default async function AdminCommunicationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = TABS.find((t) => t.value === tab) ?? TABS[0];

  const supabase = await createClient();
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, visitor_name, service_context, status, assigned_to, updated_at")
    .in("status", activeTab.statuses)
    .order("updated_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Communication Center</h1>

      <div className="mb-6 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={`/admin/communication?tab=${t.value}`}
            className={`rounded-md px-3 py-1.5 text-sm ${
              activeTab.value === t.value
                ? "bg-amber-800 text-white"
                : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {(conversations ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/admin/communication/${c.id}`}
            className="block rounded-lg border border-neutral-200 bg-white p-4 hover:border-amber-800"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-neutral-900">{c.visitor_name}</span>
              <span className="text-xs text-neutral-400">
                {new Date(c.updated_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 flex gap-2 text-xs">
              <span className="rounded bg-neutral-100 px-2 py-0.5 capitalize text-neutral-600">
                {c.service_context.replace("_", " ")}
              </span>
              <span className="rounded bg-neutral-100 px-2 py-0.5 capitalize text-neutral-600">
                {c.status.replace("_", " ")}
              </span>
              {!c.assigned_to && (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">Unassigned</span>
              )}
            </div>
          </Link>
        ))}
        {(!conversations || conversations.length === 0) && (
          <p className="text-sm text-neutral-500">No conversations in this view.</p>
        )}
      </div>
    </div>
  );
}
