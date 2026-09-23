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

Phases 0–5 of the build (foundation, public website, content management, real-time chat,
notifications) are built and pass build/lint/unit tests. **None of it has been run against a real
Supabase project** — see `docs/DEPLOYMENT.md` to stand one up and actually verify auth, RLS, and
Realtime end-to-end. Known gaps: no file/media upload UI, no scheduled-publish or
retention-archive job, no online payment, no Playwright coverage of the full acceptance journey
yet.

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
