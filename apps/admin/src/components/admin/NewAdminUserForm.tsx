"use client";

import { useState, useTransition } from "react";
import { createAdminUser } from "@/app/(admin)/admin/(protected)/users/actions";
import type { AdminRole } from "@sem/shared";

export function NewAdminUserForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<AdminRole>("staff");
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; tempPassword: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        const result = await createAdminUser({ email, fullName, role });
        setCreated(result);
        setEmail("");
        setFullName("");
        setRole("staff");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not create the account.");
      }
    });
  }

  if (created) {
    return (
      <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4 text-sm">
        <p className="font-medium text-green-900">Account created for {created.email}</p>
        <p className="mt-2 text-green-800">
          Temporary password — shown once, share it with them securely (not over email/Slack in
          plain text):
        </p>
        <code className="mt-1 block break-all rounded bg-white px-3 py-2 font-mono text-xs text-neutral-900">
          {created.tempPassword}
        </code>
        <button
          type="button"
          onClick={() => {
            setCreated(null);
            setOpen(false);
          }}
          className="mt-3 rounded-md border border-green-300 px-3 py-1.5 text-xs font-medium text-green-900 hover:bg-green-100"
        >
          Done
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mb-6 rounded-md bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900"
      >
        New admin
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6 max-w-md space-y-3 rounded-lg border border-neutral-200 bg-white p-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div>
        <label htmlFor="new-admin-email" className="mb-1 block text-sm font-medium">
          Email
        </label>
        <input
          id="new-admin-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="new-admin-name" className="mb-1 block text-sm font-medium">
          Full name
        </label>
        <input
          id="new-admin-name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label htmlFor="new-admin-role" className="mb-1 block text-sm font-medium">
          Role
        </label>
        <select
          id="new-admin-role"
          value={role}
          onChange={(e) => setRole(e.target.value as AdminRole)}
          className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="moderator">Moderator</option>
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-amber-800 px-4 py-2 text-sm font-medium text-white hover:bg-amber-900 disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create account"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-md border border-neutral-300 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
