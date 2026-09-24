-- Storage buckets (SPEC §11: never a public bucket) and a media RLS gap
-- fix: a visitor could read media THEY uploaded, but not a file STAFF
-- attached to a message in the visitor's own conversation, so the
-- visitor's own attachment couldn't actually reach them. Both buckets
-- otherwise get no storage.objects policy at all — deny-by-default — since
-- every read/write goes through the API routes in src/app/api/media/*,
-- which do their own permission check before touching Storage via the
-- service-role client (ARCHITECTURE.md §7).

insert into storage.buckets (id, name, public)
values ('media', 'media', false), ('attachments', 'attachments', false)
on conflict (id) do nothing;

create policy "visitor reads media attached to own conversation messages"
  on media for select
  using (
    id in (
      select attachment_media_id from messages
      where attachment_media_id is not null
        and conversation_id in (
          select id from conversations where visitor_auth_id = auth.uid()
        )
    )
  );

-- A second real gap: nothing let a plain, not-even-anonymously-signed-in
-- visitor read the cover image / sermon audio-video of PUBLISHED public
-- content or an APPROVED testimony's media — only staff and the media's
-- own uploader could. Without this, every public sermon/event cover image
-- would 404 on its signed URL.
create policy "anyone reads media attached to public content"
  on media for select
  using (
    id in (
      select cover_media_id from content_items where status = 'published' and cover_media_id is not null
      union
      select media_id from content_items where status = 'published' and media_id is not null
      union
      select cover_media_id from events where status = 'published' and cover_media_id is not null
      union
      select media_id from testimonies where status = 'approved' and media_id is not null
    )
  );
