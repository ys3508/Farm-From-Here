-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — Supabase Storage
--
-- Two buckets, matching the two media tables. Rows in farm_media /
-- plot_update_media hold the object path; the bytes live here.
--
-- Path convention (enforced by the policies below, which key authorisation off
-- the FIRST path segment):
--     farm-media/<farm_id>/<uuid>.<ext>
--     plot-update-media/<farm_id>/<plot_update_id>/<uuid>.<ext>
--
-- Both buckets are public-read. Farm photos and growth updates are the product's
-- shop window, and public objects can be served straight from the CDN without a
-- signed-URL round trip on every image. Nothing private is ever stored here —
-- if that changes, flip `public` to false and switch the app to signed URLs.
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('farm-media', 'farm-media', true, 52428800,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime']),
  ('plot-update-media', 'plot-update-media', true, 104857600,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'video/mp4', 'video/quicktime'])
on conflict (id) do nothing;


-- Anyone (including the unauthenticated CDN fetch) may read.
create policy "public read farm media"
  on storage.objects for select
  using (bucket_id = 'farm-media');

create policy "public read plot update media"
  on storage.objects for select
  using (bucket_id = 'plot-update-media');


-- Only staff of the farm named in the first path segment may write. This is the
-- upload half of the Step 2 farmer backend; the app does not upload in Step 1.
create policy "farm staff upload farm media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'farm-media'
    and public.is_farm_member(((storage.foldername(name))[1])::uuid)
  );

create policy "farm staff modify farm media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'farm-media'
    and public.is_farm_member(((storage.foldername(name))[1])::uuid)
  );

create policy "farm staff delete farm media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'farm-media'
    and public.is_farm_member(((storage.foldername(name))[1])::uuid)
  );

create policy "farm staff upload plot update media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'plot-update-media'
    and public.is_farm_member(((storage.foldername(name))[1])::uuid)
  );

create policy "farm staff modify plot update media"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'plot-update-media'
    and public.is_farm_member(((storage.foldername(name))[1])::uuid)
  );

create policy "farm staff delete plot update media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'plot-update-media'
    and public.is_farm_member(((storage.foldername(name))[1])::uuid)
  );
