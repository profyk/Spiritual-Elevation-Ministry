-- RLS regression tests for the rules SPEC §15/§16/§21/§27 require to be
-- proven, not just asserted in comments:
--   1. A visitor can read only their own conversation/messages.
--   2. conversation_notes are never visible to any visitor.
--   3. Moderator cannot write content/manage conversations (the bug fixed
--      alongside this file — see the Phase 6 commit).
--
-- WRITTEN BUT NOT EXECUTED in this environment: there is no Docker/Supabase
-- CLI available here to run `supabase test db` against. Uses the standard,
-- documented technique for impersonating a Postgres role's auth.uid() in a
-- pgTAP test (setting request.jwt.claim.sub via `set_config`, which is what
-- Supabase's own `auth.uid()` reads) rather than a CLI-version-specific
-- helper library, since that should stay stable across Supabase CLI
-- versions. Run this for real (`supabase test db`) before trusting it, and
-- expect to need small fixes for whatever pgTAP/Supabase CLI version you're
-- actually on.

begin;
select plan(9);

-- ── Fixtures ────────────────────────────────────────────────────────────
-- Two visitor identities and one staff identity, all as bare auth.users
-- rows (minimal columns — enough for auth.uid() to resolve, not a full
-- Supabase Auth signup).

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-000000000001', 'visitor-a@example.test'),
  ('00000000-0000-0000-0000-000000000002', 'visitor-b@example.test'),
  ('00000000-0000-0000-0000-000000000003', 'staff@example.test'),
  ('00000000-0000-0000-0000-000000000004', 'moderator@example.test');

insert into admin_users (id, full_name, role) values
  ('00000000-0000-0000-0000-000000000003', 'Test Staff', 'staff'),
  ('00000000-0000-0000-0000-000000000004', 'Test Moderator', 'moderator');

-- Visitor A's conversation, created as visitor A.
select set_config('role', 'authenticated', true);
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

insert into conversations (id, visitor_auth_id, visitor_name, visitor_contact_email)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Visitor A', 'a@example.test');

insert into messages (conversation_id, sender_type, sender_visitor_auth_id, body)
values ('10000000-0000-0000-0000-000000000001', 'visitor', '00000000-0000-0000-0000-000000000001', 'Hello from A');

-- A staff note on that conversation — inserted as staff (below) so we can
-- prove visitors never see it regardless of who wrote it.
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
insert into conversation_notes (conversation_id, author_id, body)
values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'Internal note — never visible to the visitor');

-- ── 1. Visitor A can read their own conversation ───────────────────────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);

select is(
  (select count(*)::int from conversations where id = '10000000-0000-0000-0000-000000000001'),
  1,
  'Visitor A can read their own conversation'
);

select is(
  (select count(*)::int from messages where conversation_id = '10000000-0000-0000-0000-000000000001'),
  1,
  'Visitor A can read their own message'
);

-- ── 2. Visitor B cannot read Visitor A's conversation or messages ──────
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);

select is(
  (select count(*)::int from conversations where id = '10000000-0000-0000-0000-000000000001'),
  0,
  'Visitor B cannot read Visitor A''s conversation'
);

select is(
  (select count(*)::int from messages where conversation_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'Visitor B cannot read Visitor A''s messages'
);

select throws_ok(
  $$ insert into messages (conversation_id, sender_type, sender_visitor_auth_id, body)
     values ('10000000-0000-0000-0000-000000000001', 'visitor', '00000000-0000-0000-0000-000000000002', 'Sneaking in') $$,
  'Visitor B cannot insert a message into Visitor A''s conversation'
);

-- ── 3. No visitor — A or B — can ever read conversation_notes ──────────
select is(
  (select count(*)::int from conversation_notes where conversation_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'Visitor B cannot read the internal note'
);

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select is(
  (select count(*)::int from conversation_notes where conversation_id = '10000000-0000-0000-0000-000000000001'),
  0,
  'Visitor A (the conversation''s own visitor) still cannot read the internal note'
);

-- ── 4. Moderator can read testimonies but cannot write content_items ───
-- (Regression coverage for the is_staff_or_above() bug fixed alongside
-- this test file — see supabase/migrations/0001_init.sql.)
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);

select lives_ok(
  $$ select * from testimonies $$,
  'Moderator can read testimonies'
);

select throws_ok(
  $$ insert into content_items (content_type, title, slug, status)
     values ('article', 'Should be blocked', 'should-be-blocked', 'draft') $$,
  'Moderator cannot insert into content_items (staff+ only)'
);

select * from finish();
rollback;
