-- Lets Admin -> Settings set a site-wide background image (stored as a
-- media id in website_settings, key 'site_background_media_id' — no new
-- table needed, website_settings is already a free-form key/value store).
-- Comparing as text avoids a cast error on rows where the setting is unset
-- or not yet a valid uuid (website_settings.value is plain text).

create policy "anyone reads the site background image"
  on media for select
  using (
    id::text in (
      select value from website_settings where key = 'site_background_media_id'
    )
  );
