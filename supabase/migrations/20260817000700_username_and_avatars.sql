-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — Spec B: real usernames and real avatars
--
-- Turns the two sign-up stubs into working features:
--   • profiles.username — unique, case-insensitive, format-checked, not reserved
--   • an `avatars` Storage bucket — public read, write only your own folder
--
-- Additive only. Nothing from Step 1 is altered.
-- ════════════════════════════════════════════════════════════════════════════


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Reserved usernames                                                       │
-- │                                                                          │
-- │ The configurable list. To add a name later, redefine this function in a  │
-- │ new migration — the CHECK constraint below picks the change up for all   │
-- │ future writes. IMMUTABLE is required for use inside a CHECK.             │
-- │                                                                          │
-- │ Keep in sync with RESERVED_USERNAMES in src/features/auth/username.ts,   │
-- │ which is what gives the user an instant inline message.                  │
-- └──────────────────────────────────────────────────────────────────────────┘
create or replace function public.is_reserved_username(candidate text)
returns boolean
language sql
immutable
as $$
  select lower(trim(candidate)) = any (array[
    'admin', 'administrator', 'root', 'system', 'support', 'help', 'official',
    'farmfromhere', 'mod', 'moderator', 'staff', 'api', 'null', 'undefined'
  ]);
$$;


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ profiles.username                                                        │
-- └──────────────────────────────────────────────────────────────────────────┘
alter table public.profiles add column if not exists username text;

comment on column public.profiles.username is
  'The user''s public identity, stored as typed. Uniqueness and login are both '
  'case-insensitive — see the profiles_username_lower_key index. 3-32 chars, '
  'letters/digits/underscore only.';

-- Format and length. Letters, digits, underscore; 3-32 inclusive.
alter table public.profiles
  add constraint profiles_username_format
  check (username is null or username ~ '^[A-Za-z0-9_]{3,32}$');

-- Reserved names are refused at the database, not only in the form, so a direct
-- API call cannot claim "admin".
alter table public.profiles
  add constraint profiles_username_not_reserved
  check (username is null or not public.is_reserved_username(username));

-- CASE-INSENSITIVE UNIQUENESS, enforced by the database.
-- An expression index rather than a second lowercase column: one column, no way
-- for the two to drift apart, and the application-level availability check can
-- never win a race against it — a concurrent duplicate fails here.
create unique index profiles_username_lower_key
  on public.profiles (lower(username))
  where username is not null;


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Persisting the username chosen at sign-up                                │
-- │                                                                          │
-- │ Email sign-up with confirmation switched on leaves the user with NO       │
-- │ session, so the app cannot write the username itself — RLS would refuse.  │
-- │ It therefore travels as auth metadata and is copied across here.          │
-- │                                                                          │
-- │ A separate AFTER INSERT trigger on profiles rather than editing           │
-- │ handle_new_user: replacing that function would mean restating its whole   │
-- │ body in this migration, and two copies of the signup grants is exactly    │
-- │ how they drift apart.                                                     │
-- │                                                                          │
-- │ If the name was taken in the seconds since the form checked, the unique   │
-- │ index raises and the signup fails rather than silently dropping the name. │
-- └──────────────────────────────────────────────────────────────────────────┘
create or replace function public.apply_username_from_metadata()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  candidate text;
begin
  select nullif(trim(u.raw_user_meta_data ->> 'username'), '')
    into candidate
    from auth.users u
   where u.id = new.id;

  if candidate is not null then
    update public.profiles set username = candidate where id = new.id;
  end if;

  return null;
end;
$$;

create trigger profiles_apply_username
  after insert on public.profiles
  for each row execute function public.apply_username_from_metadata();


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Availability check (used by the sign-up form)                            │
-- │                                                                          │
-- │ SECURITY DEFINER because RLS deliberately stops a user reading anyone     │
-- │ else's profile — without this the form would report every taken name as   │
-- │ free. It returns only a boolean, which is the same thing any signup form  │
-- │ inevitably reveals.                                                       │
-- └──────────────────────────────────────────────────────────────────────────┘
create or replace function public.is_username_available(candidate text)
returns boolean
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  normalised text := lower(trim(candidate));
begin
  if normalised is null or normalised = '' then return false; end if;
  if normalised !~ '^[a-z0-9_]{3,32}$' then return false; end if;
  if public.is_reserved_username(normalised) then return false; end if;

  return not exists (
    select 1 from public.profiles where lower(username) = normalised
  );
end;
$$;

revoke all on function public.is_username_available(text) from public;
-- `anon` too: the sign-up form runs before the user has a session.
grant execute on function public.is_username_available(text) to anon, authenticated;


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ ⚠️⚠️  USERNAME → EMAIL LOOKUP — KNOWN PRIVACY EXPOSURE  ⚠️⚠️              │
-- │                                                                          │
-- │ Supabase cannot sign in by username, so username login has to resolve to  │
-- │ an email first. This function does that, and it must be callable BEFORE   │
-- │ the user is authenticated — which means:                                  │
-- │                                                                          │
-- │   ANYONE CAN TURN A USERNAME INTO THAT PERSON'S EMAIL ADDRESS.            │
-- │   Given a list of usernames, an attacker harvests the matching mailboxes. │
-- │                                                                          │
-- │ The owner accepted this on 2026-08-17 to ship username login now. It is   │
-- │ NOT acceptable at launch.                                                 │
-- │                                                                          │
-- │ 🚧 BLOCKER BEFORE PUBLIC LAUNCH: replace this with an Edge Function that  │
-- │    takes username + password, resolves and signs in with the service role │
-- │    server-side, and returns only a session. Then drop this function and   │
-- │    revoke anon execute. Until that happens, treat every user's email as   │
-- │    discoverable from their username.                                      │
-- │                                                                          │
-- │ Damage limitation in the meantime: it takes ONE exact username and        │
-- │ returns at most ONE row. It cannot list, prefix-match or page — so this   │
-- │ is a lookup, never a dump.                                                │
-- └──────────────────────────────────────────────────────────────────────────┘
create or replace function public.email_for_username(candidate text)
returns jsonb
language plpgsql
security definer
stable
set search_path = public
as $$
declare
  normalised text := lower(trim(candidate));
  found_id uuid;
  found_email text;
  has_password boolean;
begin
  if normalised is null or normalised = '' then
    return jsonb_build_object('found', false);
  end if;

  select p.id into found_id
    from public.profiles p
   where lower(p.username) = normalised
   limit 1;

  if found_id is null then
    return jsonb_build_object('found', false);
  end if;

  select u.email, (u.encrypted_password is not null and u.encrypted_password <> '')
    into found_email, has_password
    from auth.users u
   where u.id = found_id;

  -- `has_password` lets the app say "this account uses a social login" instead
  -- of an unexplained failure. Without it, a Google-only user typing their
  -- username and any password just sees "wrong details" forever.
  return jsonb_build_object(
    'found', true,
    'email', found_email,
    'has_password', coalesce(has_password, false)
  );
end;
$$;

revoke all on function public.email_for_username(text) from public;
grant execute on function public.email_for_username(text) to anon, authenticated;


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Avatars bucket                                                           │
-- │                                                                          │
-- │ PUBLIC READ on purpose: an avatar is a display asset that other people    │
-- │ are meant to see in community. This is a different thing from the Step 2  │
-- │ application documents, which are sensitive and belong in a private bucket.│
-- │ Never put anything private in here.                                       │
-- │                                                                          │
-- │ Path convention — authorisation keys off the first segment:               │
-- │     avatars/<profile_id>/<uuid>.jpg                                       │
-- └──────────────────────────────────────────────────────────────────────────┘
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars', 'avatars', true, 5242880,  -- 5 MB, matching AVATAR_MAX_BYTES
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do nothing;

create policy "public read avatars"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- You may only write inside a folder named with your own id.
create policy "write own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "replace own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "delete own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Where the avatar reference lives                                         │
-- │                                                                          │
-- │ Reusing the existing profiles.avatar_url column from Step 1 rather than   │
-- │ adding another. NOTE it holds the STORAGE PATH, not an absolute URL:      │
-- │ absolute URLs embed the project ref and break on restore or on a move     │
-- │ between staging and production. Build the public URL at read time —       │
-- │ see avatarPublicUrl() in src/features/profile/avatar.ts.                  │
-- └──────────────────────────────────────────────────────────────────────────┘
comment on column public.profiles.avatar_url is
  'Storage PATH inside the public `avatars` bucket, e.g. "<profile_id>/<uuid>.jpg". '
  'NOT an absolute URL — build that at read time so the value survives a project move.';
