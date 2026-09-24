import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";

interface DashboardCounts {
  newRequests: number;
  openConversations: number;
  pendingTestimonies: number;
}

export default async function AdminDashboardPage() {
  const session = await getAdminSession();
  const counts = session
    ? await adminApiFetchServer<DashboardCounts>("/admin/dashboard-counts", session.accessToken)
    : { newRequests: 0, openConversations: 0, pendingTestimonies: 0 };

  const tiles = [
    { label: "New requests", value: counts.newRequests },
    { label: "Open conversations", value: counts.openConversations },
    { label: "Testimonies pending review", value: counts.pendingTestimonies },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Dashboard</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-lg border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-semibold">{tile.value}</div>
            <div className="text-sm text-neutral-500">{tile.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
