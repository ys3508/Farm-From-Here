-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — Step 1 core schema
--
-- The live V1.0 spine:
--   profiles → farms → plots → adoptables → adoptions
--   plot_updates fan out at the PLOT level
--   growth_ledger + seeds_ledger are the source of truth for the two economies
--   referrals
--
-- Reserved-but-inactive tables live in 20260817000200_reserved_tables.sql.
-- Triggers, grants and balance enforcement live in 20260817000300_*.sql.
-- Row Level Security lives in 20260817000400_rls.sql.
-- ════════════════════════════════════════════════════════════════════════════

create extension if not exists "pgcrypto";

-- Shared updated_at trigger function, used by every table below.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ── profiles ────────────────────────────────────────────────────────────────
-- Extends Supabase Auth. ONE profile serves both roles: the same real person can
-- be a player and a farmer. There is no separate farmer table.
--
-- NOTE: no latitude/longitude here. User location is dynamic and is fetched at
-- render time, never persisted. Farm coordinates ARE persisted — farms are real
-- fixed places.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,

  -- CACHED BALANCES. The ledgers are the source of truth. These columns are
  -- maintained exclusively by the ledger triggers; a guard trigger rejects any
  -- other write. Never UPDATE these directly — insert a ledger row.
  growth_xp integer not null default 0 check (growth_xp >= 0),
  seeds_balance integer not null default 0 check (seeds_balance >= 0),

  referral_code text not null unique,
  -- The code this user typed in BEFORE signing up, kept for audit. The actual
  -- relationship lives in `referrals`.
  referred_by_code text,

  is_guest boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.profiles.growth_xp is
  'CACHE of growth_ledger. User-facing name is "Growth", never "XP".';
comment on column public.profiles.seeds_balance is
  'CACHE of seeds_ledger. Seeds can never be purchased with money.';

create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();


-- ── farms ───────────────────────────────────────────────────────────────────
-- V1.0 = ONLY real, contracted farms. Never import third-party farm data.
-- `is_demo` exists so the Step 1 seed fixture can be rendered during development
-- and then deleted in one statement without ever being mistaken for a real farm.
create table public.farms (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  -- Nullable so a farm can be seeded/imported before its owner has an account.
  created_by uuid references public.profiles (id) on delete set null,

  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),

  address text,
  is_active boolean not null default true,
  is_demo boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on column public.farms.is_demo is
  'TRUE only for development fixtures. Real contracted farms are always FALSE. '
  'The app hides demo farms unless EXPO_PUBLIC_SHOW_DEMO_DATA is enabled.';

create index farms_active_idx on public.farms (is_active) where is_active;
create trigger farms_touch before update on public.farms
  for each row execute function public.touch_updated_at();


-- ── farm_media ──────────────────────────────────────────────────────────────
-- A gallery, not a single photo field. Files live in Supabase Storage; this
-- table holds the object path plus ordering.
create table public.farm_media (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  mime_type text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index farm_media_farm_idx on public.farm_media (farm_id, sort_order);
create trigger farm_media_touch before update on public.farm_media
  for each row execute function public.touch_updated_at();


-- ── farm_members ────────────────────────────────────────────────────────────
-- One farm, several farmers/staff. This is the authorisation basis for the
-- Step 2 farmer backend: RLS checks membership here.
create table public.farm_members (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  role text not null check (role in ('owner', 'farmer', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, profile_id)
);

create index farm_members_profile_idx on public.farm_members (profile_id);
create trigger farm_members_touch before update on public.farm_members
  for each row execute function public.touch_updated_at();


-- ── plots ───────────────────────────────────────────────────────────────────
-- The farmer's operational unit and the fan-out hinge of the whole product.
-- Farmers post updates HERE, not on individual adoptables, so a farmer's
-- workload scales with plots, not with adopters.
create table public.plots (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  -- Human-readable label the farmer actually uses out in the field ("North Row").
  plot_id text not null,
  name text,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (farm_id, plot_id)
);

create index plots_farm_idx on public.plots (farm_id);
create trigger plots_touch before update on public.plots
  for each row execute function public.touch_updated_at();


-- ── adoptables ──────────────────────────────────────────────────────────────
-- Generalised from "trees": tree / crop / animal move through ONE funnel.
-- Apple tree is the V1.0 hero; crop and animal are a schema exercise only.
--
-- `identifier` is the real-world identity ("#1048"). It lives here and never
-- changes. The user's chosen pet name lives on adoptions.display_name.
create table public.adoptables (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.plots (id) on delete cascade,
  identifier text not null,
  type text not null check (type in ('tree', 'crop', 'animal')),
  species text,

  -- Owner-specified values (2026-08-17), implemented verbatim.
  -- ⚑ FLAG: this set mixes availability (available/adopted/inactive) with
  --   health/life-stage (growing/thriving); a single column holds only one at a
  --   time. If both axes must be true at once, that needs a second `health`
  --   column and a migration. Raised with the owner, not silently redesigned.
  status text not null default 'available'
    check (status in ('available', 'adopted', 'growing', 'thriving', 'inactive')),

  -- Per-item price override. NULL means "use the configurable constant for this
  -- type" (src/config/economy.ts ADOPTION_COST_SEEDS). Spending is NOT activated
  -- until Step 3.
  seeds_cost_override integer check (seeds_cost_override is null or seeds_cost_override > 0),

  planted_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- The real identity is unique within its plot.
  unique (plot_id, identifier)
);

create index adoptables_plot_idx on public.adoptables (plot_id);
create index adoptables_status_idx on public.adoptables (status);
create trigger adoptables_touch before update on public.adoptables
  for each row execute function public.touch_updated_at();


-- ── adoptions ───────────────────────────────────────────────────────────────
-- Adoption and donation share this table and the same backend funnel — do NOT
-- split them.
create table public.adoptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  adoptable_id uuid not null references public.adoptables (id) on delete cascade,

  -- Owner-decided 2026-08-17.
  type text not null default 'adoption' check (type in ('adoption', 'donation')),
  -- pending = tapped adopt, not yet confirmed
  -- active  = live relationship; ONLY these receive the plot-update fan-out
  -- ended   = over (cancelled, season finished, adoptable retired)
  status text not null default 'pending' check (status in ('pending', 'active', 'ended')),

  -- The name THIS user gives THEIR adoptable. Per-user, deliberately not on
  -- `adoptables` — the real item's identity (#1048) never changes.
  display_name text,

  seeds_spent integer not null default 0 check (seeds_spent >= 0),
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One real tree cannot be actively adopted by two people at once.
create unique index adoptions_one_active_per_adoptable
  on public.adoptions (adoptable_id)
  where status = 'active' and type = 'adoption';

create index adoptions_user_idx on public.adoptions (user_id, status);
create index adoptions_adoptable_idx on public.adoptions (adoptable_id);
create trigger adoptions_touch before update on public.adoptions
  for each row execute function public.touch_updated_at();


-- ── plot_updates ────────────────────────────────────────────────────────────
-- Attaches to the PLOT. One update fans out to every user holding an active
-- adoption on any adoptable in that plot.
create table public.plot_updates (
  id uuid primary key default gen_random_uuid(),
  plot_id uuid not null references public.plots (id) on delete cascade,
  -- Who posted it — the basis of the Step 2 farmer backend and of attribution.
  author_id uuid references public.profiles (id) on delete set null,
  text text not null,
  milestone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- The fan-out read path is: adoptions(user) → adoptables(plot) → plot_updates.
-- This index serves the final hop ordered newest-first; adoptions_user_idx and
-- adoptables_plot_idx serve the first two.
create index plot_updates_plot_created_idx
  on public.plot_updates (plot_id, created_at desc);

create trigger plot_updates_touch before update on public.plot_updates
  for each row execute function public.touch_updated_at();


-- ── plot_update_media ───────────────────────────────────────────────────────
-- Multiple photos/videos per update. Never a single `photo` column.
create table public.plot_update_media (
  id uuid primary key default gen_random_uuid(),
  plot_update_id uuid not null references public.plot_updates (id) on delete cascade,
  media_type text not null check (media_type in ('image', 'video')),
  storage_path text not null,
  mime_type text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index plot_update_media_update_idx
  on public.plot_update_media (plot_update_id, sort_order);
create trigger plot_update_media_touch before update on public.plot_update_media
  for each row execute function public.touch_updated_at();


-- ── growth_ledger ───────────────────────────────────────────────────────────
-- SOURCE OF TRUTH for Growth. profiles.growth_xp is a cache of sum(amount).
-- Growth is progression: it only rises in V1.0 and is never spent. `amount` is
-- signed anyway because V2 creature feeding will debit Growth through this same
-- ledger — that is the only planned negative source.
create table public.growth_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount <> 0),
  source text not null check (source in (
    'signup',             -- ACTIVE in V1.0
    'daily_movement',     -- reserved: 5,000 steps → 25 Growth, not wired
    'quest_completion',   -- reserved
    'adoption',           -- reserved
    'farm_visit',         -- reserved
    'admin_adjustment'
  )),
  reference_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index growth_ledger_profile_idx
  on public.growth_ledger (profile_id, created_at desc);


-- ── seeds_ledger ────────────────────────────────────────────────────────────
-- SOURCE OF TRUTH for Seeds — ONE table for both earning and spending.
-- Do NOT add separate earnings/spending tables.
--
-- Seeds cannot be bought with money. There is deliberately no 'purchase' source
-- in this vocabulary, and adding one would violate the product's core principle.
create table public.seeds_ledger (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  amount integer not null check (amount <> 0),
  type text not null check (type in ('earn', 'spend')),
  source text not null check (source in (
    'signup_bonus',       -- ACTIVE in V1.0
    'referral',           -- ACTIVE in V1.0
    'daily_movement',     -- reserved: 5,000 steps → 25 Seeds, not wired
    'quest_completion',   -- reserved
    'adoption',           -- reserved (spend) — activates in Step 3
    'redemption',         -- reserved (spend) — V2 rewards catalog
    'admin_adjustment'
  )),
  reference_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now(),

  -- Sign and type must agree, so sum(amount) is always the true balance.
  constraint seeds_ledger_sign_matches_type check (
    (type = 'earn' and amount > 0) or (type = 'spend' and amount < 0)
  )
);

create index seeds_ledger_profile_idx
  on public.seeds_ledger (profile_id, created_at desc);


-- ── referrals ───────────────────────────────────────────────────────────────
-- Reward is 500 Seeds to EACH side, granted only after the new user completes
-- signup. Entering a code alone rewards nothing. Both grants go through
-- seeds_ledger — never by mutating a balance.
create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referred_id uuid not null references public.profiles (id) on delete cascade,
  code text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- A person can be referred exactly once, and never by themselves.
  unique (referred_id),
  constraint referrals_no_self_referral check (referrer_id <> referred_id),
  -- A completed referral must record when it paid out.
  constraint referrals_completed_has_timestamp check (
    status <> 'completed' or rewarded_at is not null
  )
);

create index referrals_referrer_idx on public.referrals (referrer_id);
create trigger referrals_touch before update on public.referrals
  for each row execute function public.touch_updated_at();
