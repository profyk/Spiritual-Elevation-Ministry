import { notFound } from "next/navigation";
import { getAdminSession } from "@/lib/auth/get-admin";
import { adminApiFetchServer } from "@/lib/api-client";
import { CoachingProgramForm } from "@/components/admin/CoachingProgramForm";
import { updateCoachingProgram } from "../actions";

interface CoachingProgramDetail {
  title: string;
  slug: string;
  description: string | null;
  format: string | null;
  duration: string | null;
  price_amount: number | null;
  price_currency: string;
  capacity: number | null;
  status: "draft" | "published" | "archived";
}

export default async function EditCoachingProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) notFound();

  let program: CoachingProgramDetail;
  try {
    program = await adminApiFetchServer<CoachingProgramDetail>(
      `/admin/coaching-programs/${id}`,
      session.accessToken
    );
  } catch {
    notFound();
  }

  const boundAction = updateCoachingProgram.bind(null, id);

  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">Edit coaching program</h1>
      <CoachingProgramForm
        action={boundAction}
        submitLabel="Save changes"
        initialValues={{
          title: program.title,
          slug: program.slug,
          description: program.description ?? "",
          format: program.format ?? "",
          duration: program.duration ?? "",
          priceAmount: program.price_amount ? String(program.price_amount) : "",
          priceCurrency: program.price_currency,
          capacity: program.capacity ? String(program.capacity) : "",
          status: program.status,
        }}
      />
    </div>
  );
}
