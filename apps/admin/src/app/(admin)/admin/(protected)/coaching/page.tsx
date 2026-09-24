import Link from "next/link";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";

interface CoachingProgramListItem {
  id: string;
  title: string;
  status: string;
  price_amount: number | null;
  price_currency: string;
}

export default async function AdminCoachingPage() {
  const session = await getAdminSession();
  const programs = session
    ? await adminApiFetchServer<CoachingProgramListItem[]>("/admin/coaching-programs", session.accessToken)
    : [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Coaching Programs</h1>
        <Link
          href="/admin/coaching/new"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          New program
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-line bg-surface-2 text-left text-ink-faint">
            <tr>
              <th className="px-4 py-2 font-medium">Title</th>
              <th className="px-4 py-2 font-medium">Status</th>
              <th className="px-4 py-2 font-medium">Price</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((program) => (
              <tr key={program.id} className="border-b border-line-faint last:border-0">
                <td className="px-4 py-2">
                  <Link href={`/admin/coaching/${program.id}`} className="text-accent-ink hover:underline">
                    {program.title}
                  </Link>
                </td>
                <td className="px-4 py-2 capitalize">{program.status}</td>
                <td className="px-4 py-2">
                  {program.price_amount ? `${program.price_currency} ${program.price_amount}` : "—"}
                </td>
              </tr>
            ))}
            {programs.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-ink-faint">
                  No coaching programs yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-ink-faint">
        Enrollment interest submitted from the public site appears in Requests (type
        &quot;coaching interest&quot;). Converting one into a tracked enrollment with payment
        status is not built yet — currently the ministry follows up manually.
      </p>
    </div>
  );
}
