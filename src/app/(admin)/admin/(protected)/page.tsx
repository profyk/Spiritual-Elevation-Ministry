import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboardPage() {
  const supabase = await createClient();

  const [{ count: newRequests }, { count: openConversations }, { count: pendingTestimonies }] =
    await Promise.all([
      supabase
        .from("ministry_requests")
        .select("*", { count: "exact", head: true })
        .eq("status", "new"),
      supabase
        .from("conversations")
        .select("*", { count: "exact", head: true })
        .in("status", ["open", "assigned"]),
      supabase
        .from("testimonies")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

  const tiles = [
    { label: "New requests", value: newRequests ?? 0 },
    { label: "Open conversations", value: openConversations ?? 0 },
    { label: "Testimonies pending review", value: pendingTestimonies ?? 0 },
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
