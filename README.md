# Spiritual Elevation Ministry — Website & Admin Platform

Next.js (App Router) + TypeScript + Supabase. See:

- [`docs/SPEC.md`](docs/SPEC.md) — the product requirements, source of truth.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — stack, folder structure, data model, security
  design.
- [`supabase/migrations/`](supabase/migrations) — the database schema.

A full setup/deployment README lands in the project's hardening/docs phase; this is the
foundation-phase placeholder.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase/Resend values
npm run dev
```

## Testing

```bash
npm run test     # Vitest unit tests
npm run e2e       # Playwright end-to-end tests
```
