import Link from "next/link";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { RequestRow } from "@/components/admin/RequestRow";

const STATUS_FILTERS = ["new", "in_progress", "resolved", "archived"] as const;

interface MinistryRequestListItem {
  id: string;
  request_type: string;
  concerns_missing_person: boolean;
  name: string;
  contact_email: string | null;
  contact_phone: string | null;
  details: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const activeStatus = STATUS_FILTERS.includes(status as (typeof STATUS_FILTERS)[number])
    ? status!
    : "new";

  const session = await getAdminSession();
  const requests = session
    ? await adminApiFetchServer<MinistryRequestListItem[]>(
        `/admin/requests?status=${activeStatus}`,
        session.accessToken
      )
    : [];

  return (
    <div>
      <h1 className="mb-4 text-xl font-semibold">Requests</h1>

      <div className="mb-6 flex gap-2">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={`/admin/requests?status=${s}`}
            className={`rounded-md px-3 py-1.5 text-sm capitalize ${
              activeStatus === s
                ? "bg-amber-800 text-white"
                : "border border-neutral-300 text-neutral-600 hover:bg-neutral-50"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <RequestRow key={r.id} request={r} />
        ))}
        {requests.length === 0 && (
          <p className="text-sm text-neutral-500">No requests in this view.</p>
        )}
      </div>
    </div>
  );
}
