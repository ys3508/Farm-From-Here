-- ════════════════════════════════════════════════════════════════════════════
-- FARM FROM HERE — claiming a referral code after an OAuth signup
--
-- WHY THIS EXISTS
-- handle_new_user() reads the referral code out of the new user's metadata,
-- which works for Email and Guest signups because the app supplies that
-- metadata. OAuth signups (Google / Facebook / Twitter / Apple) go out to the
-- provider and come back — there is no way to attach custom metadata on the way
-- through. Without this function, referrals would silently work for two entry
-- points and silently fail for four.
--
-- The app calls this immediately after an OAuth session is established, so from
-- the user's point of view it is still "at signup".
--
-- ⚑ OPEN QUESTION FOR THE OWNER (spec: "any additional referral-eligibility
--   rule"). The only guard implemented is the one already implied by the schema:
--   a person can be referred exactly once, and never by themselves. There is NO
--   time limit — today, an OAuth user who signed up months ago could still
--   claim a code. If you want a window ("only within 24h of signup") or any
--   other eligibility rule, say so and it becomes one extra condition here.
--   Nothing was invented to fill that gap.
-- ════════════════════════════════════════════════════════════════════════════

create or replace function public.claim_referral_code(input_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  referral_reward_seeds constant integer := 500;   -- ✅ decided, matches handle_new_user

  claimant     uuid := auth.uid();
  normalised   text;
  referrer     uuid;
  new_referral uuid;
begin
  if claimant is null then
    return jsonb_build_object('ok', false, 'reason', 'not_authenticated');
  end if;

  normalised := nullif(upper(trim(input_code)), '');
  if normalised is null then
    return jsonb_build_object('ok', false, 'reason', 'empty_code');
  end if;

  -- Referred exactly once, ever.
  if exists (select 1 from public.referrals where referred_id = claimant) then
    return jsonb_build_object('ok', false, 'reason', 'already_referred');
  end if;

  select id into referrer
    from public.profiles
   where referral_code = normalised
     and id <> claimant                       -- no self-referral
   limit 1;

  if referrer is null then
    return jsonb_build_object('ok', false, 'reason', 'unknown_code');
  end if;

  insert into public.referrals (referrer_id, referred_id, code, status, rewarded_at)
  values (referrer, claimant, normalised, 'completed', now())
  returning id into new_referral;

  update public.profiles set referred_by_code = normalised where id = claimant;

  -- 500 Seeds to each side, both through the ledger — never a direct balance write.
  insert into public.seeds_ledger (profile_id, amount, type, source, reference_id, metadata)
  values
    (referrer,  referral_reward_seeds, 'earn', 'referral', new_referral,
     jsonb_build_object('role', 'referrer', 'referred_id', claimant)),
    (claimant,  referral_reward_seeds, 'earn', 'referral', new_referral,
     jsonb_build_object('role', 'referred', 'referrer_id', referrer));

  return jsonb_build_object('ok', true, 'seeds_awarded', referral_reward_seeds);
end;
$$;

revoke all on function public.claim_referral_code(text) from public, anon;
grant execute on function public.claim_referral_code(text) to authenticated;
