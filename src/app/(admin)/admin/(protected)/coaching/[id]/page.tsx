import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CoachingProgramForm } from "@/components/admin/CoachingProgramForm";
import { updateCoachingProgram } from "../actions";

export default async function EditCoachingProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: program } = await supabase
    .from("coaching_programs")
    .select("title, slug, description, format, duration, price_amount, price_currency, capacity, status")
    .eq("id", id)
    .maybeSingle();

  if (!program) notFound();

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
