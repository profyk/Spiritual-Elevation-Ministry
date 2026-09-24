"use client";

import { useState } from "react";
import { MediaUploadField } from "@/components/admin/MediaUploadField";

export interface EventFormValues {
  title: string;
  slug: string;
  description: string;
  startAt: string;
  endAt: string;
  locationType: "physical" | "online";
  locationAddress: string;
  onlineUrl: string;
  status: "draft" | "published" | "cancelled" | "archived";
  rsvpEnabled: boolean;
  capacity: string;
  coverMediaId: string | null;
  coverMediaAltText: string | null;
}

const DEFAULTS: EventFormValues = {
  title: "",
  slug: "",
  description: "",
  startAt: "",
  endAt: "",
  locationType: "physical",
  locationAddress: "",
  onlineUrl: "",
  status: "draft",
  rsvpEnabled: false,
  capacity: "",
  coverMediaId: null,
  coverMediaAltText: null,
};

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function EventForm({
  action,
  initialValues,
  submitLabel = "Save",
}: {
  action: (formData: FormData) => void;
  initialValues?: Partial<EventFormValues>;
  submitLabel?: string;
}) {
  const [values, setValues] = useState<EventFormValues>({ ...DEFAULTS, ...initialValues });
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
          <label htmlFor="startAt" className="mb-1 block text-sm font-medium">
            Starts
          </label>
          <input
            id="startAt"
            name="startAt"
            type="datetime-local"
            required
            value={values.startAt}
            onChange={(e) => setValues((v) => ({ ...v, startAt: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label htmlFor="endAt" className="mb-1 block text-sm font-medium">
            Ends
          </label>
          <input
            id="endAt"
            name="endAt"
            type="datetime-local"
            value={values.endAt}
            onChange={(e) => setValues((v) => ({ ...v, endAt: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="locationType" className="mb-1 block text-sm font-medium">
            Location type
          </label>
          <select
            id="locationType"
            name="locationType"
            value={values.locationType}
            onChange={(e) =>
              setValues((v) => ({ ...v, locationType: e.target.value as EventFormValues["locationType"] }))
            }
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="physical">Physical</option>
            <option value="online">Online</option>
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
            onChange={(e) => setValues((v) => ({ ...v, status: e.target.value as EventFormValues["status"] }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="cancelled">Cancelled</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {values.locationType === "physical" ? (
        <div>
          <label htmlFor="locationAddress" className="mb-1 block text-sm font-medium">
            Address
          </label>
          <input
            id="locationAddress"
            name="locationAddress"
            value={values.locationAddress}
            onChange={(e) => setValues((v) => ({ ...v, locationAddress: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
      ) : (
        <div>
          <label htmlFor="onlineUrl" className="mb-1 block text-sm font-medium">
            Online URL
          </label>
          <input
            id="onlineUrl"
            name="onlineUrl"
            type="url"
            value={values.onlineUrl}
            onChange={(e) => setValues((v) => ({ ...v, onlineUrl: e.target.value }))}
            className="w-full rounded-md border border-line px-3 py-2 text-sm"
          />
        </div>
      )}

      <MediaUploadField
        name="coverMediaId"
        label="Cover image"
        kind="image"
        initialMediaId={values.coverMediaId}
        initialAltText={values.coverMediaAltText}
      />

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            name="rsvpEnabled"
            checked={values.rsvpEnabled}
            onChange={(e) => setValues((v) => ({ ...v, rsvpEnabled: e.target.checked }))}
          />
          Enable RSVP
        </label>
        {values.rsvpEnabled && (
          <div>
            <label htmlFor="capacity" className="sr-only">
              Capacity
            </label>
            <input
              id="capacity"
              name="capacity"
              type="number"
              min={1}
              placeholder="Capacity"
              value={values.capacity}
              onChange={(e) => setValues((v) => ({ ...v, capacity: e.target.value }))}
              className="w-28 rounded-md border border-line px-3 py-2 text-sm"
            />
          </div>
        )}
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
