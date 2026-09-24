# Spiritual Elevation Ministry — Platform

A three-service platform on a shared Supabase project (Postgres, Auth, Realtime, Storage):

- **`apps/backend`** — Node.js + Express API, owns every application data read/write. → Railway.
- **`apps/frontend`** — Next.js public website, talks to the backend over HTTP. → Vercel.
- **`apps/admin`** — Next.js admin dashboard, a separate deployment from the frontend. → Vercel.
- **`packages/shared`** — Zod schemas, permission logic, and other code all three import.

See `docs/ARCHITECTURE.md` for why it's split this way and exactly where the HTTP boundary sits
(auth and Realtime stay direct-to-Supabase from the browser; everything else goes through the
backend).

- [`docs/SPEC.md`](docs/SPEC.md) — the product requirements, source of truth.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, folder structure, data model, security
  design.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — set up Supabase and deploy all three services.
- [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) — how ministry staff use the admin app.
- [`supabase/migrations/`](supabase/migrations) — the database schema (RLS enabled everywhere).

## Status

Every product phase is built — foundation, public website, content management, real-time chat
with file attachments, notifications, scheduled publishing/retention jobs, and a Playwright suite
covering the SPEC §39 acceptance journey — now split across the three services above. All three
build, lint, and type-check cleanly; unit tests pass in `packages/shared` and `apps/backend`.

**None of it has been run against a real Supabase project.** This environment never had
Docker/the Supabase CLI, so auth, RLS, Realtime, Storage, and the e2e suite are all correct per
design and per a written pgTAP test plan, but not proven live. See `docs/DEPLOYMENT.md` to stand
one up and actually verify it end-to-end.

Known gaps: no online payment for coaching (by design — SPEC §8 keeps it offline for v1), no
one-click permanent-delete for archived data (SPEC §28 requires that as a separate, explicit
action from archiving), testimony submissions don't have a file-attachment option (chat and
content uploads do), and a newly-created admin's temporary password has no self-service "change
password" flow yet (see `docs/ADMIN_GUIDE.md`).

## Getting started

```bash
npm install   # installs all three apps + the shared package (npm workspaces)

# each app needs its own .env.local — see that app's .env.example for what
# each variable is and where to find it
cp apps/backend/.env.example apps/backend/.env.local
cp apps/frontend/.env.example apps/frontend/.env.local
cp apps/admin/.env.example apps/admin/.env.local

npm run dev:backend    # :3002
npm run dev:frontend   # :3000
npm run dev:admin      # :3001
```

## Testing

```bash
npm run build   # type-check + build every workspace
npm run lint    # lint every workspace
npm run test    # Vitest — packages/shared and apps/backend

cd apps/frontend && npm run e2e   # Playwright; boots all three services itself locally
```

RLS policies have a written pgTAP test plan at
[`supabase/tests/database/rls.test.sql`](supabase/tests/database/rls.test.sql) — run via
`supabase test db` once you have the Supabase CLI; it hasn't been executed anywhere yet.
