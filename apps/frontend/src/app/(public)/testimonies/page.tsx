import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { TestimonyForm } from "@/components/forms/TestimonyForm";
import { apiFetchSafe } from "@/lib/api-client";

export const metadata: Metadata = {
  title: "Testimonies",
  description: "Testimonies shared by this ministry's community.",
};

interface TestimonyListItem {
  id: string;
  display_name: string | null;
  is_anonymous: boolean;
  body: string;
  is_featured: boolean;
  created_at: string;
}

async function getApprovedTestimonies(): Promise<TestimonyListItem[]> {
  return apiFetchSafe<TestimonyListItem[]>("/testimonies", []);
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
