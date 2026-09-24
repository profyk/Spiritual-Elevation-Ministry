# Deployment Guide

Status: written against the foundation built so far (Phases 0–5). Nothing in this repo has been
deployed or run against a real Supabase project yet — follow this once to get a working
environment, then treat it as the reference for future deploys.

## 1. Create the Supabase project

1. Create a project at [supabase.com](https://supabase.com) (or run one locally with the
   Supabase CLI + Docker, if you have both — this environment had neither).
2. In **Project Settings → API**, note the Project URL and the `anon` public key.
3. In **Project Settings → API**, note the `service_role` key. Treat it like a root password —
   it bypasses Row Level Security entirely (see `src/lib/supabase/server.ts`).
4. Enable **Anonymous sign-ins**: Authentication → Providers → Anonymous. Visitor chat depends on
   this (SPEC §15).
5. Enable **TOTP MFA**: Authentication → Providers → make sure MFA/TOTP is available (it's on by
   default on current Supabase projects). No extra setup needed — `src/app/(admin)/admin/mfa/*`
   uses the standard `supabase.auth.mfa` API.

## 2. Apply the schema

```bash
# from the repo root, with the Supabase CLI installed and logged in
supabase link --project-ref <your-project-ref>
supabase db push          # applies supabase/migrations/0001_init.sql
```

If you don't have the CLI, you can instead paste the contents of
`supabase/migrations/0001_init.sql` into the SQL Editor in the Supabase dashboard and run it once.
Either way, **run `0001_init.sql` before anything else** — it creates every table, RLS policy, and
the `is_staff_or_above()`/`is_moderator_or_above()` helper functions the rest of the app depends
on.

## 3. Create the first Super Admin

`admin_users` has no self-serve signup — the first account has to be created by hand:

```bash
supabase auth admin create-user --email you@example.org --password '<temporary-strong-password>'
```

(Or: Supabase Dashboard → Authentication → Users → Add user.) Copy the new user's UUID, then run
in the SQL Editor:

```sql
insert into admin_users (id, full_name, role)
values ('<the UUID from above>', 'Your Name', 'super_admin');
```

Log in at `/admin/login` with that email/password. You'll be forced into `/admin/mfa/enroll`
immediately — Super Admin requires TOTP (SPEC §22). Scan the QR code with an authenticator app to
finish.

## 4. Seed sample content (optional)

```bash
supabase db execute -f supabase/seed.sql
```

Everything it inserts is prefixed `[SAMPLE]` and fully editable/deletable from the admin area
(SPEC §38) — safe to run, safe to delete later.

## 5. Environment variables

Copy `.env.example` to `.env.local` (development) or your hosting provider's environment
variable store (production) and fill in every value — see the comments in that file for what
each one is and where to find it. In particular:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` — from
  step 1.
- `RESEND_API_KEY`, `EMAIL_FROM` — from a [Resend](https://resend.com) account with a verified
  sending domain. Without these, `sendEmail()` no-ops (logs a warning) instead of failing —
  the app still works, it just won't send email.
- `NEXT_PUBLIC_SITE_URL` — your real domain in production; affects email links and metadata.
- `WHATSAPP_FALLBACK_NUMBER` — leave blank in production; set the real number at
  Admin → Settings → Communication instead (SPEC §18).

## 6. Hosting

No hosting decision has been made yet (SPEC §41 placeholder). This is a standard Next.js App
Router project — Vercel needs zero extra configuration; Railway (used elsewhere in your projects)
works too via its Node/Nixpacks builder. Either way:

```bash
npm run build
npm run start
```

is the production command. Point the platform's build command at `npm run build` and set every
variable from step 5 before the first deploy.

## 7. Scheduled jobs

Two things need to run on a schedule (SPEC §23, §28): auto-publishing scheduled content, and
archiving conversations/requests past the retention period. Both are plain API routes
(`/api/cron/publish-scheduled`, `/api/cron/retention`) protected by `CRON_SECRET`, invoked by
`.github/workflows/cron.yml` — that workflow needs two **GitHub repo secrets** (Settings →
Secrets and variables → Actions), not `.env` values:

- `SITE_URL` — your deployed site's URL (e.g. `https://your-domain.org`).
- `CRON_SECRET` — the same value you set for `CRON_SECRET` in your hosting provider's environment
  variables.

Without both secrets set, nothing auto-publishes or auto-archives — content stays in Scheduled
until someone flips it manually, which is safe (nothing breaks), just not automatic.

## 8. Storage buckets

`supabase/migrations/0002_storage_and_media_policies.sql` creates the `media` and `attachments`
Storage buckets and their RLS gap fixes — make sure it's applied (step 2 applies every migration
in order, so this happens automatically via `supabase db push`).

## 9. Verify

After deploying:

1. Visit the homepage — should load even before any content is published.
2. `/admin/login` → sign in as the Super Admin you created → complete MFA.
3. Admin → Settings → set a real WhatsApp number and the two legal pages.
4. Admin → Content → New → upload a cover image, confirm it renders on the public page.
5. From a second (incognito) browser, open the site, click the chat button, start a
   conversation, attach a file, and confirm it all shows up in Admin → Communication in real
   time — this is the one thing that absolutely could not be verified without a live project, so
   check it first.
6. Trigger each cron route once by hand to confirm the secret is wired up correctly:
   `curl -X POST https://your-domain.org/api/cron/publish-scheduled -H "Authorization: Bearer <CRON_SECRET>"`
7. Run `npm run e2e` locally against the deployed URL
   (`PLAYWRIGHT_BASE_URL=<url> npm run e2e`) — `tests/e2e/acceptance.spec.ts` covers the SPEC §39
   journey but needs `E2E_SUPABASE_SERVICE_ROLE_KEY` set to provision its own test admin; see the
   comment at the top of that file.
