-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — Step 2A: farmer application → review → approval
--
-- Spec: revise/2026-08-19-step2a-farmer-application.md
--
-- This is the entry door to being a farmer. A player applies from inside the
-- app; approval writes the `farms` row, the `farm_members` row and the opening
-- `farm_media`, which is exactly what the farmer-world unlock gate checks.
--
-- ADDITIVE. It creates three new tables and one private bucket, and it adds
-- columns to `farms` / `farm_media`. It does NOT change any Step-1 relationship
-- and does NOT touch the reserved real-money tables.
--
-- ⚠️ ONE RELAXATION OF A STEP-1 CONSTRAINT, and it is deliberate — see
--    "COARSE LOCATION" below. farms.latitude / farms.longitude become NULLABLE.
-- ════════════════════════════════════════════════════════════════════════════


-- ════════════════════════════════════════════════════════════════════════════
-- 0. WHAT THE APPLICATION PRODUCES — additions to existing tables
-- ════════════════════════════════════════════════════════════════════════════

-- ── farms.farm_type ─────────────────────────────────────────────────────────
-- The trust tier, carried over from the application and never edited by the
-- farmer. `individual` is auto-approved and is shown to consumers as
-- "Community grower"; `verified_farm` passes a human review and is the ONLY
-- tier that may ever be called "Verified".
alter table public.farms
  add column if not exists farm_type text not null default 'individual'
    check (farm_type in ('individual', 'verified_farm'));

comment on column public.farms.farm_type is
  'Trust tier from the approved application. individual = "Community grower" '
  '(auto-approved, NOT verified). verified_farm = "Verified farm" (manually '
  'reviewed). Never present an individual as verified — there is no technical '
  'way to prove an individual grew what they photographed, and pretending '
  'otherwise is the one thing that would make the whole map untrustworthy.';


-- ── COARSE LOCATION ─────────────────────────────────────────────────────────
-- Owner decision (2026-08-19): a location is REQUIRED, but street-level
-- precision is NEVER forced. City/state is a complete answer — a backyard
-- grower should not have to publish their home address to join.
--
-- ⚠️ THIS IS WHY latitude/longitude ARE MADE NULLABLE. They were `not null` in
--    Step 1, which silently assumed every farm has a pin. A city-precision farm
--    has no pin until someone geocodes it, and there is no geocoder in the
--    approval trigger. The CHECK below keeps the real invariant: a farm always
--    has SOME location — either coordinates or a written address.
alter table public.farms alter column latitude  drop not null;
alter table public.farms alter column longitude drop not null;

alter table public.farms
  add column if not exists location_precision text not null default 'exact'
    check (location_precision in ('city', 'exact'));

comment on column public.farms.location_precision is
  'How precise this farm''s location is. city = address/coordinates are no '
  'finer than city+state. exact = a real pin. Anything drawing a map marker '
  'must handle NULL coordinates rather than assuming a pin exists.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'farms_has_some_location'
  ) then
    alter table public.farms add constraint farms_has_some_location check (
      (latitude is not null and longitude is not null)
      or (address is not null and length(btrim(address)) > 0)
    );
  end if;
end $$;


-- ── farm_media.storage_bucket ───────────────────────────────────────────────
-- Application photos are uploaded BEFORE a farm exists, so they cannot land in
-- the `farm-media` bucket — that bucket's policies authorise by farm id, and an
-- applicant has no farm yet. They go to `farm-application-media` instead, and
-- approval copies the ROW rather than the bytes (a Postgres trigger cannot move
-- an object between buckets).
--
-- ⚠️ 2B'S ALBUM READER MUST USE THIS COLUMN to build its URL. Assuming
--    'farm-media' will 404 on every photo that came in with an application.
alter table public.farm_media
  add column if not exists storage_bucket text not null default 'farm-media'
    check (storage_bucket in ('farm-media', 'farm-application-media'));

comment on column public.farm_media.storage_bucket is
  'Which bucket storage_path lives in. Rows seeded from an application point at '
  'farm-application-media; everything uploaded later is farm-media.';


-- ════════════════════════════════════════════════════════════════════════════
-- 1. farm_applications
-- ════════════════════════════════════════════════════════════════════════════

create table if not exists public.farm_applications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,

  -- Self-selected first step of applying. Drives what must be uploaded and
  -- whether a human reviews it.
  farm_type text not null check (farm_type in ('individual', 'verified_farm')),

  -- ── Proposed farm fields ─────────────────────────────────────────────────
  -- These BECOME the farms row on approval. They live here so a farmer never
  -- types their farm's details twice.
  farm_name text not null check (length(btrim(farm_name)) > 0),
  description text,
  address text,
  latitude double precision check (latitude between -90 and 90),
  longitude double precision check (longitude between -180 and 180),
  location_precision text not null default 'city'
    check (location_precision in ('city', 'exact')),

  -- Coarse buckets, never a number. Owner decision: a grower should not have to
  -- measure their yard to sign up, and an exact acreage is not worth anything
  -- to anyone reading it.
  size text not null check (size in (
    '<0.25 acre', '0.25-2 acre', '2-10 acre', '10-50 acre', '50+ acre'
  )),

  contact_name text not null check (length(btrim(contact_name)) > 0),
  contact_phone text,
  contact_email text,

  -- The real human filter. Everything else can be typed by anyone; this is
  -- where a reviewer can tell whether someone actually grows things.
  about_text text not null check (length(btrim(about_text)) > 0),

  -- Optional website / Instagram / market listing. A jsonb array of
  -- {label, url} — a child table would be three joins for something nobody
  -- queries across applications.
  links jsonb not null default '[]'::jsonb check (jsonb_typeof(links) = 'array'),

  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'withdrawn')),

  -- Written by the owner when rejecting, and SHOWN TO THE APPLICANT. A
  -- rejection without a reason is the fastest way to lose a real farmer.
  review_note text,
  reviewed_at timestamptz,
  reviewed_by uuid references public.profiles (id) on delete set null,

  -- Set by the approval trigger. Its presence is what makes approval
  -- IDEMPOTENT: a second flip to `approved` finds it already set and stops.
  created_farm_id uuid references public.farms (id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists farm_applications_profile_idx
  on public.farm_applications (profile_id, created_at desc);
create index if not exists farm_applications_status_idx
  on public.farm_applications (status) where status = 'pending';

-- ⚠️ ANTI-ABUSE, HALF ONE: at most ONE in-flight application per person.
-- Partial unique index rather than a trigger, so it holds under concurrency.
-- Rejected/withdrawn/approved rows are excluded, which is what lets a rejected
-- applicant edit and resubmit without it counting as a second application.
create unique index if not exists farm_applications_one_pending_per_profile
  on public.farm_applications (profile_id) where status = 'pending';

drop trigger if exists farm_applications_touch on public.farm_applications;
create trigger farm_applications_touch before update on public.farm_applications
  for each row execute function public.touch_updated_at();


-- ════════════════════════════════════════════════════════════════════════════
-- 2. farm_application_documents — verified_farm ONLY, PRIVATE
-- ════════════════════════════════════════════════════════════════════════════
--
-- Arbitrary supporting material: land deed, lease, county ag registration,
-- market stall proof, certification, photos of the operation. Images or PDFs.
--
-- ⚠️ DELIBERATELY UNTYPED. No document_type enum, no fixed checklist. US
--    small-farm paperwork is wildly inconsistent and a dropdown would block the
--    very first real farmer. Helper copy guides; a human judges.
create table if not exists public.farm_application_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.farm_applications (id) on delete cascade,
  storage_path text not null,
  mime_type text,
  original_filename text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists farm_application_documents_app_idx
  on public.farm_application_documents (application_id, sort_order);


-- ════════════════════════════════════════════════════════════════════════════
-- 3. farm_application_media — BOTH tiers, becomes the public album
-- ════════════════════════════════════════════════════════════════════════════
--
-- Photos of the plants / animals / land the applicant wants on the app. These
-- are COPIED INTO farm_media on approval (§5), which seeds the public album and
-- is what makes the unlock gate (farm_members present AND farm_media >= 1) pass
-- the moment an individual is approved.
create table if not exists public.farm_application_media (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null
    references public.farm_applications (id) on delete cascade,
  storage_path text not null,
  mime_type text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists farm_application_media_app_idx
  on public.farm_application_media (application_id, sort_order);


-- ════════════════════════════════════════════════════════════════════════════
-- 4. ELIGIBILITY — anti-abuse, one farm per person
-- ════════════════════════════════════════════════════════════════════════════

-- Owner decision: an account may own AT MOST ONE farm. Once it holds an `owner`
-- row in farm_members it can never apply again.
create or replace function public.owns_a_farm(target uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.farm_members m
    where m.profile_id = target and m.role = 'owner'
  );
$$;

/**
 * Why this profile may or may not apply right now.
 *
 * Returns json: { ok: boolean, reason: text }. `reason` is a machine code, not
 * a sentence — the app owns the wording so it can be changed without a
 * migration.
 */
create or replace function public.farm_application_eligibility(target uuid)
returns json
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if target is null then
    return json_build_object('ok', false, 'reason', 'not_signed_in');
  end if;

  if public.owns_a_farm(target) then
    return json_build_object('ok', false, 'reason', 'already_owns_farm');
  end if;

  if exists (
    select 1 from public.farm_applications a
    where a.profile_id = target and a.status = 'pending'
  ) then
    return json_build_object('ok', false, 'reason', 'application_pending');
  end if;

  return json_build_object('ok', true, 'reason', 'eligible');
end;
$$;

-- The same two limits, enforced in the database so no client path can dodge
-- them. The partial unique index above already stops a second pending row;
-- this catches the "already owns a farm" half and gives a readable error.
create or replace function public.enforce_farm_application_limits()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.owns_a_farm(new.profile_id) then
    raise exception 'This account already has a farm.'
      using errcode = 'check_violation';
  end if;

  /* ⚠️ EVERY APPLICATION STARTS `pending`, whatever the client sent.
   *
   * The RLS UPDATE policy already refuses a client-written `approved`, but the
   * INSERT policy only checks ownership — so without this an applicant could
   * insert a row that claims to be approved. It would not create a farm (the
   * approval trigger is on UPDATE), which is exactly what makes it nasty: the
   * app would show them an "approved" screen for a farm that does not exist.
   *
   * The review fields are cleared for the same reason: they are the reviewer's
   * words, and nobody writes their own verdict. */
  new.status := 'pending';
  new.review_note := null;
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.created_farm_id := null;
  return new;
end;
$$;

drop trigger if exists farm_applications_limits on public.farm_applications;
create trigger farm_applications_limits
  before insert on public.farm_applications
  for each row execute function public.enforce_farm_application_limits();


-- ════════════════════════════════════════════════════════════════════════════
-- 5. THE APPROVAL PATH — shared, tier-aware, IDEMPOTENT
-- ════════════════════════════════════════════════════════════════════════════

/** A url-safe slug, uniquified against existing farms. */
create or replace function public.farm_slug_from(name text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  base text;
  candidate text;
  n integer := 1;
begin
  base := regexp_replace(lower(btrim(coalesce(name, ''))), '[^a-z0-9]+', '-', 'g');
  base := btrim(base, '-');
  if base = '' then base := 'farm'; end if;
  base := left(base, 48);

  candidate := base;
  while exists (select 1 from public.farms f where f.slug = candidate) loop
    n := n + 1;
    candidate := base || '-' || n::text;
  end loop;
  return candidate;
end;
$$;

/**
 * Runs when an application's status becomes `approved` — automatically for an
 * individual (see submit_farm_application) and on the owner's manual flip in
 * the Supabase dashboard for a verified farm. ONE path for both tiers; only the
 * timing differs.
 *
 * It must:
 *   1. create the farms row from the application,
 *   2. make the applicant its owner in farm_members,
 *   3. copy farm_application_media into farm_media — the album seed, and what
 *      makes the unlock gate pass immediately.
 *
 * IDEMPOTENT: `created_farm_id` is the latch. Flipping the status to approved a
 * second time finds it set and does nothing, so no second farm, no second
 * membership and no duplicated photos.
 */
create or replace function public.apply_farm_application_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_farm_id uuid;
begin
  if new.status is distinct from 'approved' then
    return new;
  end if;

  -- Already approved once. Do nothing at all.
  if new.created_farm_id is not null then
    return new;
  end if;

  insert into public.farms (
    name, slug, description, created_by,
    latitude, longitude, address, location_precision, farm_type,
    is_active, is_demo
  )
  values (
    new.farm_name,
    public.farm_slug_from(new.farm_name),
    new.description,
    new.profile_id,
    new.latitude,
    new.longitude,
    -- The location CHECK on farms needs one of the two. A city-precision
    -- application always carries an address, so this is belt-and-braces.
    coalesce(new.address, 'Location not published'),
    new.location_precision,
    new.farm_type,
    true,
    false
  )
  returning id into new_farm_id;

  insert into public.farm_members (farm_id, profile_id, role)
  values (new_farm_id, new.profile_id, 'owner')
  on conflict (farm_id, profile_id) do nothing;

  -- Seed the public album. Rows are copied, not bytes: the objects stay in the
  -- application bucket, which is why farm_media carries storage_bucket.
  insert into public.farm_media (farm_id, media_type, storage_path, storage_bucket, mime_type, sort_order)
  select
    new_farm_id,
    'image',
    m.storage_path,
    'farm-application-media',
    m.mime_type,
    m.sort_order
  from public.farm_application_media m
  where m.application_id = new.id;

  new.created_farm_id := new_farm_id;
  new.reviewed_at := coalesce(new.reviewed_at, now());
  return new;
end;
$$;

drop trigger if exists farm_applications_approve on public.farm_applications;
create trigger farm_applications_approve
  before update of status on public.farm_applications
  for each row
  when (new.status = 'approved' and old.status is distinct from 'approved')
  execute function public.apply_farm_application_approval();


/**
 * Submit an application that has finished uploading its photos and documents.
 *
 * This exists because the tier decides what "submit" MEANS, and because an
 * individual is auto-approved the instant they submit — which can only happen
 * AFTER the media rows exist, or the approval trigger would seed an empty album
 * and the unlock gate would fail on a farm that has photos.
 *
 * Returns json { ok, status, reason }.
 */
create or replace function public.submit_farm_application(application_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  app public.farm_applications;
  media_count integer;
begin
  select * into app from public.farm_applications a
  where a.id = application_id and a.profile_id = auth.uid();

  if app.id is null then
    return json_build_object('ok', false, 'reason', 'not_found');
  end if;

  if app.status not in ('pending', 'rejected') then
    return json_build_object('ok', false, 'reason', 'not_editable', 'status', app.status);
  end if;

  if public.owns_a_farm(app.profile_id) then
    return json_build_object('ok', false, 'reason', 'already_owns_farm');
  end if;

  select count(*) into media_count
  from public.farm_application_media m where m.application_id = app.id;

  -- Both tiers must show what they grow. It is also the album seed, so an
  -- application with no photos would approve into a farm that fails the unlock
  -- gate it was supposed to satisfy.
  if media_count < 1 then
    return json_build_object('ok', false, 'reason', 'needs_photo');
  end if;

  if app.farm_type = 'individual' then
    -- Auto-approved: no human step. The trigger above does the rest.
    update public.farm_applications
      set status = 'approved', review_note = null
      where id = app.id;
    return json_build_object('ok', true, 'status', 'approved');
  end if;

  -- verified_farm: a person reads it. Back to pending if this was a resubmit.
  update public.farm_applications
    set status = 'pending', review_note = null, reviewed_at = null, reviewed_by = null
    where id = app.id;
  return json_build_object('ok', true, 'status', 'pending');
end;
$$;


/** Withdraw one's own pending application. */
create or replace function public.withdraw_farm_application(application_id uuid)
returns json
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.farm_applications
    set status = 'withdrawn'
    where id = application_id
      and profile_id = auth.uid()
      and status = 'pending';

  if not found then
    return json_build_object('ok', false, 'reason', 'not_withdrawable');
  end if;
  return json_build_object('ok', true, 'status', 'withdrawn');
end;
$$;


-- ════════════════════════════════════════════════════════════════════════════
-- 6. RLS
-- ════════════════════════════════════════════════════════════════════════════

alter table public.farm_applications          enable row level security;
alter table public.farm_application_documents enable row level security;
alter table public.farm_application_media     enable row level security;

-- An applicant sees ONLY their own applications. There is no reviewer role in
-- the app: the owner reviews in the Supabase dashboard, where service-role
-- bypasses RLS entirely.
drop policy if exists "read own applications" on public.farm_applications;
create policy "read own applications"
  on public.farm_applications for select
  to authenticated
  using (profile_id = auth.uid());

drop policy if exists "create own application" on public.farm_applications;
create policy "create own application"
  on public.farm_applications for insert
  to authenticated
  with check (profile_id = auth.uid());

-- Editable only while it is still theirs to change. An approved or withdrawn
-- application is a historical record and is frozen.
--
-- ⚠️ Status is NOT self-settable to 'approved' here: the WITH CHECK forbids it,
--    so the only route to approval is submit_farm_application (individuals) or
--    the owner in the dashboard (verified farms).
drop policy if exists "edit own open application" on public.farm_applications;
create policy "edit own open application"
  on public.farm_applications for update
  to authenticated
  using (profile_id = auth.uid() and status in ('pending', 'rejected'))
  with check (profile_id = auth.uid() and status in ('pending', 'rejected', 'withdrawn'));

-- Child rows follow the parent, and only while it is still open.
drop policy if exists "read own application documents" on public.farm_application_documents;
create policy "read own application documents"
  on public.farm_application_documents for select
  to authenticated
  using (exists (
    select 1 from public.farm_applications a
    where a.id = application_id and a.profile_id = auth.uid()
  ));

drop policy if exists "write own application documents" on public.farm_application_documents;
create policy "write own application documents"
  on public.farm_application_documents for all
  to authenticated
  using (exists (
    select 1 from public.farm_applications a
    where a.id = application_id and a.profile_id = auth.uid()
      and a.status in ('pending', 'rejected')
  ))
  with check (exists (
    select 1 from public.farm_applications a
    where a.id = application_id and a.profile_id = auth.uid()
      and a.status in ('pending', 'rejected')
  ));

drop policy if exists "read own application media" on public.farm_application_media;
create policy "read own application media"
  on public.farm_application_media for select
  to authenticated
  using (exists (
    select 1 from public.farm_applications a
    where a.id = application_id and a.profile_id = auth.uid()
  ));

drop policy if exists "write own application media" on public.farm_application_media;
create policy "write own application media"
  on public.farm_application_media for all
  to authenticated
  using (exists (
    select 1 from public.farm_applications a
    where a.id = application_id and a.profile_id = auth.uid()
      and a.status in ('pending', 'rejected')
  ))
  with check (exists (
    select 1 from public.farm_applications a
    where a.id = application_id and a.profile_id = auth.uid()
      and a.status in ('pending', 'rejected')
  ));


-- ════════════════════════════════════════════════════════════════════════════
-- 7. STORAGE — one PRIVATE bucket, one public-eligible bucket
-- ════════════════════════════════════════════════════════════════════════════
--
-- Path convention for BOTH, authorised on the first segment:
--     <profile_id>/<application_id>/<uuid>.<ext>
--
-- The applicant has no farm yet, so authorisation keys off the PERSON. That is
-- the whole reason these cannot use the existing farm-media bucket.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  -- ⚠️ PRIVATE. Land deeds, leases and registrations are identity/ownership
  -- documents. They must never be publicly readable, must never get a public
  -- URL, and must never be handed to another user via a signed URL.
  ('farm-application-docs', 'farm-application-docs', false, 26214400,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf']),

  -- Public-read: these photos are destined for the public farm album, and
  -- approval copies the row while the bytes stay here.
  ('farm-application-media', 'farm-application-media', true, 26214400,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;


-- ── Documents: the applicant, and nobody else ───────────────────────────────
drop policy if exists "read own application docs" on storage.objects;
create policy "read own application docs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'farm-application-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "upload own application docs" on storage.objects;
create policy "upload own application docs"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'farm-application-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own application docs" on storage.objects;
create policy "delete own application docs"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'farm-application-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ── Application photos: public read, own-folder write ───────────────────────
drop policy if exists "public read application media" on storage.objects;
create policy "public read application media"
  on storage.objects for select
  using (bucket_id = 'farm-application-media');

drop policy if exists "upload own application media" on storage.objects;
create policy "upload own application media"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'farm-application-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "delete own application media" on storage.objects;
create policy "delete own application media"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'farm-application-media'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
