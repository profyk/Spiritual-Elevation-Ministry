import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "About",
  description: "About Spiritual Elevation Ministry.",
};

export default function AboutPage() {
  return (
    <Container className="max-w-2xl py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">About Us</h1>
      <p className="mt-4 text-neutral-600">
        [SAMPLE] Placeholder about-page content — replace with the ministry&apos;s real story,
        leadership, and statement of faith from Admin -&gt; Content before launch (SPEC §41).
      </p>
    </Container>
  );
}
