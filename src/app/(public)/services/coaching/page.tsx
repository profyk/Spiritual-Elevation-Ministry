import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { MinistryRequestForm } from "@/components/forms/MinistryRequestForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Life & Spiritual Coaching",
  description: "Coaching programs for spiritual growth.",
};

async function getCoachingPrograms() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("coaching_programs")
      .select("id, title, description, format, duration, price_amount, price_currency")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function CoachingPage() {
  const programs = await getCoachingPrograms();

  return (
    <Container className="max-w-3xl py-12">
      <Compass className="h-8 w-8 text-amber-800" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">Life &amp; Spiritual Coaching</h1>
      <p className="mt-3 text-neutral-600">
        [SAMPLE] Placeholder description. Payment for coaching programs is arranged directly
        with the ministry (WhatsApp, bank transfer, etc.) after you enroll below — there is no
        online payment yet.
      </p>

      <div className="mt-8 space-y-4">
        {programs.length === 0 && (
          <p className="text-sm text-neutral-500">
            No coaching programs are published yet. Check back soon.
          </p>
        )}
        {programs.map((program) => (
          <div key={program.id} className="rounded-lg border border-neutral-200 p-5">
            <h2 className="font-medium text-neutral-900">{program.title}</h2>
            {program.description && (
              <p className="mt-1 text-sm text-neutral-600">{program.description}</p>
            )}
            <p className="mt-2 text-sm text-neutral-500">
              {[program.format, program.duration].filter(Boolean).join(" · ")}
              {program.price_amount ? ` · ${program.price_currency} ${program.price_amount}` : ""}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-neutral-200 p-6">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">Enrollment Interest</h2>
        <MinistryRequestForm requestType="coaching_interest" />
      </div>
    </Container>
  );
}
