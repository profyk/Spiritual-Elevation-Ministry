# Deployment Guide

Three separate services now (`docs/ARCHITECTURE.md` explains why): **backend** on Railway,
**frontend** and **admin** as two separate Vercel projects from this same repo. Nothing in this
repo has been deployed or run against a real Supabase project yet — follow this once to get a
working environment, then treat it as the reference for future deploys.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (or run one locally with the
   Supabase CLI + Docker, if you have both).
2. In **Project Settings → API**, note the Project URL and the `anon` public key.
3. In **Project Settings → API**, note the `service_role` key. Treat it like a root password —
   it bypasses Row Level Security entirely. **This key goes in the backend's environment only** —
   never in the frontend or admin apps' Vercel env vars.
4. Enable **Anonymous sign-ins**: Authentication → Providers → Anonymous. Visitor chat depends on
   this (SPEC §15).
5. Enable **TOTP MFA**: Authentication → Providers → make sure MFA/TOTP is available (on by
   default on current Supabase projects) — the admin app's `/admin/mfa/*` pages use the standard
   `supabase.auth.mfa` API directly.

## 2. Apply the schema

```bash
# from the repo root, with the Supabase CLI installed and logged in
supabase link --project-ref <your-project-ref>
supabase db push          # applies every file in supabase/migrations/, in order
```

If you don't have the CLI, paste each migration file's contents into the SQL Editor in the
Supabase dashboard and run them in numeric order (`0001_init.sql` first, then `0002_*.sql`).
`0001_init.sql` creates every table, RLS policy, and the `is_staff_or_above()`/
`is_moderator_or_above()` helper functions everything else depends on; `0002_*.sql` creates the
Storage buckets and two RLS policy fixes for the media system.

## 3. Deploy the backend (Railway)

1. New Railway service from this repo, **root directory `apps/backend`**.
2. Build/start: Railway's Node/Nixpacks builder detects it automatically — start command is
   `npm start` (`tsx src/index.ts`; there's no separate compile step, so no build command is
   needed beyond `npm install`).
3. Set every variable from `apps/backend/.env.example` in Railway's environment settings —
   `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` from step 1;
   `CORS_ORIGINS` you'll fill in once you know the two Vercel URLs (step 4); `RESEND_API_KEY`/
   `EMAIL_FROM` from a [Resend](https://resend.com) account (optional — `sendEmail()` no-ops with
   a warning if unset, nothing breaks); `ADMIN_URL` is the admin app's URL (step 4);
   `CRON_SECRET` is a random string you generate (`openssl rand -hex 32`) — you'll reuse it in
   step 7.
4. Note the backend's Railway URL (e.g. `https://your-backend.up.railway.app`) — both Vercel
   projects need it as `NEXT_PUBLIC_API_URL`.

## 4. Deploy the frontend and admin (Vercel)

Two **separate** Vercel projects from this same GitHub repo:

- **Frontend**: New Project → this repo → root directory `apps/frontend`. Set
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (the backend
  URL from step 3), `NEXT_PUBLIC_SITE_URL` (this project's own URL once you know it),
  `WHATSAPP_FALLBACK_NUMBER` (optional, dev-only).
- **Admin**: New Project → this repo again → root directory `apps/admin`. Set
  `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL` (same
  backend URL). Point it at its own subdomain (e.g. `admin.yourdomain.org`) — Vercel → Project →
  Settings → Domains.

Once both are deployed, go back to Railway and set the backend's `CORS_ORIGINS` to both exact
URLs (comma-separated, no trailing slash), and `ADMIN_URL` to the admin project's URL — then
redeploy the backend so it picks up the new values.

## 5. Create the first Super Admin

`admin_users` has no self-serve signup, and every account after this one gets created from
**Admin → Users & Roles → New admin**. But that screen needs an existing Super Admin to use it —
so the very first account still has to be created by hand, once:

```bash
supabase auth admin create-user --email you@example.org --password '<temporary-strong-password>'
```

(Or: Supabase Dashboard → Authentication → Users → Add user.) Copy the new user's UUID, then run
in the SQL Editor:

```sql
insert into admin_users (id, full_name, role)
values ('<the UUID from above>', 'Your Name', 'super_admin');
```

Log in at the admin app's `/admin/login` with that email/password. You'll be forced into
`/admin/mfa/enroll` immediately — Super Admin requires TOTP (SPEC §22). Scan the QR code with an
authenticator app to finish.

## 6. Seed sample content (optional)

```bash
supabase db execute -f supabase/seed.sql
```

Everything it inserts is prefixed `[SAMPLE]` and fully editable/deletable from the admin area
(SPEC §38) — safe to run, safe to delete later.

## 7. Scheduled jobs

Two things need to run on a schedule (SPEC §23, §28): auto-publishing scheduled content, and
archiving conversations/requests past the retention period. Both are backend routes
(`POST /cron/publish-scheduled`, `POST /cron/retention` — on the Railway backend, not either
Vercel app) protected by `CRON_SECRET`, invoked by `.github/workflows/cron.yml` — that workflow
needs two **GitHub repo secrets** (Settings → Secrets and variables → Actions), not `.env`
values:

- `BACKEND_URL` — the Railway backend's URL from step 3.
- `CRON_SECRET` — the same value you set on the backend in step 3.

Without both secrets set, nothing auto-publishes or auto-archives — content stays in Scheduled
until someone flips it manually, which is safe (nothing breaks), just not automatic.

## 8. Verify

After deploying:

1. Visit the frontend's homepage — should load even before any content is published (it degrades
   gracefully if the backend is briefly unreachable, per `apiFetchSafe`).
2. Visit the admin app's `/admin/login` → sign in as the Super Admin you created → complete MFA.
3. Admin → Settings → set a real WhatsApp number and the two legal pages → confirm they show up
   on the frontend (a fresh page load — there's no shared cache to invalidate across the two
   apps, every request just reads fresh from the backend).
4. Admin → Content → New → upload a cover image, confirm it renders on the public page.
5. From a second (incognito) browser, open the frontend, click the chat button, start a
   conversation, attach a file, and confirm it all shows up in Admin → Communication in real
   time — this is the one thing that absolutely could not be verified without a live project, so
   check it first. This exercises all three services together (frontend + backend + the visitor's
   direct Supabase Realtime subscription).
6. Trigger each cron route once by hand to confirm the secret is wired up correctly:
   `curl -X POST https://your-backend.up.railway.app/cron/publish-scheduled -H "Authorization: Bearer <CRON_SECRET>"`
7. Run `npm run e2e` from `apps/frontend`, against the deployed URLs:
   `PLAYWRIGHT_BASE_URL=<frontend-url> PLAYWRIGHT_ADMIN_BASE_URL=<admin-url> npm run e2e` —
   `tests/e2e/acceptance.spec.ts` and `admin-mfa.spec.ts` cover the SPEC §39 journey and mandatory
   MFA respectively, but need `E2E_SUPABASE_SERVICE_ROLE_KEY` set to provision their own test
   admin accounts; see the comment at the top of each file. Locally, Playwright boots all three
   services itself (`playwright.config.ts`'s `webServer` array) — against deployed URLs you don't
   need that, just the two `PLAYWRIGHT_*_BASE_URL` vars.
