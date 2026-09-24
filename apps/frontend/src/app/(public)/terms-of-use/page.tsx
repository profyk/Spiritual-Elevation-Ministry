import type { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { getLegalPage } from "@/lib/legal-pages";

export const metadata: Metadata = { title: "Terms of Use" };

export default async function TermsOfUsePage() {
  const page = await getLegalPage("terms_of_use");

  return (
    <Container className="max-w-2xl py-12">
      <h1 className="text-2xl font-semibold text-neutral-900">Terms of Use</h1>
      {page.updated_at && (
        <p className="mt-1 text-xs text-neutral-400">
          Last updated {new Date(page.updated_at).toLocaleDateString()}
        </p>
      )}
      <div className="prose prose-neutral mt-6 max-w-none whitespace-pre-wrap text-neutral-700">
        {page.body ??
          "[SAMPLE] Terms of Use content has not been configured yet. Set it at Admin -> Settings -> Legal."}
      </div>
    </Container>
  );
}
