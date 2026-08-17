-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — development seed
--
-- ⚠️  EVERY ROW HERE IS A DEVELOPMENT FIXTURE, NOT A REAL FARM. ⚠️
--
-- CLAUDE.md invariant 6: "Only real, contracted farms. Never seed or import
-- third-party farm data as if it were real." This fixture exists so Steps 2–7
-- have something to render before a farmer has signed. It obeys the invariant
-- three ways:
--   1. `farms.is_demo = true` — the app filters demo farms out unless
--      EXPO_PUBLIC_SHOW_DEMO_DATA is turned on.
--   2. The name says so, in the UI, in capitals.
--   3. It is invented, not scraped. No third-party farm data is used.
--
-- Remove it completely, at any time, with:
--     delete from public.farms where is_demo;      -- cascades to everything below
--
-- Run with:  supabase db reset      (applies migrations, then this file)
-- ════════════════════════════════════════════════════════════════════════════

-- Fixed UUIDs so the fixture is stable and re-runnable.
insert into public.farms (id, name, slug, description, latitude, longitude, address, is_active, is_demo)
values (
  '11111111-1111-4111-8111-111111111111',
  'DEMO FARM — not a real farm',
  'demo-farm',
  'Development fixture only. Replace with the first real contracted farm; do not '
  'show this to anyone as a real place. Delete with: delete from public.farms where is_demo;',
  37.7955,
  -122.3937,
  'No real address — development fixture',
  true,
  true
)
on conflict (id) do nothing;

-- One plot. Farmers post updates HERE; every adoptable below inherits the
-- fan-out from this single row.
insert into public.plots (id, farm_id, plot_id, name, description)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'A-01',
  'North Row',
  'Development fixture plot.'
)
on conflict (id) do nothing;

-- Adoptables. Several trees (the V1.0 hero), plus exactly one crop and one
-- animal to exercise the generalised `type` column — a schema exercise only,
-- NOT three experiences to build (CLAUDE.md invariant 4).
--
-- `identifier` is the real-world identity and never changes. The pet name the
-- user picks lives on adoptions.display_name, not here.
insert into public.adoptables (id, plot_id, identifier, type, species, status, planted_at, notes)
values
  ('33333333-3333-4333-8333-333333333301', '22222222-2222-4222-8222-222222222222',
   '#1048', 'tree', 'Honeycrisp Apple', 'available', '2021-03-14', 'Fixture.'),
  ('33333333-3333-4333-8333-333333333302', '22222222-2222-4222-8222-222222222222',
   '#1049', 'tree', 'Honeycrisp Apple', 'available', '2021-03-14', 'Fixture.'),
  ('33333333-3333-4333-8333-333333333303', '22222222-2222-4222-8222-222222222222',
   '#1050', 'tree', 'Gravenstein Apple', 'growing', '2022-11-02', 'Fixture.'),
  ('33333333-3333-4333-8333-333333333304', '22222222-2222-4222-8222-222222222222',
   '#1051', 'tree', 'Meyer Lemon', 'thriving', '2020-05-20', 'Fixture.'),
  ('33333333-3333-4333-8333-333333333305', '22222222-2222-4222-8222-222222222222',
   'ROW-C', 'crop', 'Heirloom Tomato', 'available', null, 'Fixture — exercises type=crop.'),
  ('33333333-3333-4333-8333-333333333306', '22222222-2222-4222-8222-222222222222',
   'HEN-07', 'animal', 'Rhode Island Red Hen', 'available', null, 'Fixture — exercises type=animal.')
on conflict (id) do nothing;

-- One plot update with TWO media rows, so the multi-media path is exercised by
-- the fixture rather than only by the schema.
--
-- NOTE: storage_path values below point at objects that do NOT exist — nothing
-- is uploaded by this script. They are here to prove the shape (a plot update
-- has MANY media, never a single `photo` column). Step 2 uploads real files.
-- author_id is null because the fixture creates no auth users.
insert into public.plot_updates (id, plot_id, author_id, text, milestone)
values (
  '44444444-4444-4444-8444-444444444444',
  '22222222-2222-4222-8222-222222222222',
  null,
  'Fixture update. Blossoms opened across the north row this week.',
  'first_blossom'
)
on conflict (id) do nothing;

insert into public.plot_update_media (id, plot_update_id, media_type, storage_path, mime_type, caption, sort_order)
values
  ('55555555-5555-4555-8555-555555555501', '44444444-4444-4444-8444-444444444444',
   'image', '11111111-1111-4111-8111-111111111111/44444444-4444-4444-8444-444444444444/placeholder-1.jpg',
   'image/jpeg', 'Fixture — no file uploaded', 0),
  ('55555555-5555-4555-8555-555555555502', '44444444-4444-4444-8444-444444444444',
   'image', '11111111-1111-4111-8111-111111111111/44444444-4444-4444-8444-444444444444/placeholder-2.jpg',
   'image/jpeg', 'Fixture — no file uploaded', 1)
on conflict (id) do nothing;

-- Deliberately NOT seeded: profiles, adoptions, ledger rows, referrals.
-- Those are created by real signups through handle_new_user(), and inventing
-- them here would put fake numbers in the two economies.
