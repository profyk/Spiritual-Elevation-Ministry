# Spiritual Elevation Ministry — Website & Admin Platform

Next.js (App Router) + TypeScript + Supabase (Postgres, Auth, Realtime, Storage). Public website,
admin dashboard, and API all live in this one project.

- [`docs/SPEC.md`](docs/SPEC.md) — the product requirements, source of truth.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, folder structure, data model, security
  design.
- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — set up a Supabase project and deploy.
- [`docs/ADMIN_GUIDE.md`](docs/ADMIN_GUIDE.md) — how ministry staff use `/admin`.
- [`supabase/migrations/`](supabase/migrations) — the database schema (RLS enabled everywhere).

## Status

Every phase of the build is done — foundation, public website, content management, real-time
chat with file attachments, notifications, scheduled publishing/retention jobs, and a Playwright
suite covering the SPEC §39 acceptance journey. Build/lint/unit tests all pass.

**None of it has been run against a real Supabase project.** This environment never had
Docker/the Supabase CLI, so auth, RLS, Realtime, Storage, and the e2e suite are all correct per
design and per a written pgTAP test plan, but not proven live. See `docs/DEPLOYMENT.md` to stand
one up and actually verify it end-to-end — that's genuinely the next step, not further blind
building.

Remaining known gaps: no online payment for coaching (by design — SPEC §8 keeps it offline for
v1), no one-click permanent-delete for archived data (SPEC §28 requires that as a separate,
explicit action from archiving), and testimony submissions don't have a file-attachment option
(chat and content uploads do).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase/Resend values — see docs/DEPLOYMENT.md
npm run dev
```

## Testing

```bash
npm run test     # Vitest unit tests
npm run e2e       # Playwright end-to-end tests (needs the dev server + a real Supabase project)
npm run lint
npm run build     # also type-checks
```

RLS policies have a written pgTAP test plan at
[`supabase/tests/database/rls.test.sql`](supabase/tests/database/rls.test.sql) — run via
`supabase test db` once you have the Supabase CLI; it hasn't been executed anywhere yet.
