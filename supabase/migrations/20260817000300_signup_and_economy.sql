-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — signup, the two economies, and referral accounting
--
-- Enforces the product's hardest invariant at the DATABASE level, not in app
-- code: a balance can never move without a ledger row.
--   • ledger INSERT  → trigger updates the cached balance on profiles
--   • profiles UPDATE that touches a balance any other way → RAISES
-- ════════════════════════════════════════════════════════════════════════════


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Balance guard — profiles.growth_xp / seeds_balance are CACHES            │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- The ledger triggers below set the transaction-local flag `app.ledger_write`
-- before touching a balance. Any other write path — a client UPDATE, a stray
-- admin query, a future feature that forgets the rule — hits this and fails
-- loudly instead of silently desynchronising the ledger from the balance.
create or replace function public.guard_balance_columns()
returns trigger
language plpgsql
as $$
begin
  if (new.growth_xp is distinct from old.growth_xp
      or new.seeds_balance is distinct from old.seeds_balance)
     and coalesce(current_setting('app.ledger_write', true), 'off') <> 'on'
  then
    raise exception
      'profiles.growth_xp and profiles.seeds_balance are caches of growth_ledger '
      'and seeds_ledger. Insert a ledger row instead of updating the balance.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_balances
  before update on public.profiles
  for each row execute function public.guard_balance_columns();


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Ledger → cache synchronisation                                           │
-- └──────────────────────────────────────────────────────────────────────────┘

create or replace function public.apply_growth_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('app.ledger_write', 'on', true);   -- true = transaction-local
  update public.profiles
     set growth_xp = growth_xp + new.amount
   where id = new.profile_id;
  perform set_config('app.ledger_write', 'off', true);
  return null;
end;
$$;

create trigger growth_ledger_applies_to_profile
  after insert on public.growth_ledger
  for each row execute function public.apply_growth_ledger_entry();


create or replace function public.apply_seeds_ledger_entry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  current_balance integer;
begin
  -- Lock the profile row so two concurrent spends cannot both pass the check.
  select seeds_balance into current_balance
    from public.profiles where id = new.profile_id for update;

  if current_balance is null then
    raise exception 'No profile % for seeds_ledger entry', new.profile_id;
  end if;

  if current_balance + new.amount < 0 then
    raise exception
      'Insufficient Seeds: balance % cannot absorb % (source %)',
      current_balance, new.amount, new.source
      using errcode = 'check_violation';
  end if;

  perform set_config('app.ledger_write', 'on', true);
  update public.profiles
     set seeds_balance = current_balance + new.amount
   where id = new.profile_id;
  perform set_config('app.ledger_write', 'off', true);
  return null;
end;
$$;

create trigger seeds_ledger_applies_to_profile
  after insert on public.seeds_ledger
  for each row execute function public.apply_seeds_ledger_entry();


-- Ledgers are append-only. History is the audit trail; editing it is never
-- correct — post a compensating 'admin_adjustment' entry instead.
create or replace function public.reject_ledger_mutation()
returns trigger
language plpgsql
as $$
begin
  raise exception 'Ledger rows are append-only. Post a compensating entry instead.'
    using errcode = 'check_violation';
end;
$$;

create trigger growth_ledger_append_only
  before update or delete on public.growth_ledger
  for each row execute function public.reject_ledger_mutation();

create trigger seeds_ledger_append_only
  before update or delete on public.seeds_ledger
  for each row execute function public.reject_ledger_mutation();


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Referral codes                                                           │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- 8 characters from an alphabet with no 0/O/1/I/L — codes get read aloud and
-- typed by hand, so ambiguous glyphs cost real signups.
create or replace function public.generate_referral_code()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  candidate text;
  i integer;
begin
  loop
    candidate := '';
    for i in 1..8 loop
      candidate := candidate || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where referral_code = candidate);
  end loop;
  return candidate;
end;
$$;


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Signup                                                                   │
-- └──────────────────────────────────────────────────────────────────────────┘
--
-- Fires when Supabase Auth creates a user, by ANY method — email, Google,
-- Facebook, Twitter, Apple, or anonymous (Guest). One path, so no provider can
-- ever produce a user without a profile and without their opening grants.
--
-- ⚠️ PLACEHOLDER CONSTANTS BELOW — pending owner decision (2026-08-17).
--    These are duplicated in src/config/economy.ts because Postgres cannot read
--    a TypeScript file. IF YOU CHANGE ONE, CHANGE BOTH:
--      signup_growth_grant  ↔ SIGNUP_GROWTH_GRANT
--      signup_seeds_bonus   ↔ SIGNUP_SEEDS_BONUS
--    referral_reward_seeds is NOT a placeholder — 500 is spec-confirmed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  signup_growth_grant   constant integer := 100;   -- ⚠️ PLACEHOLDER
  signup_seeds_bonus    constant integer := 500;   -- ⚠️ PLACEHOLDER
  referral_reward_seeds constant integer := 500;   -- ✅ decided

  new_code       text;
  entered_code   text;
  referrer       uuid;
  new_referral   uuid;
  resolved_name  text;
begin
  new_code := public.generate_referral_code();

  resolved_name := coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  );

  -- The code the user typed on the signup screen, if any. Normalised the same
  -- way generate_referral_code() produces them.
  entered_code := nullif(upper(trim(new.raw_user_meta_data ->> 'referral_code')), '');

  insert into public.profiles (id, display_name, referral_code, referred_by_code, is_guest)
  values (
    new.id,
    resolved_name,
    new_code,
    entered_code,
    coalesce(new.is_anonymous, false)
  );

  -- 1. Opening Growth.
  insert into public.growth_ledger (profile_id, amount, source, metadata)
  values (new.id, signup_growth_grant, 'signup',
          jsonb_build_object('provider', new.raw_app_meta_data ->> 'provider'));

  -- 2. Opening Seeds.
  insert into public.seeds_ledger (profile_id, amount, type, source, metadata)
  values (new.id, signup_seeds_bonus, 'earn', 'signup_bonus',
          jsonb_build_object('provider', new.raw_app_meta_data ->> 'provider'));

  -- 3. Referral, if a valid code was entered. Paid ONLY here — at signup
  --    completion — never when the code is merely typed.
  if entered_code is not null then
    select id into referrer
      from public.profiles
     where referral_code = entered_code
       and id <> new.id                       -- no self-referral
     limit 1;

    if referrer is not null then
      insert into public.referrals (referrer_id, referred_id, code, status, rewarded_at)
      values (referrer, new.id, entered_code, 'completed', now())
      returning id into new_referral;

      -- 500 Seeds to each side, both through the ledger.
      insert into public.seeds_ledger (profile_id, amount, type, source, reference_id, metadata)
      values
        (referrer, referral_reward_seeds, 'earn', 'referral', new_referral,
         jsonb_build_object('role', 'referrer', 'referred_id', new.id)),
        (new.id,   referral_reward_seeds, 'earn', 'referral', new_referral,
         jsonb_build_object('role', 'referred', 'referrer_id', referrer));
    end if;
    -- An unrecognised code is deliberately NOT an error: it must never block a
    -- signup. It stays recorded in profiles.referred_by_code for support.
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ Helpers used by RLS (SECURITY DEFINER to avoid recursive policy checks)  │
-- └──────────────────────────────────────────────────────────────────────────┘

create or replace function public.is_farm_member(target_farm uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.farm_members
     where farm_id = target_farm and profile_id = auth.uid()
  );
$$;

-- True when the signed-in user holds an ACTIVE adoption on any adoptable in the
-- plot. This IS the fan-out rule, expressed once, in the database: one plot
-- update reaches exactly the people with a live relationship to that plot.
create or replace function public.receives_updates_for_plot(target_plot uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
      from public.adoptions a
      join public.adoptables ad on ad.id = a.adoptable_id
     where a.user_id = auth.uid()
       and a.status = 'active'
       and ad.plot_id = target_plot
  );
$$;
