-- Lets Admin -> Settings set a site-wide background image (stored as a
-- media id in website_settings, key 'site_background_media_id' — no new
-- table needed, website_settings is already a free-form key/value store).
-- website_settings.value is jsonb, not text (every other setting is a
-- JSON string too, e.g. "+27821234567") — #>>'{}' unwraps the jsonb
-- scalar to plain text so it compares against id::text correctly, and
-- comparing as text (rather than casting to uuid) avoids a cast error
-- when the setting is unset or not yet a valid uuid.

create policy "anyone reads the site background image"
  on media for select
  using (
    id::text in (
      select value #>> '{}' from website_settings where key = 'site_background_media_id'
    )
  );
