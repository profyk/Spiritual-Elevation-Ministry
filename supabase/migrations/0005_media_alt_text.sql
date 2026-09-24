-- SPEC §33: alt text required on all editorial images, enforced as a
-- required field in the content editor. Lives on `media` (not per-entity)
-- since it describes the image itself, the same place bucket/storage_path
-- already live.

alter table media add column alt_text text;
