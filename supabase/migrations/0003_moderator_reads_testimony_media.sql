-- Testimony moderation is moderator+'s job (SPEC §21), but "staff+ reads
-- all media" (0001_init.sql) requires the higher staff rank — a plain
-- Moderator reviewing a PENDING testimony's attached photo would get a
-- null signed URL, RLS silently hiding the row. Grant moderator+ read on
-- any media a testimony (at any status, not just approved — they need to
-- review it before it's approved) references.

create policy "moderator+ reads media attached to any testimony"
  on media for select
  using (
    is_moderator_or_above()
    and id in (select media_id from testimonies where media_id is not null)
  );
