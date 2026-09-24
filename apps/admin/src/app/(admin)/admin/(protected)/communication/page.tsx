import Link from "next/link";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";

const TABS: { value: string; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

interface ConversationListItem {
  id: string;
  visitor_name: string;
  service_context: string;
  status: string;
  assigned_to: string | null;
  updated_at: string;
}

export default async function AdminCommunicationPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const activeTab = TABS.find((t) => t.value === tab) ?? TABS[0];

  const session = await getAdminSession();
  const conversations = session
    ? await adminApiFetchServer<ConversationListItem[]>(
        `/admin/communication?tab=${activeTab.value}`,
        session.accessToken
      )
    : [];

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
                ? "bg-accent text-white"
                : "border border-line text-ink-muted hover:bg-surface-2"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="space-y-2">
        {conversations.map((c) => (
          <Link
            key={c.id}
            href={`/admin/communication/${c.id}`}
            className="block rounded-lg border border-line bg-surface p-4 hover:border-accent-line"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium text-ink">{c.visitor_name}</span>
              <span className="text-xs text-ink-faint">
                {new Date(c.updated_at).toLocaleString()}
              </span>
            </div>
            <div className="mt-1 flex gap-2 text-xs">
              <span className="rounded bg-surface-3 px-2 py-0.5 capitalize text-ink-muted">
                {c.service_context.replace("_", " ")}
              </span>
              <span className="rounded bg-surface-3 px-2 py-0.5 capitalize text-ink-muted">
                {c.status.replace("_", " ")}
              </span>
              {!c.assigned_to && (
                <span className="rounded bg-accent-surface px-2 py-0.5 text-accent-ink">Unassigned</span>
              )}
            </div>
          </Link>
        ))}
        {conversations.length === 0 && (
          <p className="text-sm text-ink-faint">No conversations in this view.</p>
        )}
      </div>
    </div>
  );
}
