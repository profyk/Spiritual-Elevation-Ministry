"use client";

import { useState } from "react";

export interface CoachingProgramFormValues {
  title: string;
  slug: string;
  description: string;
  format: string;
  duration: string;
  priceAmount: string;
  priceCurrency: string;
  capacity: string;
  status: "draft" | "published" | "archived";
}

const DEFAULTS: CoachingProgramFormValues = {
  title: "",
  slug: "",
  description: "",
  format: "",
  duration: "",
  priceAmount: "",
  priceCurrency: "ZAR",
  capacity: "",
  status: "draft",
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function CoachingProgramForm({
  action,
  initialValues,
  submitLabel = "Save",
}: {
  action: (formData: FormData) => void;
  initialValues?: Partial<CoachingProgramFormValues>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<CoachingProgramFormValues>({ ...DEFAULTS, ...initialValues });
  const [slugTouched, setSlugTouched] = useState(Boolean(initialValues?.slug));

  return (
    <form action={action} className="max-w-2xl space-y-4">
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
            setValues((v) => ({ ...v, title, slug: slugTouched ? v.slug : slugify(title) }));
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
        <label htmlFor="description" className="mb-1 block text-sm font-medium">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={values.description}
          onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="format" className="mb-1 block text-sm font-medium">
            Format
          </label>
          <input
            id="format"
            name="format"
            placeholder="1:1, group, ..."
            value={values.format}
            onChange={(e) => setValues((v) => ({ ...v, format: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="duration" className="mb-1 block text-sm font-medium">
            Duration
          </label>
          <input
            id="duration"
            name="duration"
            placeholder="6 weeks"
            value={values.duration}
            onChange={(e) => setValues((v) => ({ ...v, duration: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="priceAmount" className="mb-1 block text-sm font-medium">
            Price
          </label>
          <input
            id="priceAmount"
            name="priceAmount"
            type="number"
            min={0}
            step="0.01"
            value={values.priceAmount}
            onChange={(e) => setValues((v) => ({ ...v, priceAmount: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="priceCurrency" className="mb-1 block text-sm font-medium">
            Currency
          </label>
          <input
            id="priceCurrency"
            name="priceCurrency"
            maxLength={3}
            value={values.priceCurrency}
            onChange={(e) => setValues((v) => ({ ...v, priceCurrency: e.target.value.toUpperCase() }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="capacity" className="mb-1 block text-sm font-medium">
            Capacity
          </label>
          <input
            id="capacity"
            name="capacity"
            type="number"
            min={1}
            value={values.capacity}
            onChange={(e) => setValues((v) => ({ ...v, capacity: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
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
            setValues((v) => ({ ...v, status: e.target.value as CoachingProgramFormValues["status"] }))
          }
          className="w-full rounded-md border border-line px-3 py-2 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <button
        type="submit"
        className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover"
      >
        {submitLabel}
      </button>
    </form>
  );
}
