-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — Row Level Security
--
-- RLS is enabled on EVERY table. The anon/publishable key ships inside the app,
-- so these policies are the only thing standing between a curious user and the
-- whole database.
--
-- Shape of the rules:
--   • The farm catalog (farms, plots, adoptables, media) is readable by any
--     signed-in user — that is the discovery surface.
--   • Plot updates are readable ONLY by farm staff and by users with an ACTIVE
--     adoption in that plot. The fan-out rule is enforced here, not in the app.
--   • A user reads their own adoptions, ledgers and referrals. Nobody else's.
--   • Ledgers have NO insert policy: they are written by SECURITY DEFINER
--     triggers only. A client cannot mint Seeds.
--   • Reserved transactional tables get NO policies at all → deny by default.
-- ════════════════════════════════════════════════════════════════════════════

alter table public.profiles                     enable row level security;
alter table public.farms                        enable row level security;
alter table public.farm_media                   enable row level security;
alter table public.farm_members                 enable row level security;
alter table public.plots                        enable row level security;
alter table public.adoptables                   enable row level security;
alter table public.adoptions                    enable row level security;
alter table public.plot_updates                 enable row level security;
alter table public.plot_update_media            enable row level security;
alter table public.growth_ledger                enable row level security;
alter table public.seeds_ledger                 enable row level security;
alter table public.referrals                    enable row level security;

alter table public.payments                     enable row level security;
alter table public.donations                    enable row level security;
alter table public.rewards                      enable row level security;
alter table public.redemptions                  enable row level security;
alter table public.quests                       enable row level security;
alter table public.quest_completions            enable row level security;
alter table public.collection                   enable row level security;
alter table public.impact_events                enable row level security;
alter table public.farm_events                  enable row level security;
alter table public.farm_volunteer_opportunities enable row level security;
alter table public.farm_produce                 enable row level security;
alter table public.farm_contacts                enable row level security;
alter table public.creatures                    enable row level security;
alter table public.user_creatures               enable row level security;


-- ── profiles ────────────────────────────────────────────────────────────────
create policy "read own profile"
  on public.profiles for select
  to authenticated
  using (id = auth.uid());

-- A farmer's name has to render on the update they posted, so profiles of farm
-- staff are readable. Nothing else about other users is exposed.
create policy "read profiles of farm staff"
  on public.profiles for select
  to authenticated
  using (exists (select 1 from public.farm_members m where m.profile_id = profiles.id));

-- Balance columns are additionally protected by the guard trigger in
-- 20260817000300_*.sql, so this policy cannot be used to grant Seeds.
create policy "update own profile"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- No insert policy: profiles are created by the handle_new_user trigger.
-- No delete policy: deleting the auth user cascades.


-- ── farm catalog (read for everyone signed in, write for farm staff) ────────
create policy "read active farms"
  on public.farms for select
  to authenticated
  using (is_active or public.is_farm_member(id));

create policy "farm staff manage their farm"
  on public.farms for update
  to authenticated
  using (public.is_farm_member(id))
  with check (public.is_farm_member(id));

create policy "read farm media"
  on public.farm_media for select
  to authenticated
  using (exists (select 1 from public.farms f where f.id = farm_id and f.is_active));

create policy "farm staff manage farm media"
  on public.farm_media for all
  to authenticated
  using (public.is_farm_member(farm_id))
  with check (public.is_farm_member(farm_id));

create policy "read own farm memberships"
  on public.farm_members for select
  to authenticated
  using (profile_id = auth.uid() or public.is_farm_member(farm_id));

create policy "read plots"
  on public.plots for select
  to authenticated
  using (exists (select 1 from public.farms f where f.id = farm_id and f.is_active));

create policy "farm staff manage plots"
  on public.plots for all
  to authenticated
  using (public.is_farm_member(farm_id))
  with check (public.is_farm_member(farm_id));

create policy "read adoptables"
  on public.adoptables for select
  to authenticated
  using (exists (
    select 1 from public.plots p join public.farms f on f.id = p.farm_id
     where p.id = plot_id and f.is_active
  ));

create policy "farm staff manage adoptables"
  on public.adoptables for all
  to authenticated
  using (exists (
    select 1 from public.plots p where p.id = plot_id and public.is_farm_member(p.farm_id)
  ))
  with check (exists (
    select 1 from public.plots p where p.id = plot_id and public.is_farm_member(p.farm_id)
  ));


-- ── adoptions ───────────────────────────────────────────────────────────────
create policy "read own adoptions"
  on public.adoptions for select
  to authenticated
  using (user_id = auth.uid());

-- Farm staff need to see who adopted what in their own plots.
create policy "farm staff read adoptions on their adoptables"
  on public.adoptions for select
  to authenticated
  using (exists (
    select 1 from public.adoptables ad join public.plots p on p.id = ad.plot_id
     where ad.id = adoptable_id and public.is_farm_member(p.farm_id)
  ));

-- The user may rename their own adoptable. Creating an adoption is deliberately
-- NOT client-writable: it must spend Seeds atomically, which lands in Step 3 as
-- a SECURITY DEFINER function.
create policy "rename own adoption"
  on public.adoptions for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());


-- ── plot updates — THE FAN-OUT RULE ─────────────────────────────────────────
create policy "adopters and farm staff read plot updates"
  on public.plot_updates for select
  to authenticated
  using (
    public.receives_updates_for_plot(plot_id)
    or exists (select 1 from public.plots p where p.id = plot_id and public.is_farm_member(p.farm_id))
  );

create policy "farm staff post plot updates"
  on public.plot_updates for all
  to authenticated
  using (exists (
    select 1 from public.plots p where p.id = plot_id and public.is_farm_member(p.farm_id)
  ))
  with check (exists (
    select 1 from public.plots p where p.id = plot_id and public.is_farm_member(p.farm_id)
  ));

create policy "read media of readable plot updates"
  on public.plot_update_media for select
  to authenticated
  using (exists (
    select 1 from public.plot_updates u
     where u.id = plot_update_id
       and (
         public.receives_updates_for_plot(u.plot_id)
         or exists (select 1 from public.plots p
                     where p.id = u.plot_id and public.is_farm_member(p.farm_id))
       )
  ));

create policy "farm staff manage plot update media"
  on public.plot_update_media for all
  to authenticated
  using (exists (
    select 1 from public.plot_updates u join public.plots p on p.id = u.plot_id
     where u.id = plot_update_id and public.is_farm_member(p.farm_id)
  ))
  with check (exists (
    select 1 from public.plot_updates u join public.plots p on p.id = u.plot_id
     where u.id = plot_update_id and public.is_farm_member(p.farm_id)
  ));


-- ── the two economies — READ ONLY from the client, always ───────────────────
-- Deliberately no INSERT/UPDATE/DELETE policies. Ledger rows are written only
-- by SECURITY DEFINER functions. This is what makes "Seeds cannot be bought"
-- structurally true rather than a convention.
create policy "read own growth ledger"
  on public.growth_ledger for select
  to authenticated
  using (profile_id = auth.uid());

create policy "read own seeds ledger"
  on public.seeds_ledger for select
  to authenticated
  using (profile_id = auth.uid());


-- ── referrals ───────────────────────────────────────────────────────────────
-- Both sides can see the referral they are part of. Writes happen only in
-- handle_new_user().
create policy "read referrals i am part of"
  on public.referrals for select
  to authenticated
  using (referrer_id = auth.uid() or referred_id = auth.uid());


-- ════════════════════════════════════════════════════════════════════════════
-- RESERVED TABLES
--
-- The farm profile sub-tables are V1.0 read-only display, so they get SELECT.
-- Everything transactional or progression-related gets NO policy: RLS is on and
-- no policy exists, so every client request returns nothing and every write is
-- refused. That is the correct state for "reserved, not activated" — the
-- relationships exist, the behaviour does not.
-- ════════════════════════════════════════════════════════════════════════════

create policy "read farm events"
  on public.farm_events for select to authenticated
  using (exists (select 1 from public.farms f where f.id = farm_id and f.is_active));

create policy "read volunteer opportunities"
  on public.farm_volunteer_opportunities for select to authenticated
  using (exists (select 1 from public.farms f where f.id = farm_id and f.is_active));

create policy "read farm produce"
  on public.farm_produce for select to authenticated
  using (exists (select 1 from public.farms f where f.id = farm_id and f.is_active));

create policy "read farm contacts"
  on public.farm_contacts for select to authenticated
  using (exists (select 1 from public.farms f where f.id = farm_id and f.is_active));

-- A user may read their own reserved rows so My World can show a real (empty)
-- state rather than an error. There is still no way to write any of them.
create policy "read own impact events"
  on public.impact_events for select to authenticated using (profile_id = auth.uid());

create policy "read own collection"
  on public.collection for select to authenticated using (profile_id = auth.uid());

create policy "read own quest completions"
  on public.quest_completions for select to authenticated using (profile_id = auth.uid());

create policy "read own creatures"
  on public.user_creatures for select to authenticated using (profile_id = auth.uid());

-- payments, donations, rewards, redemptions, quests, creatures: no policies.
-- Deny by default until their feature is actually built.
