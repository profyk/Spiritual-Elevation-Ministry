import { ContentForm } from "@/components/admin/ContentForm";
import { createContentItem } from "../actions";

export default function NewContentPage() {
  return (
    <div>
      <h1 className="mb-6 text-xl font-semibold">New content</h1>
      <ContentForm action={createContentItem} submitLabel="Create" />
    </div>
  );
}
