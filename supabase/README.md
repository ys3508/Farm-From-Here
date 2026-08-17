# Supabase — applying the Step 1 database

Six migrations plus a seed file. They are **order-dependent**: `..._300` creates triggers on
tables from `..._100`, and `..._400` writes policies for both.

```
20260817000100_core_schema.sql        the live V1.0 spine
20260817000200_reserved_tables.sql    reserved relationships, no behaviour
20260817000300_signup_and_economy.sql triggers: signup grants, ledger→cache, referral
20260817000400_rls.sql                Row Level Security on every table
20260817000500_storage.sql            two Storage buckets + their policies
20260817000600_referral_claim.sql     referral RPC for OAuth signups
seed.sql                              DEVELOPMENT FIXTURE ONLY (see below)
```

## Option A — Supabase CLI (recommended)

Not installed on this Mac yet. Install it, then:

```bash
brew install supabase/tap/supabase
```

Link the project and push (run from the repo root):

```bash
supabase link --project-ref YOUR-PROJECT-REF
```

```bash
supabase db push
```

To reset a **local** database and re-apply everything including the seed:

```bash
supabase db reset
```

`db reset` needs Docker Desktop running. `db push` does not — it talks to the hosted project.

## Option B — the dashboard SQL editor (no CLI needed)

Supabase → SQL Editor → New query. Paste each file's **entire contents** and run them
**one at a time, in the numeric order above**. Then, optionally, `seed.sql`.

This is the fastest path if you just want the app talking to a real database today.

## After the migrations, in the dashboard

1. **Authentication → Providers** — enable Email, and the social providers you have keys for
   (Google, Facebook, Twitter/X, Apple). Client IDs and secrets go here, not in the app.
   See `.env.local.example` for exactly which value each provider needs.
2. **Authentication → Providers → Anonymous sign-ins: ON.** The "Look around as a guest"
   button is a Supabase anonymous sign-in; without this it fails.
3. **Authentication → URL Configuration → Redirect URLs** — add both:
   - `farmfromhere://auth/callback`
   - the `exp://…/--/auth/callback` URL that `npx expo start` prints
4. **Phone provider: leave OFF.** SMS costs money per message and the backend is a deliberate
   stub in V1.0. The UI is built and says so plainly.

## The seed file is a fixture, not a farm

`seed.sql` inserts one farm with `is_demo = true`, one plot, four trees, one crop and one animal,
plus a plot update with two media rows. It exists so Steps 2–7 have something to render.

It is **not a real farm** and the app hides it: `useFarms` filters `is_demo` out unless
`EXPO_PUBLIC_SHOW_DEMO_DATA=true`. The media rows point at storage objects that do not exist —
they prove the shape (many media per update), not real content.

Delete the whole fixture at any time:

```sql
delete from public.farms where is_demo;
```

## What the database enforces on its own

Worth knowing, because these will reject app code that gets it wrong — deliberately:

- **You cannot move a balance without a ledger row.** `profiles.growth_xp` and
  `profiles.seeds_balance` are caches. A direct `UPDATE` to either raises an exception; only the
  ledger triggers may write them.
- **Ledgers are append-only.** `UPDATE`/`DELETE` on `growth_ledger` or `seeds_ledger` raises.
  Corrections are compensating `admin_adjustment` rows.
- **Clients cannot mint Seeds.** The ledger tables have SELECT policies and no INSERT policy at
  all; every write happens inside a `SECURITY DEFINER` function.
- **Seeds cannot go negative.** A spend larger than the balance raises, with the profile row
  locked so two concurrent spends cannot both pass.
- **One active adoption per adoptable.** A partial unique index; two people cannot hold the same
  real tree.
- **Plot updates reach only adopters.** RLS on `plot_updates` uses
  `receives_updates_for_plot()` — the fan-out rule lives in the database, not in a query the app
  could forget to write.
