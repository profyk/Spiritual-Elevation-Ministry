# Spiritual Elevation Ministry — Website & Admin Platform Specification

Status: **DRAFT — v0.1, not yet approved.** This is the source of truth for the build. Sections
marked `[PLACEHOLDER]` need real ministry input before launch; everything else is ready to build
against. See §41 for the full placeholder list.

---

## 1. Vision & Purpose

Spiritual Elevation Ministry needs a public website that presents its ministry services
(prophetic ministry, healing & deliverance, coaching, events), publishes teaching content, lets
visitors reach the ministry directly (chat, WhatsApp, service-specific request forms), and gives
ministry staff an admin system to manage all of it — content, requests, conversations, and
settings — without needing a developer for day-to-day operation.

The platform has three logical parts, built as one project:

- **Website** — public-facing, anonymous visitors, SEO-indexed.
- **Admin dashboard** — authenticated staff only, role-gated.
- **Backend/API** — shared by both, enforces all authorization server-side regardless of what the
  frontend shows or hides.

## 2. Ministry Overview `[PLACEHOLDER]`

| Field | Value |
|---|---|
| Ministry name | Spiritual Elevation Ministry |
| Leader / senior minister name | `[PLACEHOLDER]` |
| Leader photo | `[PLACEHOLDER]` |
| Additional ministers/speakers | `[PLACEHOLDER]` |
| Logo | `[PLACEHOLDER]` |
| Brand colours | `[PLACEHOLDER]` — use a neutral placeholder palette until supplied |
| WhatsApp number | `[PLACEHOLDER]` |
| Domain name | `[PLACEHOLDER]` |
| Hosting preference | `[PLACEHOLDER]` |

Until these are supplied, seed content uses clearly-labelled sample values (e.g. "Sample Minister
Name", a placeholder logo mark, a neutral colour palette) that are fully editable/deletable from
the admin area. No placeholder value may be mistaken for real ministry information — sample text
is prefixed `[SAMPLE]` in seed data.

## 3. Audiences

- **Visitors** — public, anonymous, may be in crisis (grief, illness, seeking guidance). Design
  and copy must be warm, non-alarming, and never pressure a decision.
- **Members/returning visitors** — no account system in v1; chat and requests work anonymously
  per-session (see §15).
- **Admin/staff** — ministry team managing content, requests, and conversations.
- **Super Admin** — one or more owners with irreversible-action authority (see §21).

## 4. Information Architecture — Public Website

- Home
- About (the ministry, the leader, statement of faith `[PLACEHOLDER content]`)
- Services
  - Prophetic Ministry (§6)
  - Healing & Deliverance (§7)
  - Life & Spiritual Coaching (§8)
  - Events & Conferences (§9)
- Sermons & Teachings (§10)
- Testimonies (§12)
- Give / Support the Ministry — informational only in v1 (no online donation processing; see §8
  for why online payment is deferred)
- Contact / Talk to the Ministry (§14)
- Privacy Policy (§26)
- Terms of Use
- 404 / error pages

All pages are responsive, accessible (§33), and carry SEO metadata (§32).

## 5. Public Website — Page Notes

- Every service page ends with two calls to action: **Talk to the Ministry** (opens chat, §14)
  and the WhatsApp click-to-chat link (§18), both pre-filled with context for that service.
- Icons: use Lucide (or equivalent) icon set. No emoji anywhere in the UI. Prophetic Ministry
  explicitly does **not** use a crystal ball icon — use something like a dove, flame, or open-book
  glyph instead.

## 6. Service: Prophetic Ministry

Visitors can request prophetic ministry (a word, prayer for guidance) via a request form or chat.

**Required disclaimer (see §37 for editability rules):**
> Prophetic words offered by this ministry are for encouragement and spiritual guidance. They are
> not a guaranteed prediction of future events and should not be used as the sole basis for major
> life, medical, financial, or legal decisions.

## 7. Service: Healing & Deliverance

Visitors can submit a healing/deliverance prayer request.

**Required disclaimer:**
> Prayer for healing is offered alongside — never as a replacement for — qualified medical care.
> If you are experiencing a medical emergency, contact your local emergency services immediately.

If a request mentions a missing person, the confirmation screen and any admin auto-response must
surface:
> If this concerns a missing loved one, please also contact your local police and a registered
> missing-persons organization. This ministry offers prayer support but is not a search-and-rescue
> or investigative service.

This applies regardless of which form the visitor used — detect via a "this concerns a missing
person" checkbox on the request form (not keyword-sniffing free text), and always show it as an
option on Healing & Deliverance and on chat intake.

## 8. Service: Life & Spiritual Coaching

- Coaching programs are content entities: name, description, duration/format, price `[PLACEHOLDER
  pricing]`, capacity (optional), status (draft/published/archived).
- **v1 payment model: offline.** A visitor requests enrollment through the site; admin follows up
  via WhatsApp/email/phone to arrange payment (bank transfer, in-person, etc.) and manually marks
  the enrollment's payment status (`unpaid` / `partially_paid` / `paid` / `waived`) in admin. No
  payment gateway integration in v1.
- Design the `enrollments` table with a `payment_status` and `payment_notes` field now, and leave
  room for a future `payment_provider_reference` column, so online payment can be added later
  without a schema rewrite — but do not build a payment gateway in this phase.

## 9. Service: Events & Conferences

- Events: title, description, start/end datetime, timezone, location (physical address or
  "online" with a link), cover image, status (draft/published/cancelled/past — computed from
  date), optional RSVP/registration (capacity, waitlist optional — keep v1 simple: name, email/
  phone, number of attendees).
- Past events remain visible (read-only, no RSVP) unless archived by admin.

## 10. Sermons, Teachings & Articles

- Content types: **Prophetic message** (published word, distinct from a private request), **sermon**
  (audio/video + optional transcript), **article** (written teaching).
- Common fields: title, slug, summary, body (rich text), author, category/tags, cover image,
  status (draft/scheduled/published/unpublished/archived), `published_at`, `scheduled_for`.
- Sermons additionally carry a media reference (§11) — audio and/or video, plus optional
  downloadable notes.
- Admin can filter/search by status, type, category, date.

## 11. Media Library

- Central media table (images, audio, video, documents) referenced by content, events, and
  testimonies rather than duplicated per-entity.
- Stored in Supabase Storage in **private buckets**; served via signed URLs with short expiry —
  no public bucket URLs anywhere (this applies to all media, not just chat attachments — see §17).
- Upload validation: allow-listed MIME types per media kind, max file size per kind (e.g. images
  ≤10MB, audio ≤100MB, video ≤500MB — confirm limits fit the chosen Supabase plan before launch),
  and server-side re-validation of the actual file content type, not just the extension/client-
  reported MIME type.

## 12. Testimonies

- Visitors submit a testimony (name or "Anonymous", text, optional photo/media) via a public form.
- Default state: `pending`. Never shown publicly until an admin moderates it to `approved`.
- Admin actions: approve, reject (with optional internal reason, not shown to submitter), archive.
- Approved testimonies display on the public Testimonies page; admin can feature/unfeature and
  reorder.

## 13. Prayer & Ministry Requests — Unified Model

All the request types above (prophetic request, healing/deliverance request, coaching enrollment
interest, event RSVP, general contact) share one underlying `ministry_requests` table with a
`request_type` discriminator, so admin has **one inbox** to work from instead of five.

Common fields: type, submitted contact info (name, email and/or phone — at least one required),
free-text details, status (`new` → `in_progress` → `resolved` / `archived`), assigned staff
member, internal notes (admin-only, never visible to the submitter — same visibility rule as chat
notes in §16), linked conversation (if it originated from chat), created/updated timestamps.

Admin can filter the unified inbox by type, status, assignee, and date range.

## 14. Talk to the Ministry — Visitor Chat (Overview)

A real-time chat widget available site-wide. Flow: visitor clicks **Talk to the Ministry** →
picks a service/topic (Prophetic Ministry, Healing & Deliverance, Coaching, General) → enters
name + contact (email or phone, at least one) → sends first message → lands in a conversation with
Realtime updates. No account/signup required.

## 15. Visitor Chat — Anonymous Session & Security

- Each visitor gets an anonymous identity via Supabase Anonymous Auth (preferred) or, if that path
  proves impractical, a cryptographically random token (≥128 bits) stored in an httpOnly,
  Secure, SameSite=Lax cookie. Either way, the identity is the sole key used to scope access —
  never the visitor's name/email, which are just contact info on the request.
- **Row Level Security is mandatory on every visitor-facing table** (`conversations`, `messages`,
  attachments). A visitor's policy must resolve access solely from their authenticated anonymous
  `auth.uid()` (or equivalent verified session claim) — never from a value the client can set
  itself (e.g. never trust a `session_token` column supplied in a request body/query param).
- Conversation and message IDs are UUIDv4 (or equivalent), never sequential integers, and never
  appear in a way that lets one visitor enumerate another's conversation (no `/chat/1`, `/chat/2`
  style routes).
- Automated RLS tests are required (§27) proving: visitor A cannot read, list, or subscribe to
  visitor B's conversation or messages via the API, Realtime, or direct table query.

## 16. Visitor Chat — Conversation & Message Model

- `conversations`: id, `visitor_session_id`, `channel` (`webchat` now; `whatsapp` reserved for a
  future WhatsApp Business API integration — see §18), `service_context` (which service the
  visitor picked), status (`open` / `assigned` / `pending_visitor` / `closed` / `archived`),
  assigned staff member, timestamps.
- `messages`: id, conversation_id, sender_type (`visitor` / `staff` / `system`), sender_id, body,
  attachments, state (`sent` / `delivered` / `read`), created_at.
- `conversation_notes`: **separate table**, admin/staff only, RLS denies all visitor access at
  the database level (not just hidden in the UI). Never joined into any query or Realtime channel
  the visitor client subscribes to.
- Designing `channel` as a field now (rather than hardcoding webchat) means a future WhatsApp
  Business API integration can reuse the same conversation/message model.

## 17. Admin Communication Center

- Unified inbox of all conversations (and, functionally, the unified request inbox from §13 —
  a conversation can spawn or link to a `ministry_requests` row).
- Actions: claim/assign, transfer to another staff member, add internal note, mark
  pending-follow-up, close, archive, reopen.
- Message states visible to staff: sent/delivered/read, matching §16.
- Attachments: upload validated per §11, delivered to both parties via signed URLs generated
  per-request (not stored/cached as a long-lived public link).
- Rate limiting (§30) applies to conversation creation and message sending from the public side.

## 18. WhatsApp Click-to-Chat (v1)

- v1 is `wa.me` click-to-chat only — **no WhatsApp Business API integration**.
- The number lives in `website_settings`, editable at Admin → Settings → Communication →
  WhatsApp, not hardcoded anywhere in the codebase.
- A single `buildWhatsAppLink(context)` helper generates every WhatsApp link site-wide, with a
  contextual pre-filled message per surface (e.g. "Hi, I'd like prayer for healing" from the
  Healing & Deliverance page). No other code constructs a `wa.me` URL directly.
- The `channel: 'whatsapp'` field reserved in §16 means a real integration later doesn't require
  a schema migration, just a new channel adapter.

## 19. Notifications

- **In-app**: admin sees a notification center for new requests, new/reassigned conversations,
  new messages needing reply, and new testimonies pending moderation.
- **Email** (via Resend or equivalent, configured through environment variables — see §41): admin
  notification on new request/conversation; visitor confirmation email when they submit a request
  (not for chat — chat is real-time) if they provided an email address.
- **Preferences**: each admin/staff member can opt in/out of per-category email notifications
  (in-app notifications for assigned items are not optional).

## 20. Admin Dashboard — Overview

Sections: Dashboard (at-a-glance counts — new requests, open conversations, pending testimonies),
Content (prophetic messages, sermons, articles, media, events, coaching programs), Requests
(unified inbox, §13), Communication Center (§17), Testimonies (moderation, §12), Settings (§20a),
Users & Roles (§21), Audit Log (§29).

### 20a. Settings

`website_settings` covers: WhatsApp number (§18), disclaimer text for each required disclaimer
(§37), data retention period (§28), contact email, social links, SEO defaults, and feature toggles
for anything not yet built (so an unfinished feature can be hidden rather than shipped half-done —
see §38).

## 21. Roles & Permissions (RBAC)

| Role | Can do |
|---|---|
| **Super Admin** | Everything, including deleting disclaimers/settings that would otherwise be protected (§37), managing other admins' roles, viewing full audit log. |
| **Admin** | Manage content, requests, conversations, testimonies, settings (except protected disclaimer removal). Cannot manage other users' roles. |
| **Staff / Minister** | Handle assigned/claimed conversations and requests for their service area, publish content in their category if granted. No settings/user access. |
| **Moderator** | Testimony moderation and content review only, no request/chat access unless separately granted. |

Enforced with Postgres RLS **and** server-side permission checks on every API route — RLS is the
floor, not the only check; app-layer authorization still validates business rules RLS can't
express (e.g. "can only transfer a conversation you're currently assigned").

## 22. Authentication & MFA

- Admin/staff authenticate via Supabase Auth (email + password minimum).
- **TOTP MFA is mandatory for Super Admin and Admin roles**; strongly recommended (configurable
  requirement in settings) for Staff/Moderator.
- Session/token handling follows Supabase Auth defaults; no custom session storage.
- Visitors never authenticate with a password — see §15 for their anonymous identity model.

## 23. Content Publishing Workflow

All content types in §10, plus events (§9) and coaching programs (§8), share one lifecycle:
`draft → scheduled → published → unpublished → archived`. Scheduled content publishes
automatically at `scheduled_for` (requires a scheduled job/cron, not just a UI check). Archived
content is excluded from public listings and search but retained for admin reference until
explicitly deleted.

## 24. Data Model Overview

Full schema lives in migrations (built in Phase 1 of the build order — see the kickoff message).
Core entity groups:

- **Identity/RBAC**: `admin_users` (staff profile + role), roles/permissions if not using
  Supabase's built-in role claims directly.
- **Content**: `content_items` (prophetic messages/sermons/articles, discriminated by type) or
  separate tables per type — decide during schema design based on how differently they query;
  `events`, `coaching_programs`, `enrollments`, `media`.
- **Engagement**: `testimonies`, `ministry_requests`, `conversations`, `messages`,
  `conversation_notes`.
- **Ops**: `website_settings`, `legal_pages` (Privacy Policy, Terms of Use — §26), `audit_log`,
  `notifications`, `notification_preferences`.

The architecture doc (Phase 0 deliverable) must diagram these with relationships before any
migration is written.

## 25. Countries of Operation & Applicable Privacy Law

The ministry operates from South Africa with a wider African and global diaspora audience.
Baseline approach:

- **POPIA** (South Africa) is the primary compliance baseline, since the ministry is based there.
- Because visitors come from many countries, apply a **GDPR-equivalent baseline** on top (lawful
  basis for processing, explicit consent for non-essential data collection, data minimization,
  right to request deletion) rather than trying to detect each visitor's jurisdiction.
- The Privacy Policy page must be reviewed with actual legal counsel before launch — this SPEC
  defines the product behavior (consent capture, retention, deletion), not final legal text.
  `[PLACEHOLDER: legal review]`

## 26. Privacy Policy, Terms of Use & Consent

- Any form collecting personal data (chat intake, request forms, testimony submission, event RSVP)
  shows a brief consent notice linking to the full Privacy Policy before submission.
- Privacy Policy page (content editable in admin) covers: what's collected, why, retention period
  (pulled live from the §28 setting so the policy text and actual behavior can't drift apart),
  third parties used (Supabase, Resend, WhatsApp), and how to request deletion.
- **Terms of Use is likewise admin-editable content, not hardcoded copy.** Stored as a
  `legal_pages` entry (type `terms_of_use`, alongside `privacy_policy`) with a rich-text body,
  `updated_at`, and `updated_by`; the public Terms of Use page renders it live. Only Admin/Super
  Admin can edit it (§21); every edit is audit-logged (§29) so there's a record of what changed
  and when, which matters for a legal page. Unlike the three required disclaimers (§37), the
  Terms of Use page itself has no "protected/required" flag — it's ordinary editable content,
  just gated to admin roles.

## 27. Security Requirements

This is the section the hardening phase reviews against directly:

1. RLS enabled on every table containing visitor or admin personal data; default-deny, explicit
   allow policies only.
2. No visitor-writable column is ever trusted for authorization (see §15).
3. All API routes validate input with Zod; reject unknown fields.
4. All admin routes check role/permission server-side, independent of RLS.
5. Conversation/request/media IDs are non-sequential and non-guessable (§15, §11).
6. File uploads: type + size validated, content-sniffed server-side, served via short-lived
   signed URLs only — no public bucket ever holds visitor-uploaded or private ministry content.
7. Rate limiting on every public write endpoint (§30).
8. Admin/Super Admin MFA enforced (§22).
9. Secrets only in environment variables, never committed; `.env.example` documents every one.
10. Audit log covers every admin action that creates, modifies, or deletes data, or changes a
    role/permission (§29) — append-only, not editable even by Super Admin.
11. Automated tests prove: cross-visitor conversation isolation, admin-note invisibility to
    visitors, and role-boundary enforcement (a Staff user cannot hit a Super-Admin-only route).
12. Dependency and secret scanning in CI — GitHub Actions, `npm audit` + gitleaks.

## 28. Data Retention & Deletion

- `website_settings` includes a conversation/request retention period (default `[PLACEHOLDER —
  suggest 24 months, confirm with ministry]`).
- A scheduled job archives conversations/requests past the retention period; a separate,
  explicit admin action is required to hard-delete archived data — retention alone never
  auto-deletes without a human-confirmed delete step, to avoid accidental data loss.
- Every archive and delete action is audit-logged (§29), including who, when, and what was
  affected.

## 29. Audit Logging

- Append-only `audit_log`: actor, action, entity type/id, before/after diff (or at least changed
  fields), timestamp, IP/user-agent (admin actions only — never logged for anonymous visitors
  beyond what's operationally necessary).
- Covers: content publish/unpublish/archive/delete, settings changes, role changes, testimony
  moderation decisions, conversation archive/delete, retention-driven deletes.
- Visible to Super Admin (full) and Admin (scoped to their own actions and content) per §21.

## 30. Rate Limiting & Abuse Prevention

- Rate-limited by IP + anonymous session: conversation creation, message sending, request-form
  submission (all types), testimony submission, RSVP submission.
- Suggested starting limits (tune after launch): conversation creation 5/hour/IP, messages
  30/hour/conversation, form submissions 10/hour/IP. Exceeding a limit returns a clear, non-
  technical error, not a silent drop.
- Basic bot mitigation on public forms (honeypot field and/or CAPTCHA — decide during Phase 1
  based on actual spam volume, don't over-build before evidence of a problem).

## 31. File & Media Upload Handling

Covered in §11 (validation, storage) and §27 (security). Applies uniformly to: chat attachments,
testimony media, content cover images, sermon audio/video, event cover images.

## 32. SEO, Sitemap & robots.txt

- Per-page meta title/description (editable in admin for key pages), Open Graph tags, canonical
  URLs.
- Auto-generated `sitemap.xml` including all published content/events; excludes draft/unpublished/
  archived items and admin routes.
- `robots.txt` disallows `/admin` and any API routes; allows everything public.

## 33. Accessibility

WCAG 2.1 AA baseline: semantic HTML, keyboard navigability (including the chat widget and admin
dashboard), sufficient color contrast in the chosen palette, alt text required on all editorial
images (enforced as a required field in the content editor, not just a convention), visible focus
states, form errors announced to screen readers.

## 34. Performance

- Public pages: fast first paint on mobile (this audience skews mobile-heavy — see §35); optimize
  images (responsive sizes, modern formats), avoid render-blocking scripts.
- Realtime chat: message delivery latency should feel instant (sub-second) on a typical mobile
  connection.
- No specific numeric budget mandated here — Phase 6 hardening includes a performance pass using
  Lighthouse or equivalent; treat scores below "good" on Core Web Vitals as bugs to fix.

## 35. Responsive / Mobile

Mobile-first: the acceptance test (§39) explicitly starts on a mobile viewport. Every public page
and the chat widget must be fully usable down to a small phone width (~360px). Admin dashboard
should be usable on tablet; desktop is the primary admin target.

## 36. Cross-Browser Support

Latest two versions of Chrome, Safari (including iOS Safari), Firefox, and Edge. No IE support.

## 37. Required Disclaimers

Three disclaimers are **required** on the site and **editable but not fully removable** except by
explicit Super Admin action (which itself is audit-logged, §29):

1. Prophecy is not a guaranteed prediction (§6).
2. Healing prayer is not a replacement for medical care (§7).
3. For a missing loved one, contact police and a missing-persons organization (§7).

Implementation: store each as a row in `website_settings` (or a dedicated `disclaimers` table)
with an `is_required` flag. The admin UI lets any Admin edit the *text*; only Super Admin can
toggle `is_required` off, and doing so requires a confirmation step and is logged with the actor's
identity and a reason.

## 38. Seed / Sample Content Policy

- All seed content (sample sermon, sample event, sample testimony, sample coaching program) is
  prefixed `[SAMPLE]` in its title and clearly marked in admin (e.g. a "Sample" badge), fully
  editable and deletable.
- No fake/non-functional UI: if a feature isn't built yet (e.g. online coaching payment), it does
  not appear as a dead button — it's either absent or, where useful for admin planning, shown in
  admin only behind a clearly labeled "not yet available" state.

## 39. Acceptance Criteria

The project is done only when all of the following hold, including the full Playwright journey
from the kickoff message:

1. Visitor (mobile viewport) → Talk to the Ministry → picks a service → enters details → sends
   message → admin gets notified → admin opens & replies → visitor sees the reply in real time.
2. A second, independent visitor session cannot read, list, or subscribe to the first visitor's
   conversation (proven by an automated RLS test, not just UI behavior).
3. An admin note on a conversation is never present in any payload, Realtime event, or API
   response the visitor client can see.
4. All three required disclaimers (§37) are present on their respective pages/flows and editable
   only per the rules in §37.
5. Every public form is rate-limited (§30) and every file upload is validated and served via
   signed URL only (§11, §27).
6. Admin MFA is enforced for Super Admin/Admin roles (§22).
7. Sitemap/robots.txt correctly reflect only published public content (§32).
8. Lighthouse (or equivalent) accessibility score in the "good" range on key public pages (§33).
9. No hardcoded secrets in the repo; `.env.example` lists and describes every required variable.
10. Data retention setting exists, is enforced by a scheduled job, and every archive/delete is
    audit-logged (§28, §29).

## 40. Out of Scope for v1

- WhatsApp Business API integration (§18) — click-to-chat only.
- Online payment for coaching (§8) — offline/manual only.
- Visitor accounts/login — chat and requests stay anonymous per-session.
- Multi-language site content — single language (confirm which — see §41) in v1; content model
  should not actively block adding i18n later, but building it now is out of scope.

## 41. Open Placeholders — Must Resolve Before Launch

- Ministry leader/speaker names, photos, logo, brand colours (§2).
- WhatsApp number (§2, §18).
- Coaching program names, descriptions, pricing (§8).
- Domain name and hosting preference (§2).
- Legal review of the Privacy Policy text for the actual country mix served (§25, §26).
- Confirmed data retention period, currently suggested at 24 months (§28).
- Primary site language (§40).
- Email provider account (Resend or equivalent) and sending domain (§19).

---

*End of draft. This spec is not yet approved for build. Review §1–§41, correct anything wrong,
resolve as many §41 placeholders as you can now (the rest can stay as placeholders through Phase
1), and confirm before the architecture/schema phase begins.*
