# Architecture — Spiritual Elevation Ministry Platform

Built against `docs/SPEC.md`. **Revised from a single-app design to a real three-service split**
(backend on Railway, frontend and admin as separate Vercel projects) at the user's explicit
request — the original single-Next.js-app version (still visible in earlier git history) matched
SPEC §1's default; this is the deployment topology actually being built and deployed now.

## 1. Stack

- **Backend** (`apps/backend`) — Node.js + TypeScript + Express, deployed to Railway. Owns every
  read and write of application data. Runs via `tsx` directly (no separate compile/bundle step —
  `npm start` runs `tsx src/index.ts` in production too).
- **Frontend** (`apps/frontend`) — Next.js (App Router) + TypeScript, the public website only,
  deployed to Vercel. Talks to the backend over HTTP for all application data.
- **Admin** (`apps/admin`) — Next.js (App Router) + TypeScript, the admin dashboard only, deployed
  to Vercel as a **separate project** from the frontend (its own domain/subdomain). Same
  backend-over-HTTP pattern.
- **Shared** (`packages/shared`) — an npm workspace package, not published anywhere: Zod
  validation schemas, the `AdminRole`/`AdminProfile` types and permission-check functions,
  `buildWhatsAppLink`, the media MIME-sniffing validator, and email template builders. Both the
  backend and the two frontends import it as TypeScript source directly (`transpilePackages` in
  each Next.js config; the backend's `tsx` runtime needs no special config for it).
- **Database / Auth / Realtime / Storage**: Supabase (Postgres, Auth incl. Anonymous sign-in and
  TOTP MFA, Realtime, Storage with private buckets) — one project, shared by all three services.
- **Styling**: Tailwind CSS + a small component library (`components/ui`) in each Next.js app,
  Lucide icons.
- **Email**: Resend, backend-only (`apps/backend/src/lib/email-resend.ts`), configured via
  `RESEND_API_KEY`/`EMAIL_FROM`. Neither frontend nor admin ever holds this key.
- **Testing**: Vitest (`packages/shared/tests` for validation/permissions/WhatsApp;
  `apps/backend/tests` for rate-limiting/cron-auth) and Playwright (`apps/frontend/tests/e2e` —
  the SPEC §39 acceptance journey, which now spans both Next.js apps and boots all three services
  via Playwright's `webServer` array).
- **WhatsApp**: `buildWhatsAppLink(context)` in `packages/shared/src/whatsapp.ts`, the sole place
  a `wa.me` URL is ever constructed (SPEC §18).

## 2. The backend/frontend HTTP boundary

This is the one design decision everything else follows from, so it's worth stating precisely:

- **Supabase Auth stays direct-to-browser** in both Next.js apps — sign-in, anonymous visitor
  sessions, TOTP MFA enrollment/challenge, sign-out. There's no reason to proxy an OAuth-style
  auth flow through a second service, and Supabase's own SDK already handles token refresh
  correctly from the browser (`src/proxy.ts` in each app keeps the httpOnly cookie session fresh
  server-side too).
- **Supabase Realtime *subscriptions* stay direct-to-browser** — the chat thread and the admin
  notification bell subscribe straight to Supabase's Realtime channels, which is how Supabase
  apps normally work and is still fully RLS-gated (a subscription can't return rows the
  subscriber's RLS policies wouldn't allow a plain `select` to return either).
- **Every application data read and write goes through the backend.** No Server Component or
  Server Action in either Next.js app queries Supabase's Postgres tables directly (only
  `admin_users` role/MFA lookups in the admin app's own session-resolution code are the
  exception — see §5). A page needing data calls the backend's REST API (`apps/frontend/src/lib/
  api-client.ts`, `apps/admin/src/lib/api-client.ts`) instead.
- **Auth on backend calls**: the caller's own Supabase access token, sent as
  `Authorization: Bearer <token>`. The backend verifies it and builds a *request-scoped* Supabase
  client from that same token (`apps/backend/src/lib/supabase.ts`'s `createUserScopedClient`) —
  so RLS evaluates `auth.uid()` exactly as it would for a direct browser request. This is the
  reason the entire RLS policy set from the single-app design carries over unchanged: the backend
  is a pass-through for identity, not a new privilege boundary. `apps/backend/src/middleware/
  auth.ts`'s `requireAdmin(minRole)` adds the SPEC §27 second layer on top — an explicit
  server-side role check independent of what the admin app's UI happens to render.
- **No cross-origin cookies.** Because auth is Bearer-token-based on API calls (not
  cookie-based), the backend's CORS config just needs an allowlist of the two frontend origins
  (`CORS_ORIGINS` env var) — no `credentials: true` complexity.
- **Service-role key lives only in the backend.** Neither Next.js app's environment ever contains
  `SUPABASE_SERVICE_ROLE_KEY`. The backend reaches for it only where RLS genuinely can't apply:
  Storage operations (storage.objects RLS is deny-all by design — see §7), creating a new admin's
  Supabase Auth user (identity creation isn't a table RLS governs), and the two `/cron/*` jobs
  (no human caller to scope a token to).

## 3. Folder Structure

```
Spiritual-Elevation-Ministry/
  apps/
    backend/
      src/
        index.ts                 # Express app: CORS, JSON body parsing, route mounting
        lib/
          supabase.ts             # createUserScopedClient / createAnonClient / createServiceRoleClient
          audit.ts                # append-only audit_log writer
          notifications.ts        # fans a notification out to every admin (in-app + email)
          email-resend.ts
          rate-limit.ts
          cron-auth.ts
          media-storage.ts        # signed URL minting
        middleware/
          auth.ts                 # attachIdentity, requireVisitor, requireAdmin(minRole)
        routes/
          public.ts                # GET content/events/coaching-programs/testimonies/legal-pages/settings
          submissions.ts           # POST requests/rsvps/testimonies (public, rate-limited)
          chat.ts                  # POST conversations/messages, GET conversation messages
          media.ts                 # POST media (upload), GET media/:id/signed-url
          admin-content.ts         # admin content/events/coaching CRUD
          admin-ops.ts             # admin testimonies/requests/communication/dashboard/me
          admin-settings.ts        # admin settings/legal-pages/users/audit-log/notifications
          cron.ts                  # POST cron/publish-scheduled, cron/retention
      tests/                       # Vitest — rate-limit, cron-auth
    frontend/                      # Next.js App Router — public site only
      src/
        app/
          (public)/                # every public route (home, about, services/*, sermons, ...)
          layout.tsx, sitemap.ts, robots.ts
        components/
          ui/, chat/, forms/, layout/
        lib/
          api-client.ts            # apiFetch / apiFetchSafe — talks to the backend
          settings.ts, legal-pages.ts
          chat/session.ts          # visitor anonymous session (Supabase direct)
          supabase/client.ts       # browser client — auth/Realtime only
        proxy.ts                   # session cookie refresh
      tests/e2e/                   # acceptance.spec.ts, admin-mfa.spec.ts, smoke.spec.ts
    admin/                         # Next.js App Router — admin dashboard only
      src/
        app/
          (admin)/admin/
            login/, mfa/            # Supabase Auth direct
            (protected)/            # gated by lib/auth/get-admin.ts
              content/, events/, coaching/, testimonies/, requests/,
              communication/, settings/, users/, audit-log/, notifications/
        components/admin/, components/chat/
        lib/
          api-client.ts            # adminApiFetch / adminApiFetchServer — attaches the admin's token
          auth/get-admin.ts        # session + role + MFA status (Supabase direct — see §5)
          supabase/client.ts, supabase/server.ts
        proxy.ts
  packages/
    shared/
      src/
        validation/                # Zod schemas — same ones the backend validates against
        permissions.ts             # AdminRole, AdminProfile, isStaffOrAbove() etc.
        whatsapp.ts
        media/                     # MIME kind detection + validation (magic-byte sniffing)
        email/templates.ts
      tests/                       # Vitest — permissions, whatsapp, ministry-request schema
  supabase/
    migrations/                    # numbered SQL migrations, source of truth for schema
    seed.sql                       # [SAMPLE]-prefixed seed content, SPEC §38
    tests/database/                # pgTAP RLS test plan
  docs/
    SPEC.md, ARCHITECTURE.md, DEPLOYMENT.md, ADMIN_GUIDE.md
  .github/workflows/
    ci.yml, cron.yml
```

## 4. Data Model Overview

Unchanged by the backend/frontend split — full DDL is in `supabase/migrations/`. Summary by group
(see SPEC §24):

- **Identity/RBAC**: `admin_users` (1:1 with `auth.users`, holds `role`), roles are a Postgres
  enum (`super_admin`, `admin`, `staff`, `moderator`).
- **Content**: `content_items` (discriminated by `content_type`), `events`, `event_rsvps`,
  `coaching_programs`, `enrollments`, `media`.
- **Engagement**: `testimonies`, `ministry_requests`, `conversations`, `messages`,
  `conversation_notes`.
- **Ops**: `website_settings`, `legal_pages`, `audit_log`, `notifications`,
  `notification_preferences`.

```
admin_users ──< assigned_to ──< ministry_requests
admin_users ──< assigned_to ──< conversations ──< messages
                                 conversations ──< conversation_notes
                                 conversations ──1─ ministry_requests (optional link)
content_items ──> media (optional)
events ──< event_rsvps
coaching_programs ──< enrollments
testimonies ──> media (optional)
```

## 5. Auth & RBAC

- **Admin/staff**: Supabase Auth (email+password), TOTP MFA enforced for `super_admin`/`admin` at
  the application layer (Supabase MFA `aal2` check) — enforced in the **admin app's** `(protected)`
  layout, via `apps/admin/src/lib/auth/get-admin.ts`, per SPEC §22.
- **Admin account creation**: only from **Admin → Users & Roles → New admin**, Super Admin only
  (`POST /admin/users`). Creates the Supabase Auth user via the backend's service-role client
  (identity creation isn't something RLS governs) and shows a one-time generated temporary
  password. The very first Super Admin still has to be created by hand once (`docs/DEPLOYMENT.md`
  §3) — the panel needs an existing Super Admin to use it.
- **Why `get-admin.ts` queries `admin_users` directly instead of calling the backend**: this is
  the one deliberate exception to "all data through the backend" (§2). It's session/identity
  resolution — colocated with the rest of the Supabase Auth flow, gated by the same `admin reads
  own profile` RLS policy the backend's own `requireAdmin` middleware uses, and needed
  synchronously during the `(protected)` layout's server-side render to avoid a flash of gated
  content. Every *mutation*, and every read of another admin's data, still goes through the
  backend.
- **Visitors**: Supabase Anonymous Auth, browser-side only, in the frontend app
  (`src/lib/chat/session.ts`). Anonymous sign-in happens on first chat interaction, not page load.
  The resulting `auth.uid()` — sent to the backend as the visitor's Bearer token — is the sole
  authorization key for `conversations`/`messages` RLS (SPEC §15); contact info on a request is
  just data, never used for access control.
- **RLS pattern** (illustrative — finalized in `supabase/migrations/0001_init.sql`):

```sql
create policy "visitor reads own conversation"
  on conversations for select
  using (visitor_auth_id = auth.uid());

-- conversation_notes has NO visitor policy at all — default-deny covers them,
-- structurally, regardless of what the backend or either frontend renders.
create policy "staff reads notes"
  on conversation_notes for select
  using (exists (select 1 from admin_users where id = auth.uid()));
```

- `packages/shared/src/permissions.ts` mirrors these rules for checks RLS can't express (e.g.
  "only the currently assigned staff member, or admin+, can transfer a conversation") — imported
  by the backend for its server-side checks, and by the admin app for gating what its own UI
  renders (a second, cosmetic layer on top of the backend's real enforcement).

## 6. Real-Time Chat Design

- Visitor and staff both subscribe to a Supabase Realtime channel scoped to one
  `conversation_id`, directly from the browser (§2). RLS governs the underlying `messages`/
  `conversations` reads, so even a guessed conversation UUID returns nothing via the subscription.
- Message send path: client → backend `POST /messages` (Bearer-authed, rate-limited, shared
  between the visitor and staff flows — the route itself determines which one the caller is) →
  insert via the caller's own token-scoped client → Realtime fans the insert out to subscribers.
- `channel` field on `conversations` (SPEC §16) defaults to `webchat`; `whatsapp` is reserved,
  unused until a future Business API integration.

## 7. Storage & Media

Two private Storage buckets, `media` (admin content assets) and `attachments` (chat uploads),
created by `supabase/migrations/0002_storage_and_media_policies.sql`. Storage RLS on both is
deliberately deny-all — every read and write goes through the backend instead of a client-facing
storage policy:

- `POST /media` (backend) — validates the upload (MIME type + size client-side for fast feedback,
  then re-derived from the actual file bytes server-side via `packages/shared/src/media/
  validation.ts`'s magic-byte sniffer — SPEC §11, §27), resolves the caller's identity/permission,
  uploads via the service-role client, inserts the `media` row via the caller's own token where
  possible.
- `GET /media/:id/signed-url` (backend) — the permission check is just the RLS-enforced `select`
  on `media` succeeding; a hit mints a 10-minute signed URL via the service-role client, a miss
  404s. `apps/backend/src/lib/media-storage.ts` also exposes this for other backend routes (e.g.
  resolving a published sermon's cover image URL inline in the `GET /content/:slug` response) so
  the frontend doesn't need a second round trip per media reference.

## 8. Deployment Plan

- **Backend** → Railway, one service, root directory `apps/backend`, start command `npm start`
  (`tsx src/index.ts` — no build/compile step in production).
- **Frontend** → Vercel, one project, root directory `apps/frontend`.
- **Admin** → Vercel, a **second, separate** project, root directory `apps/admin`, its own
  domain/subdomain (e.g. `admin.yourdomain.org`).
- **Database**: Supabase-hosted Postgres (same project provides Auth/Realtime/Storage for all
  three services).
- **CORS**: the backend's `CORS_ORIGINS` env var must list both Vercel URLs exactly (SPEC §41
  domain placeholder still open — using `*.vercel.app` preview URLs for now, real domains once
  chosen).
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) — `npm run build` across every workspace
  (type-checks + lints the two Next.js apps via `next build`; type-checks the backend/shared via
  `tsc --noEmit`), an explicit backend lint pass, Vitest across `packages/shared` and
  `apps/backend`, `npm audit`, and a gitleaks secret scan (SPEC §27 item 12). Playwright e2e isn't
  wired into CI yet — needs all three services deployed/reachable from the runner.
- **Scheduled jobs**: `.github/workflows/cron.yml` calls the backend's `/cron/*` routes directly
  (not through either frontend) — needs `BACKEND_URL` and `CRON_SECRET` as GitHub repo secrets.
- **Migrations**: applied via `supabase db push` against the shared Supabase project — never
  applied manually against production, and not tied to any one service's deploy (all three read
  the same schema).
- **Secrets**: each service's own hosting provider environment variable store, documented in that
  app's `.env.example` (`apps/backend/.env.example`, `apps/frontend/.env.example`,
  `apps/admin/.env.example`) — never committed, and never shared wholesale between services (the
  frontend and admin apps in particular must never receive `SUPABASE_SERVICE_ROLE_KEY`).

## 9. Open Questions Carried From SPEC §41

Domain names (for both the public site and the admin subdomain), branding assets (logo now in
`apps/frontend/public/brand/` and `apps/admin/public/brand/`, not yet wired into any component),
and legal review are still outstanding — see SPEC §41 for the full list. Hosting is now decided
(§8); it's no longer an open question.
