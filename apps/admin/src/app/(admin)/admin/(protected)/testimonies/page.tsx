import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { TestimonyRow } from "@/components/admin/TestimonyRow";

interface TestimonyListItem {
  id: string;
  display_name: string | null;
  is_anonymous: boolean;
  body: string;
  status: string;
  is_featured: boolean;
  created_at: string;
}

export default async function AdminTestimoniesPage() {
  const session = await getAdminSession();
  const testimonies = session
    ? await adminApiFetchServer<TestimonyListItem[]>("/admin/testimonies", session.accessToken)
    : [];

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Testimonies</h1>
      <div className="space-y-3">
        {testimonies.map((t) => (
          <TestimonyRow key={t.id} testimony={t} />
        ))}
        {testimonies.length === 0 && (
          <p className="text-sm text-ink-faint">No testimonies to review.</p>
        )}
      </div>
    </div>
  );
}
