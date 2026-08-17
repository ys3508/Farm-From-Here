-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — RESERVED TABLES
--
-- These exist so the relationships are locked in now and a later feature does
-- not force a relationship migration across the core spine.
--
--   RESERVED MEANS: create the table and the foreign keys. Implement NO logic,
--   NO triggers, NO client behaviour. (CLAUDE.md invariant 9.)
--
-- Nothing in the app writes to any table in this file in V1.0. RLS is enabled on
-- all of them in 20260817000400_rls.sql; the transactional ones get no policies
-- at all, which means deny-by-default until their feature is built.
--
-- Deliberately NOT created (add later without touching core relationships):
--   community, a standalone milestone table, a standalone species table,
--   farmer payouts, inventory, notifications.
-- ════════════════════════════════════════════════════════════════════════════


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ TRANSACTIONS / REAL MONEY — deferred until the owner has contracted farms │
-- │ and payments set up. No Stripe, no settlement logic in V1.0.              │
-- │                                                                          │
-- │ Money and Seeds meet in exactly one direction: real money spent on real   │
-- │ farm support MAY reward Seeds. Money never converts into Seeds directly,  │
-- │ and no table here is allowed to become a Seeds vending machine.           │
-- └──────────────────────────────────────────────────────────────────────────┘

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  provider text,                       -- 'stripe' when wired
  provider_payment_id text,
  status text,                         -- vocabulary set when payments are built
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.donations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete restrict,
  farm_id uuid references public.farms (id) on delete set null,
  adoptable_id uuid references public.adoptables (id) on delete set null,
  payment_id uuid references public.payments (id) on delete set null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'usd',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Redeemable catalog items. NOT activated: no merchants are onboarded in V1.0.
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid references public.farms (id) on delete cascade,
  title text not null,
  description text,
  seeds_cost integer not null check (seeds_cost > 0),
  is_active boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Seeds spent on a reward. When activated, this MUST write a seeds_ledger row
-- (source 'redemption') rather than touching profiles.seeds_balance.
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  reward_id uuid not null references public.rewards (id) on delete restrict,
  seeds_ledger_id uuid references public.seeds_ledger (id) on delete set null,
  status text,
  redeemed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ PROGRESSION — quests and collection.                                     │
-- │ Quests are intended to become a primary Seeds-earning entry point and to  │
-- │ unlock collection, so both links are reserved now.                       │
-- └──────────────────────────────────────────────────────────────────────────┘

create table public.quests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  -- Reward columns are reserved; payouts must still route through the ledgers.
  growth_reward integer not null default 0 check (growth_reward >= 0),
  seeds_reward integer not null default 0 check (seeds_reward >= 0),
  is_active boolean not null default false,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.quest_completions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  quest_id uuid not null references public.quests (id) on delete cascade,
  completed_at timestamptz not null default now(),
  growth_ledger_id uuid references public.growth_ledger (id) on delete set null,
  seeds_ledger_id uuid references public.seeds_ledger (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (profile_id, quest_id)
);

-- Achievements / collection entries.
create table public.collection (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  item_slug text not null,
  item_type text,                      -- vocabulary set when collection is built
  unlocked_at timestamptz not null default now(),
  source_quest_id uuid references public.quests (id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now(),
  unique (profile_id, item_slug)
);


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ IMPACT — the real-world outcomes ledger.                                 │
-- │                                                                          │
-- │ IMPACT IS NOT SEEDS. Seeds are in-game currency; Impact is what actually  │
-- │ happened in the world (a tree supported, dollars to a farm, volunteer     │
-- │ hours, pounds of local produce). Never derive one from the other and      │
-- │ never render Impact as a Seeds figure.                                   │
-- └──────────────────────────────────────────────────────────────────────────┘

create table public.impact_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  impact_type text not null,           -- e.g. 'tree_supported', 'volunteer_hours'
  amount numeric not null,
  unit text not null,                  -- e.g. 'tree', 'usd', 'hours', 'lbs'
  -- The action that produced this outcome (an adoption, a donation, a shift).
  reference_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index impact_events_profile_idx
  on public.impact_events (profile_id, created_at desc);


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ FARM PROFILE SUB-TABLES — V1.0 is READ-ONLY DISPLAY. No transactions.    │
-- └──────────────────────────────────────────────────────────────────────────┘

create table public.farm_events (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farm_volunteer_opportunities (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  title text not null,
  description text,
  starts_at timestamptz,
  ends_at timestamptz,
  slots integer check (slots is null or slots >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.farm_produce (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  name text not null,
  description text,
  -- How you can actually get it, per the spec's availability list.
  availability text check (availability in ('online_purchase', 'u_pick', 'in_season')),
  season_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Contact info for a farm or a specific member of its staff.
create table public.farm_contacts (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farms (id) on delete cascade,
  farm_member_id uuid references public.farm_members (id) on delete set null,
  label text,
  email text,
  phone text,
  website text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);


-- ┌──────────────────────────────────────────────────────────────────────────┐
-- │ COMPANION CREATURES — schema reserved, ZERO interactivity in V1.0.       │
-- │ Feeding will SPEND GROWTH via growth_ledger. Never Seeds, never money.   │
-- │ Creatures are earned through real-world action, never purchased.         │
-- │ Dialogue (AI layer) and desktop presence are V2+.                        │
-- └──────────────────────────────────────────────────────────────────────────┘

create table public.creatures (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  rarity text,                         -- vocabulary set when creatures are built
  -- How it is obtained: real-world action or collection/quest. NOT purchase.
  obtain_method text,
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_creatures (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  creature_id uuid not null references public.creatures (id) on delete cascade,
  nickname text,
  feed_level integer not null default 0 check (feed_level >= 0),
  state text,
  obtained_at timestamptz not null default now(),
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, creature_id)
);

create index user_creatures_profile_idx on public.user_creatures (profile_id);


-- updated_at triggers for the reserved tables that carry the column.
create trigger payments_touch before update on public.payments
  for each row execute function public.touch_updated_at();
create trigger donations_touch before update on public.donations
  for each row execute function public.touch_updated_at();
create trigger rewards_touch before update on public.rewards
  for each row execute function public.touch_updated_at();
create trigger redemptions_touch before update on public.redemptions
  for each row execute function public.touch_updated_at();
create trigger quests_touch before update on public.quests
  for each row execute function public.touch_updated_at();
create trigger farm_events_touch before update on public.farm_events
  for each row execute function public.touch_updated_at();
create trigger farm_volunteer_opportunities_touch before update on public.farm_volunteer_opportunities
  for each row execute function public.touch_updated_at();
create trigger farm_produce_touch before update on public.farm_produce
  for each row execute function public.touch_updated_at();
create trigger farm_contacts_touch before update on public.farm_contacts
  for each row execute function public.touch_updated_at();
create trigger creatures_touch before update on public.creatures
  for each row execute function public.touch_updated_at();
create trigger user_creatures_touch before update on public.user_creatures
  for each row execute function public.touch_updated_at();
