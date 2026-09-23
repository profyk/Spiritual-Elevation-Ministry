-- Spiritual Elevation Ministry — initial schema
-- Source of truth for the data model described in docs/ARCHITECTURE.md §4.
-- RLS is enabled on every table per SPEC §27 (default-deny, explicit allow only).

create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────

create type admin_role as enum ('super_admin', 'admin', 'staff', 'moderator');

create type content_status as enum ('draft', 'scheduled', 'published', 'unpublished', 'archived');
create type content_type as enum ('prophetic_message', 'sermon', 'article');

create type event_status as enum ('draft', 'published', 'cancelled', 'archived');
create type location_type as enum ('physical', 'online');

create type coaching_status as enum ('draft', 'published', 'archived');
create type payment_status as enum ('unpaid', 'partially_paid', 'paid', 'waived');
create type enrollment_status as enum ('new', 'in_progress', 'confirmed', 'cancelled');

create type testimony_status as enum ('pending', 'approved', 'rejected', 'archived');

create type request_type as enum (
  'prophetic_ministry', 'healing_deliverance', 'coaching_interest',
  'event_rsvp', 'general_contact'
);
create type request_status as enum ('new', 'in_progress', 'resolved', 'archived');

create type conversation_channel as enum ('webchat', 'whatsapp');
create type service_context as enum (
  'prophetic_ministry', 'healing_deliverance', 'coaching', 'events', 'general'
);
create type conversation_status as enum (
  'open', 'assigned', 'pending_visitor', 'closed', 'archived'
);
create type message_sender_type as enum ('visitor', 'staff', 'system');
create type message_state as enum ('sent', 'delivered', 'read');

create type media_kind as enum ('image', 'audio', 'video', 'document');
create type media_bucket as enum ('media', 'attachments');

create type legal_page_type as enum ('privacy_policy', 'terms_of_use');

-- ─────────────────────────────────────────────────────────────────────────
-- Identity / RBAC
-- ─────────────────────────────────────────────────────────────────────────

create table admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  role admin_role not null default 'staff',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Security-definer helpers so RLS policies elsewhere can check the caller's
-- admin role without recursively hitting RLS on admin_users itself.
create or replace function public.current_admin_role()
returns admin_role
language sql stable security definer set search_path = public
as $$
  select role from admin_users where id = auth.uid() and is_active;
$$;

create or replace function public.is_admin_or_above()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(current_admin_role() in ('admin', 'super_admin'), false);
$$;

create or replace function public.is_staff_or_above()
returns boolean
language sql stable security definer set search_path = public
as $$
  select current_admin_role() is not null;
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce(current_admin_role() = 'super_admin', false);
$$;

alter table admin_users enable row level security;

create policy "admin reads own profile"
  on admin_users for select
  using (id = auth.uid());

create policy "admin+ reads all staff profiles"
  on admin_users for select
  using (is_admin_or_above());

create policy "super admin manages staff profiles"
  on admin_users for all
  using (is_super_admin())
  with check (is_super_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- Ops: settings, legal pages, audit log, notifications
-- ─────────────────────────────────────────────────────────────────────────

create table website_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users (id)
);

alter table website_settings enable row level security;

create policy "anyone reads settings"
  on website_settings for select
  using (true);

create policy "admin+ writes settings"
  on website_settings for all
  using (is_admin_or_above())
  with check (is_admin_or_above());

create table legal_pages (
  id uuid primary key default gen_random_uuid(),
  page_type legal_page_type not null unique,
  body text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references admin_users (id)
);

alter table legal_pages enable row level security;

create policy "anyone reads legal pages"
  on legal_pages for select
  using (true);

create policy "admin+ writes legal pages"
  on legal_pages for all
  using (is_admin_or_above())
  with check (is_admin_or_above());

create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references admin_users (id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  changes jsonb,
  created_at timestamptz not null default now()
);

alter table audit_log enable row level security;

-- Append-only: no update/delete policy for anyone, including super_admin (SPEC §29).
create policy "admin+ reads audit log"
  on audit_log for select
  using (is_admin_or_above());

create policy "staff+ writes audit log"
  on audit_log for insert
  with check (is_staff_or_above());

create table notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_admin_id uuid not null references admin_users (id) on delete cascade,
  notification_type text not null,
  title text not null,
  body text,
  link_url text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table notifications enable row level security;

create policy "recipient reads own notifications"
  on notifications for select
  using (recipient_admin_id = auth.uid());

create policy "recipient updates own notifications"
  on notifications for update
  using (recipient_admin_id = auth.uid())
  with check (recipient_admin_id = auth.uid());

create table notification_preferences (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admin_users (id) on delete cascade,
  category text not null,
  email_enabled boolean not null default true,
  unique (admin_id, category)
);

alter table notification_preferences enable row level security;

create policy "admin manages own preferences"
  on notification_preferences for all
  using (admin_id = auth.uid())
  with check (admin_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- Media
-- ─────────────────────────────────────────────────────────────────────────

create table media (
  id uuid primary key default gen_random_uuid(),
  bucket media_bucket not null,
  storage_path text not null,
  media_kind media_kind not null,
  mime_type text not null,
  size_bytes bigint not null,
  uploaded_by_admin uuid references admin_users (id),
  uploaded_by_visitor uuid,  -- auth.uid() of an anonymous visitor session, if applicable
  created_at timestamptz not null default now(),
  constraint media_uploader_check check (
    (uploaded_by_admin is not null) <> (uploaded_by_visitor is not null)
  )
);

alter table media enable row level security;

create policy "staff+ reads all media"
  on media for select
  using (is_staff_or_above());

create policy "visitor reads own uploaded media"
  on media for select
  using (uploaded_by_visitor = auth.uid());

create policy "staff+ manages media"
  on media for all
  using (is_staff_or_above())
  with check (is_staff_or_above());

create policy "visitor uploads own media"
  on media for insert
  with check (uploaded_by_visitor = auth.uid());

-- Note: public content media (published sermon covers, etc.) is served via
-- the signed-URL API route (ARCHITECTURE.md §7), which applies its own
-- permission check rather than relying solely on this table's RLS — this
-- table governs direct Postgres access, not the storage object itself.

-- ─────────────────────────────────────────────────────────────────────────
-- Content: prophetic messages, sermons, articles
-- ─────────────────────────────────────────────────────────────────────────

create table content_items (
  id uuid primary key default gen_random_uuid(),
  content_type content_type not null,
  title text not null,
  slug text not null unique,
  summary text,
  body text,
  category text,
  tags text[] not null default '{}',
  cover_media_id uuid references media (id),
  media_id uuid references media (id),  -- sermon audio/video
  author_id uuid references admin_users (id),
  status content_status not null default 'draft',
  published_at timestamptz,
  scheduled_for timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index content_items_status_idx on content_items (status, content_type);

alter table content_items enable row level security;

create policy "anyone reads published content"
  on content_items for select
  using (status = 'published');

create policy "staff+ reads all content"
  on content_items for select
  using (is_staff_or_above());

create policy "staff+ manages content"
  on content_items for all
  using (is_staff_or_above())
  with check (is_staff_or_above());

-- ─────────────────────────────────────────────────────────────────────────
-- Events
-- ─────────────────────────────────────────────────────────────────────────

create table events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  start_at timestamptz not null,
  end_at timestamptz,
  timezone text not null default 'Africa/Johannesburg',
  location_type location_type not null default 'physical',
  location_address text,
  online_url text,
  cover_media_id uuid references media (id),
  status event_status not null default 'draft',
  rsvp_enabled boolean not null default false,
  capacity integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table events enable row level security;

create policy "anyone reads published events"
  on events for select
  using (status = 'published');

create policy "staff+ reads all events"
  on events for select
  using (is_staff_or_above());

create policy "staff+ manages events"
  on events for all
  using (is_staff_or_above())
  with check (is_staff_or_above());

create table event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  name text not null,
  contact_email text,
  contact_phone text,
  attendee_count integer not null default 1,
  created_at timestamptz not null default now(),
  constraint event_rsvp_contact_check check (
    contact_email is not null or contact_phone is not null
  )
);

alter table event_rsvps enable row level security;

create policy "anyone submits an rsvp"
  on event_rsvps for insert
  with check (true);

create policy "staff+ reads rsvps"
  on event_rsvps for select
  using (is_staff_or_above());

create policy "staff+ manages rsvps"
  on event_rsvps for update
  using (is_staff_or_above())
  with check (is_staff_or_above());

create policy "staff+ deletes rsvps"
  on event_rsvps for delete
  using (is_staff_or_above());

-- ─────────────────────────────────────────────────────────────────────────
-- Coaching
-- ─────────────────────────────────────────────────────────────────────────

create table coaching_programs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  format text,
  duration text,
  price_amount numeric(10, 2),
  price_currency text not null default 'ZAR',
  capacity integer,
  status coaching_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table coaching_programs enable row level security;

create policy "anyone reads published coaching programs"
  on coaching_programs for select
  using (status = 'published');

create policy "staff+ reads all coaching programs"
  on coaching_programs for select
  using (is_staff_or_above());

create policy "staff+ manages coaching programs"
  on coaching_programs for all
  using (is_staff_or_above())
  with check (is_staff_or_above());

create table enrollments (
  id uuid primary key default gen_random_uuid(),
  coaching_program_id uuid not null references coaching_programs (id),
  name text not null,
  contact_email text,
  contact_phone text,
  message text,
  payment_status payment_status not null default 'unpaid',
  payment_notes text,
  payment_provider_reference text,  -- reserved for a future online-payment integration
  status enrollment_status not null default 'new',
  assigned_to uuid references admin_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint enrollment_contact_check check (
    contact_email is not null or contact_phone is not null
  )
);

alter table enrollments enable row level security;

create policy "anyone submits an enrollment"
  on enrollments for insert
  with check (true);

create policy "staff+ reads enrollments"
  on enrollments for select
  using (is_staff_or_above());

create policy "staff+ manages enrollments"
  on enrollments for update
  using (is_staff_or_above())
  with check (is_staff_or_above());

-- ─────────────────────────────────────────────────────────────────────────
-- Chat: conversations, messages, private notes
-- ─────────────────────────────────────────────────────────────────────────

create table conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_auth_id uuid not null,  -- auth.uid() of the visitor's anonymous session
  channel conversation_channel not null default 'webchat',
  service_context service_context not null default 'general',
  visitor_name text not null,
  visitor_contact_email text,
  visitor_contact_phone text,
  status conversation_status not null default 'open',
  assigned_to uuid references admin_users (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint conversation_contact_check check (
    visitor_contact_email is not null or visitor_contact_phone is not null
  )
);

create index conversations_visitor_idx on conversations (visitor_auth_id);

alter table conversations enable row level security;

create policy "visitor reads own conversations"
  on conversations for select
  using (visitor_auth_id = auth.uid());

create policy "visitor creates own conversation"
  on conversations for insert
  with check (visitor_auth_id = auth.uid());

create policy "staff+ reads all conversations"
  on conversations for select
  using (is_staff_or_above());

create policy "staff+ manages conversations"
  on conversations for update
  using (is_staff_or_above())
  with check (is_staff_or_above());

create table messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_type message_sender_type not null,
  sender_visitor_auth_id uuid,
  sender_admin_id uuid references admin_users (id),
  body text,
  attachment_media_id uuid references media (id),
  state message_state not null default 'sent',
  created_at timestamptz not null default now(),
  constraint message_sender_check check (
    (sender_type = 'visitor' and sender_visitor_auth_id is not null and sender_admin_id is null)
    or (sender_type = 'staff' and sender_admin_id is not null and sender_visitor_auth_id is null)
    or (sender_type = 'system' and sender_admin_id is null and sender_visitor_auth_id is null)
  )
);

create index messages_conversation_idx on messages (conversation_id, created_at);

alter table messages enable row level security;

create policy "visitor reads own conversation messages"
  on messages for select
  using (
    conversation_id in (
      select id from conversations where visitor_auth_id = auth.uid()
    )
  );

create policy "visitor sends message in own conversation"
  on messages for insert
  with check (
    sender_type = 'visitor'
    and sender_visitor_auth_id = auth.uid()
    and conversation_id in (
      select id from conversations where visitor_auth_id = auth.uid()
    )
  );

create policy "staff+ reads all messages"
  on messages for select
  using (is_staff_or_above());

create policy "staff+ sends messages"
  on messages for insert
  with check (
    sender_type in ('staff', 'system') and is_staff_or_above()
  );

create policy "staff+ updates message state"
  on messages for update
  using (is_staff_or_above())
  with check (is_staff_or_above());

-- conversation_notes: staff/admin only, no visitor policy of any kind exists,
-- so RLS's default-deny means a visitor can never read a row here (SPEC §16, §27).
create table conversation_notes (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations (id) on delete cascade,
  author_id uuid not null references admin_users (id),
  body text not null,
  created_at timestamptz not null default now()
);

alter table conversation_notes enable row level security;

create policy "staff+ reads notes"
  on conversation_notes for select
  using (is_staff_or_above());

create policy "staff+ writes notes"
  on conversation_notes for insert
  with check (is_staff_or_above() and author_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────
-- Testimonies
-- ─────────────────────────────────────────────────────────────────────────

create table testimonies (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  is_anonymous boolean not null default false,
  body text not null,
  media_id uuid references media (id),
  status testimony_status not null default 'pending',
  is_featured boolean not null default false,
  sort_order integer,
  internal_reason text,  -- admin-only, never exposed publicly
  moderated_by uuid references admin_users (id),
  moderated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table testimonies enable row level security;

create policy "anyone reads approved testimonies"
  on testimonies for select
  using (status = 'approved');

create policy "anyone submits a testimony"
  on testimonies for insert
  with check (status = 'pending');

create policy "staff+ moderates testimonies"
  on testimonies for select
  using (is_staff_or_above());

create policy "staff+ updates testimonies"
  on testimonies for update
  using (is_staff_or_above())
  with check (is_staff_or_above());

-- ─────────────────────────────────────────────────────────────────────────
-- Unified ministry requests
-- ─────────────────────────────────────────────────────────────────────────

create table ministry_requests (
  id uuid primary key default gen_random_uuid(),
  request_type request_type not null,
  concerns_missing_person boolean not null default false,
  name text not null,
  contact_email text,
  contact_phone text,
  details text,
  status request_status not null default 'new',
  assigned_to uuid references admin_users (id),
  conversation_id uuid references conversations (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ministry_request_contact_check check (
    contact_email is not null or contact_phone is not null
  )
);

create index ministry_requests_status_idx on ministry_requests (status, request_type);

alter table ministry_requests enable row level security;

create policy "anyone submits a ministry request"
  on ministry_requests for insert
  with check (status = 'new');

create policy "staff+ reads ministry requests"
  on ministry_requests for select
  using (is_staff_or_above());

create policy "staff+ manages ministry requests"
  on ministry_requests for update
  using (is_staff_or_above())
  with check (is_staff_or_above());

-- ─────────────────────────────────────────────────────────────────────────
-- updated_at maintenance
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'admin_users', 'content_items', 'events', 'coaching_programs',
    'enrollments', 'conversations', 'ministry_requests'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on %I
       for each row execute function public.set_updated_at();', t
    );
  end loop;
end $$;
