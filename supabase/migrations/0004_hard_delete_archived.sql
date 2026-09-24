-- SPEC §28: retention only ever archives; a separate, explicit admin
-- action permanently deletes already-archived data. Neither table had a
-- delete policy at all before this, so even an Admin's own RLS-scoped
-- client couldn't hard-delete anything — only archive. Scoped to
-- status = 'archived' as a second rail beyond the app-layer route only
-- accepting archived rows, and to admin+ (Staff/Moderator never get this).

create policy "admin+ deletes archived conversations"
  on conversations for delete
  using (is_admin_or_above() and status = 'archived');

create policy "admin+ deletes archived requests"
  on ministry_requests for delete
  using (is_admin_or_above() and status = 'archived');

-- ministry_requests.conversation_id had no ON DELETE behavior (defaults to
-- NO ACTION), which would block deleting a conversation that an archived
-- request still points to. Deleting a request never needs to touch its
-- conversation, so null the reference out instead of blocking or cascading.
alter table ministry_requests
  drop constraint ministry_requests_conversation_id_fkey,
  add constraint ministry_requests_conversation_id_fkey
    foreign key (conversation_id) references conversations (id) on delete set null;
