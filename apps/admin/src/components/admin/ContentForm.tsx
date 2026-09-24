"use client";

import { useState } from "react";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

export interface ContentFormValues {
  contentType: "prophetic_message" | "sermon" | "article";
  title: string;
  slug: string;
  summary: string;
  body: string;
  category: string;
  tags: string;
  status: "draft" | "scheduled" | "published" | "unpublished" | "archived";
  scheduledFor: string;
  coverMediaId: string | null;
  coverMediaAltText: string | null;
  mediaId: string | null;
}

const DEFAULTS: ContentFormValues = {
  contentType: "article",
  title: "",
  slug: "",
  summary: "",
  body: "",
  category: "",
  tags: "",
  status: "draft",
  scheduledFor: "",
  coverMediaId: null,
  coverMediaAltText: null,
  mediaId: null,
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ContentForm({
  action,
  initialValues,
  submitLabel = "Save",
  readOnly = false,
}: {
  action: (formData: FormData) => void;
  initialValues?: Partial<ContentFormValues>;
  submitLabel?: string;
  /** Moderator gets read-only "content review" access (SPEC §21) — a
   * native <fieldset disabled> is enough to lock every field without
   * threading a prop through each one, and the server action re-checks
   * the role anyway so this is a UX convenience, not the real boundary. */
  readOnly?: boolean;
}) {
  const [values, setValues] = useState<ContentFormValues>({ ...DEFAULTS, ...initialValues });
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));
  const [sermonMediaKind, setSermonMediaKind] = useState<"audio" | "video">("audio");

  return (
    <form action={action} className="max-w-2xl space-y-4">
      <fieldset disabled={readOnly} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contentType" className="mb-1 block text-sm font-medium">
            Type
          </label>
          <select
            id="contentType"
            name="contentType"
            value={values.contentType}
            onChange={(e) =>
              setValues((v) => ({ ...v, contentType: e.target.value as ContentFormValues["contentType"] }))
            }
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="prophetic_message">Prophetic message</option>
            <option value="sermon">Sermon</option>
            <option value="article">Article</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            value={values.status}
            onChange={(e) =>
              setValues((v) => ({ ...v, status: e.target.value as ContentFormValues["status"] }))
            }
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="title" className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          value={values.title}
          onChange={(e) => {
            const title = e.target.value;
            setValues((v) => ({
              ...v,
              title,
              slug: slugTouched ? v.slug : slugify(title),
            }));
          }}
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-1 block text-sm font-medium">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          required
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            setValues((v) => ({ ...v, slug: e.target.value }));
          }}
          className="w-full rounded-md border border-line px-3 py-2 text-sm font-mono text-xs"
        />
      </div>

      <div>
        <label htmlFor="summary" className="mb-1 block text-sm font-medium">
          Summary
        </label>
        <textarea
          id="summary"
          name="summary"
          rows={2}
          value={values.summary}
          onChange={(e) => setValues((v) => ({ ...v, summary: e.target.value }))}
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="body" className="mb-1 block text-sm font-medium">
          Body
        </label>
        <textarea
          id="body"
          name="body"
          rows={10}
          value={values.body}
          onChange={(e) => setValues((v) => ({ ...v, body: e.target.value }))}
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category" className="mb-1 block text-sm font-medium">
            Category
          </label>
          <input
            id="category"
            name="category"
            value={values.category}
            onChange={(e) => setValues((v) => ({ ...v, category: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="tags" className="mb-1 block text-sm font-medium">
            Tags (comma-separated)
          </label>
          <input
            id="tags"
            name="tags"
            value={values.tags}
            onChange={(e) => setValues((v) => ({ ...v, tags: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
      </div>

      <MediaUploadField
        name="coverMediaId"
        label="Cover image"
        kind="image"
        initialMediaId={values.coverMediaId}
        initialAltText={values.coverMediaAltText}
      />

      {values.contentType === "sermon" && (
        <div>
          <span className="mb-1 block text-sm font-medium">Sermon media</span>
          <div className="mb-2 flex gap-4 text-sm">
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="sermonMediaKind"
                checked={sermonMediaKind === "audio"}
                onChange={() => setSermonMediaKind("audio")}
              />
              Audio
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio"
                name="sermonMediaKind"
                checked={sermonMediaKind === "video"}
                onChange={() => setSermonMediaKind("video")}
              />
              Video
            </label>
          </div>
          <MediaUploadField
            key={sermonMediaKind}
            name="mediaId"
            label={sermonMediaKind === "audio" ? "Upload audio file" : "Upload video file"}
            kind={sermonMediaKind}
            initialMediaId={values.mediaId}
          />
        </div>
      )}

      {values.status === "scheduled" && (
        <div>
          <label htmlFor="scheduledFor" className="mb-1 block text-sm font-medium">
            Publish at
          </label>
          <input
            id="scheduledFor"
            name="scheduledFor"
            type="datetime-local"
            value={values.scheduledFor}
            onChange={(e) => setValues((v) => ({ ...v, scheduledFor: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
      )}

      </fieldset>

      {readOnly ? (
        <p className="text-xs text-ink-faint">Read-only — your role can review but not edit content.</p>
      ) : (
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
        >
          {submitLabel}
        </button>
      )}
    </form>
  );
}
