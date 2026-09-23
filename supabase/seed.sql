-- Sample content (SPEC §38). Every row here is prefixed [SAMPLE] and is
-- fully editable/deletable from the admin area — none of it is real
-- ministry content.
--
-- NOTE ON ADMIN USERS: creating an auth.users row with a working password
-- depends on the exact Supabase Auth version's internal schema and isn't
-- safe to hardcode in raw SQL here. Create the first Super Admin instead
-- via `supabase auth admin create-user` (CLI) or the Dashboard, then run:
--
--   insert into admin_users (id, full_name, role)
--   values ('<the new user''s auth.users id>', '[SAMPLE] Super Admin', 'super_admin');

insert into website_settings (key, value) values
  ('whatsapp_number', '"+00000000000"'),
  ('contact_email', '"info@example.org"'),
  ('data_retention_months', '24'),
  ('disclaimer_prophecy', '"Prophetic words offered by this ministry are for encouragement and spiritual guidance. They are not a guaranteed prediction of future events and should not be used as the sole basis for major life, medical, financial, or legal decisions."'),
  ('disclaimer_healing', '"Prayer for healing is offered alongside — never as a replacement for — qualified medical care. If you are experiencing a medical emergency, contact your local emergency services immediately."'),
  ('disclaimer_missing_person', '"If this concerns a missing loved one, please also contact your local police and a registered missing-persons organization. This ministry offers prayer support but is not a search-and-rescue or investigative service."')
on conflict (key) do nothing;

insert into legal_pages (page_type, body) values
  ('privacy_policy', '[SAMPLE] Privacy Policy placeholder — replace before launch. See docs/SPEC.md §25-26.'),
  ('terms_of_use', '[SAMPLE] Terms of Use placeholder — replace before launch. Editable at Admin -> Settings -> Legal.')
on conflict (page_type) do nothing;

insert into content_items (content_type, title, slug, summary, body, status, published_at) values
  ('prophetic_message', '[SAMPLE] A Word of Encouragement', 'sample-word-of-encouragement',
   'A short sample prophetic message.', 'This is placeholder body content for a prophetic message. Replace or delete from Admin -> Content.',
   'published', now()),
  ('sermon', '[SAMPLE] Walking in Faith', 'sample-walking-in-faith',
   'A sample sermon entry.', 'Placeholder sermon description. Attach real audio/video from Admin -> Content -> Sermons.',
   'published', now()),
  ('article', '[SAMPLE] Understanding Prophetic Ministry', 'sample-understanding-prophetic-ministry',
   'A sample teaching article.', 'Placeholder article body. Replace with real teaching content.',
   'draft', null);

insert into events (title, slug, description, start_at, end_at, location_type, location_address, status, rsvp_enabled, capacity) values
  ('[SAMPLE] Healing & Deliverance Night', 'sample-healing-deliverance-night',
   'A placeholder event — replace with a real date, location, and description.',
   now() + interval '30 days', now() + interval '30 days' + interval '2 hours',
   'physical', '[SAMPLE] 123 Placeholder Street, Sample City', 'published', true, 100);

insert into coaching_programs (title, slug, description, format, duration, price_amount, price_currency, status) values
  ('[SAMPLE] 6-Week Spiritual Growth Coaching', 'sample-6-week-spiritual-growth-coaching',
   'Placeholder coaching program description and pricing — confirm real pricing before publishing (SPEC §41).',
   '1:1', '6 weeks', 0, 'ZAR', 'draft');

insert into testimonies (display_name, is_anonymous, body, status, is_featured) values
  ('[SAMPLE] A Grateful Visitor', false,
   'This is placeholder testimony text so the moderation queue and public testimonies page have something to render. Replace with real, approved testimonies.',
   'approved', false);
