import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { TestimonyForm } from "@/components/forms/TestimonyForm";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Testimonies",
  description: "Testimonies shared by this ministry's community.",
};

async function getApprovedTestimonies() {
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("testimonies")
      .select("id, display_name, is_anonymous, body, is_featured, created_at")
      .eq("status", "approved")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function TestimoniesPage() {
  const testimonies = await getApprovedTestimonies();

  return (
    <Container className="max-w-2xl py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Testimonies</h1>

      <div className="mt-8 space-y-4">
        {testimonies.length === 0 && (
          <p className="text-sm text-neutral-500">No testimonies published yet.</p>
        )}
        {testimonies.map((t) => (
          <blockquote key={t.id} className="rounded-lg border border-neutral-200 p-5">
            <p className="text-neutral-700">{t.body}</p>
            <footer className="mt-2 text-sm text-neutral-500">
              — {t.is_anonymous || !t.display_name ? "Anonymous" : t.display_name}
            </footer>
          </blockquote>
        ))}
      </div>

      <div className="mt-10 rounded-lg border border-neutral-200 p-6">
        <h2 className="mb-4 text-lg font-medium text-neutral-900">Share Your Testimony</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Submissions are reviewed by the ministry before appearing publicly.
        </p>
        <TestimonyForm />
      </div>
    </Container>
  );
}
