# Architecture — Spiritual Elevation Ministry Platform

Status: **DRAFT — pending approval.** Built against `docs/SPEC.md` v0.1. Do not build features
against this until it's approved (per the build process).

## 1. Stack

- **Framework**: Next.js (App Router) + TypeScript. One project holds the public website, the
  admin dashboard, and the API (route handlers) — matches SPEC §1's three-part split without a
  monorepo, since none of these need independent deployment.
- **Database / Auth / Realtime / Storage**: Supabase (Postgres, Auth incl. Anonymous sign-in and
  TOTP MFA, Realtime, Storage with private buckets).
- **Styling**: Tailwind CSS + a small internal component library (`src/components/ui`), Lucide
  icons.
- **Validation**: Zod schemas colocated with each API route, shared with client forms where
  practical (`src/lib/validation`).
- **Email**: Resend, invoked from server-only code (`src/lib/email`), configured via
  `RESEND_API_KEY` and `EMAIL_FROM`.
- **Testing**: Vitest (unit — validation, permission logic, WhatsApp link builder, etc.) and
  Playwright (e2e — the acceptance journey in SPEC §39).
- **WhatsApp**: `buildWhatsAppLink(context)` in `src/lib/whatsapp.ts`, sole place a `wa.me` URL is
  constructed (SPEC §18).

## 2. Why this stack

- Next.js App Router gives server components + route handlers in one project, so RLS-backed
  Supabase queries can run server-side by default and only the chat/realtime surfaces need a
  client-side Supabase client — smaller attack surface than an SPA hitting a separate API.
- Supabase Realtime + Postgres RLS is what makes SPEC §15's "visitor can read only their own
  conversation" enforceable at the database layer, not just in application code — required, not
  optional, per SPEC §27.
- No separate backend service: the ministry's traffic profile (a few staff, moderate public
  traffic) doesn't need one, and one deployable is simpler to operate for a small team.

## 3. Folder Structure

```
spiritual-elevation-ministry/
  src/
    app/
      (public)/                  # public website route group
        page.tsx                 # Home
        about/
        services/
          prophetic-ministry/
          healing-deliverance/
          coaching/
          events/
        sermons/
        testimonies/
        privacy-policy/
        terms-of-use/
        contact/
      (admin)/
        admin/
          layout.tsx              # auth + role gate
          page.tsx                 # Dashboard
          content/
          requests/
          communication/
          testimonies/
          settings/
          users/
          audit-log/
      api/
        requests/                 # ministry_requests CRUD (public POST, admin GET/PATCH)
        conversations/
        messages/
        testimonies/
        media/
        webhooks/                 # future: WhatsApp Business API, email provider events
      layout.tsx
    components/
      ui/                        # buttons, form fields, disclaimers banner, etc.
      chat/                      # visitor chat widget
      admin/                     # communication center, content editor, etc.
    lib/
      supabase/
        server.ts                # server-side client (service role only where RLS insufficient)
        client.ts                # browser client (anon key, RLS-enforced)
      validation/                # Zod schemas per entity
      permissions.ts             # role → permission checks, mirrors RLS policies
      whatsapp.ts
      email/
      rate-limit.ts
      audit.ts                   # helper to write audit_log entries consistently
    types/
      database.ts                # generated from Supabase schema
  supabase/
    migrations/                  # numbered SQL migrations, source of truth for schema
    seed.sql                     # [SAMPLE]-prefixed seed content, SPEC §38
  tests/
    unit/
    e2e/
  docs/
    SPEC.md
    ARCHITECTURE.md
    DEPLOYMENT.md                # written in Phase 7
    ADMIN_GUIDE.md                # written in Phase 7
  .env.example
```

## 4. Data Model Overview

Full DDL is in `supabase/migrations/`. Summary by group (see SPEC §24):

- **Identity/RBAC**: `admin_users` (1:1 with `auth.users`, holds `role`), roles are a Postgres
  enum (`super_admin`, `admin`, `staff`, `moderator`) rather than a separate table — fixed, small
  set per SPEC §21, no need for a join table yet.
- **Content**: `content_items` (discriminated by `content_type`: `prophetic_message`, `sermon`,
  `article` — they share every field except sermons' media reference, so one table with a
  nullable `media_id` beats three near-identical tables), `events`, `event_rsvps`,
  `coaching_programs`, `enrollments`, `media`.
- **Engagement**: `testimonies`, `ministry_requests`, `conversations`, `messages`,
  `conversation_notes`.
- **Ops**: `website_settings` (key/value), `legal_pages`, `audit_log`, `notifications`,
  `notification_preferences`.

Relationships (high level):

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
  the application layer (Supabase MFA `aal2` check on admin routes) per SPEC §22.
- **Visitors**: Supabase Anonymous Auth. Anonymous sign-in happens on first chat/request
  interaction, not on page load, to avoid creating unnecessary sessions. The resulting `auth.uid()`
  is the sole authorization key for `conversations`/`messages` RLS (SPEC §15) — contact info
  (name/email/phone) on a request is just data, never used for access control.
- **RLS pattern** (illustrative, finalized in the actual migration):

```sql
create policy "visitor reads own conversation"
  on conversations for select
  using (visitor_auth_id = auth.uid());

create policy "visitor reads own messages"
  on messages for select
  using (
    conversation_id in (
      select id from conversations where visitor_auth_id = auth.uid()
    )
  );

create policy "staff reads assigned or unassigned conversations"
  on conversations for select
  using (
    exists (select 1 from admin_users where id = auth.uid())
  );

-- conversation_notes has NO visitor policy at all — default-deny covers them.
create policy "staff reads notes"
  on conversation_notes for select
  using (exists (select 1 from admin_users where id = auth.uid()));
```

- App-layer `src/lib/permissions.ts` mirrors these rules for checks RLS can't express (e.g. "only
  the currently assigned staff member, or a Super Admin, can transfer a conversation").

## 6. Real-Time Chat Design

- Visitor and staff both subscribe to a Supabase Realtime channel scoped to one
  `conversation_id`. The channel itself carries no data — RLS governs the underlying `messages`/
  `conversations` reads, so even if a visitor guessed another conversation's UUID (astronomically
  unlikely, SPEC §15), the Realtime subscription would return nothing.
- Message send path: client → `POST /api/messages` (validated, rate-limited) → insert → Realtime
  fans out the insert to subscribers. No client ever writes directly to the table — the anon key's
  RLS insert policy still applies as a second check on top of API-level rate limiting.
- `channel` field on `conversations` (SPEC §16) defaults to `webchat`; `whatsapp` is reserved,
  unused until a future Business API integration.

## 7. Storage & Media

**Built** (Phase "create everything"): two private Storage buckets, `media` (admin content
assets — cover images, sermon audio/video) and `attachments` (chat uploads), created by
`supabase/migrations/0002_storage_and_media_policies.sql`. Storage RLS on both is deliberately
deny-all — every read and write goes through an API route instead of a client-facing storage
policy:

- `POST /api/media` — validates the upload (MIME type + size client-side for fast feedback,
  then re-derived from the actual file bytes server-side via `src/lib/media/validation.ts`'s
  magic-byte sniffer, not just trusted from the client — SPEC §11, §27), resolves the caller's
  identity/permission (admin session for content assets, visitor anonymous session scoped to a
  specific conversation for chat attachments), then uploads via the service-role client and
  inserts the `media` row.
- `GET /api/media/[id]/signed-url` — the actual permission check is just the RLS-enforced
  `select` on `media` succeeding (staff see everything; a visitor sees their own uploads, media
  attached to their own conversation's messages regardless of who uploaded it, and anything
  attached to published content/an approved testimony); a hit mints a 10-minute signed URL via
  the service-role client, a miss 404s. `src/lib/media/get-signed-url.server.ts` is the same
  logic for use directly in a server component instead of round-tripping through the route.

## 8. Deployment Plan

- **Hosting**: `[PLACEHOLDER — confirm with ministry, SPEC §41]`. Vercel is the default fit for a
  Next.js App Router project with this feature set (edge-friendly, native preview deployments);
  Railway (already used on another of your projects) is a reasonable alternative if you'd rather
  keep hosting consolidated — flag if you want that instead.
- **Database**: Supabase-hosted Postgres (same project provides Auth/Realtime/Storage).
- **Environments**: `production` and `preview` (per-PR or per-branch preview deployments against a
  separate Supabase project or schema, so preview traffic never touches production visitor data).
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) — on every push/PR: build (typecheck + lint,
  since `next build` runs both), Vitest unit tests, `npm audit`, and a gitleaks secret scan
  (SPEC §27 item 12). Playwright e2e isn't wired into CI yet — it needs a deployed preview or a
  way to boot the app with a real Supabase project in the runner, neither of which exists yet.
- **Migrations**: applied via `supabase db push` (or the CLI's migration apply) in CI before the
  app deployment that depends on them goes live — never applied manually against production.
- **Secrets**: all in the hosting provider's environment variable store, documented in
  `.env.example`; never committed.

## 9. Open Questions Carried From SPEC §41

Hosting preference, domain, CI provider, and legal review are still outstanding — see SPEC §41 for
the full list. None of them block writing the schema or starting Phase 1 foundation work.
