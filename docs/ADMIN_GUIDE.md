# Admin Guide

For ministry staff using the admin dashboard at `/admin`. If something described here doesn't
match what you see, the build has likely moved on since this was written — check with whoever
maintains the site.

## Signing in

Go to `/admin/login` and sign in with the email/password an existing Admin or Super Admin set up
for you (there's no public signup). If your role is Admin or Super Admin, you'll be asked to set
up two-factor authentication (TOTP) the first time — scan the QR code with an authenticator app
(Google Authenticator, Authy, 1Password, etc.) and enter the 6-digit code it shows you. After
that, every sign-in asks for a fresh code from the app.

## Roles

- **Super Admin** — everything, including managing other staff accounts and the one action
  nobody else can do: turning off a required legal disclaimer.
- **Admin** — everything except managing other staff accounts.
- **Staff** — content, events, coaching programs, requests, and chat. No settings or user
  management.
- **Moderator** — testimony moderation and read-only content review. Can't create/edit content,
  manage events/coaching, or touch requests/chat.

The left sidebar only shows what your role can actually use.

## Dashboard

Landing page after login — a quick count of new requests, open conversations, and testimonies
waiting for review.

## Content

Prophetic messages, sermons, and articles all live here as one list, filterable by nothing yet
(sorted by most-recently-updated). **New content** starts a piece as a draft. Status controls
where it shows up:

- **Draft** — nowhere public.
- **Scheduled** — set a "Publish at" time; it isn't public yet either (the job that flips it
  to Published automatically on a schedule — see the note below).
- **Published** — live on the public site.
- **Unpublished** — was public, pulled back, still editable.
- **Archived** — hidden from every public list and from the default admin view.

> Scheduled content auto-publishes at its scheduled time via a job that runs every 15 minutes
> (`.github/workflows/cron.yml`) — this only works once that workflow's `SITE_URL` and
> `CRON_SECRET` repo secrets are set (see `docs/DEPLOYMENT.md`). Without them, come back and
> manually switch it to Published.

## Events

Same idea as Content, plus a start/end time, a physical address or online link, and an optional
RSVP toggle with a capacity. Turning on RSVP adds a form to the event's public page.

## Coaching Programs

Title, description, format, duration, and price — price is informational only. There's no online
payment; when someone expresses interest, follow up with them directly (WhatsApp, email, bank
transfer, whatever the ministry normally uses) and track that manually. A visitor's interest shows
up in **Requests** as a "coaching interest" item.

## Communication (Chat)

Every live chat conversation, in three tabs:

- **Active** — open, unassigned, or waiting on a reply.
- **Closed** — resolved.
- **Archived** — closed and put away.

Open a conversation to reply in real time, **Claim** it if it's unassigned, **Transfer** it to a
teammate, or mark it **pending follow-up** if you're waiting to hear back from the visitor. The
notes panel on the right is for your team only — whatever you write there is never visible to the
visitor, by design (it's not just hidden in the interface, the visitor's account literally cannot
read it).

## Requests

Everything a visitor submitted through a form (not chat) — prophetic ministry, healing &
deliverance, coaching interest, event RSVPs route separately, general contact — in one inbox.
Filter by status along the top. **Claim** assigns it to you; mark it **Resolved** when you're
done, or **Archive** it.

## Testimonies

Every submission starts as **Pending** and is invisible on the public site until you **Approve**
it. **Reject** if it shouldn't be published — you can leave yourself an internal reason, which the
person who submitted it never sees. Approved testimonies can be **Featured** (shown first) or
**Archived** later.

## Settings (Admin and Super Admin only)

- **WhatsApp number** and **contact email** — used site-wide; change it here, not in code.
- **Required disclaimers** — the prophecy, healing, and missing-person notices shown on the
  relevant service pages. You can edit the wording; only a Super Admin can ever turn one off
  entirely, and that's logged.
- **Legal pages** — the actual Privacy Policy and Terms of Use text, edited live here.
- **Data retention** — how many months of chat/request history to keep. A daily job archives
  closed conversations and resolved requests past that age (SPEC §28) — it only **archives**,
  never deletes; deleting archived history is still a separate, manual, audit-logged action you'd
  take yourself (not yet built as a one-click admin action).

## Users & Roles (Super Admin only)

Change anyone's role or deactivate their account. You can't demote or deactivate yourself from
this screen (on purpose).

## Audit Log (Admin and Super Admin)

A read-only trail of who did what — every content/settings/role change, every testimony decision,
every conversation archive. Nothing here can ever be edited or deleted, including by a Super
Admin.

## Notifications

The bell icon top-right shows new requests, new conversations, and new testimonies as they come
in, live. Click **Notification preferences** (bottom of that dropdown) to choose which categories
also email you — in-app notifications for things assigned to you are always on regardless.

## Known gaps (as of this build)

- Cover images, sermon audio/video, and chat attachments can be uploaded — validated for type and
  size, served only via short-lived signed links, never a public URL. Testimony submissions don't
  have an attachment option yet (the visitor-facing form doesn't ask for one).
- Scheduled publishing and data retention archiving both run automatically, but only once
  `.github/workflows/cron.yml`'s `SITE_URL`/`CRON_SECRET` repo secrets are set — see
  `docs/DEPLOYMENT.md`.
- No online payment for coaching programs — follow up manually.
- No one-click "permanently delete" for archived data yet — SPEC §28 requires that to be a
  separate, explicit, audit-logged action from archiving, and it isn't built.
