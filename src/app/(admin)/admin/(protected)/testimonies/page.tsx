import { createClient } from "@/lib/supabase/server";
import { TestimonyRow } from "@/components/admin/TestimonyRow";

export default async function AdminTestimoniesPage() {
  const supabase = await createClient();
  const { data: testimonies } = await supabase
    .from("testimonies")
    .select("id, display_name, is_anonymous, body, status, is_featured, created_at")
    .neq("status", "archived")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Testimonies</h1>
      <div className="space-y-3">
        {(testimonies ?? []).map((t) => (
          <TestimonyRow key={t.id} testimony={t} />
        ))}
        {(!testimonies || testimonies.length === 0) && (
          <p className="text-sm text-neutral-500">No testimonies to review.</p>
        )}
      </div>
    </div>
  );
}
