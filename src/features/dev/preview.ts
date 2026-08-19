import type { Session } from '@supabase/supabase-js';

import type { Farm, GrowthLedgerEntry, Profile, SeedsLedgerEntry } from '@/lib/supabase/types';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * PREVIEW MODE — walk every screen without signing up.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Turn on by putting this in .env.local, then restarting with `npx expo start -c`:
 *
 *     EXPO_PUBLIC_PREVIEW_MODE=true
 *
 * It fakes a signed-in account with sample content so screens can be reviewed
 * fully populated — empty states hide most layout problems.
 *
 * ⚠️ IT CANNOT SHIP. The gate below requires `__DEV__`, which is false in any
 * production build, so even leaving the variable set in a release build does
 * nothing. Every screen also shows a PREVIEW pill while it is on, so a
 * screenshot can never be mistaken for real data.
 *
 * Nothing here touches real auth. AuthProvider checks this flag first and
 * returns fixtures; every other code path is exactly as it was.
 */
export const isPreviewMode =
  __DEV__ && process.env.EXPO_PUBLIC_PREVIEW_MODE === 'true';

const NOW = '2026-08-17T12:00:00.000Z';

/** A stand-in session. Never sent anywhere — nothing here is a valid token. */
export const previewSession = {
  access_token: 'preview-mode-not-a-real-token',
  refresh_token: 'preview-mode-not-a-real-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: {
    id: '00000000-0000-4000-8000-00000000a001',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'preview@example.com',
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: NOW,
  },
} as unknown as Session;

export const previewProfile: Profile = {
  id: previewSession.user.id,
  display_name: 'Preview Owner',
  username: 'preview_owner',
  avatar_url: null,
  growth_xp: 1240,
  seeds_balance: 860,
  referral_code: 'PREVIEW1',
  referred_by_code: null,
  is_guest: false,
  created_at: NOW,
  updated_at: NOW,
};

/**
 * ════════════════════════════════════════════════════════════════════════════
 * IS THE PREVIEW ACCOUNT A FARMER?
 * ════════════════════════════════════════════════════════════════════════════
 *
 * The Farmer World (revise/2026-08-19-farmer-world-and-tabs.md) only exists for
 * a profile with a `farm_members` row, so preview mode has to pick a side. It
 * defaults to FARMER, because that is the side with screens to review — the
 * whole two-panel canvas and the farmer tab bar are invisible otherwise.
 *
 * To review the pure-consumer side instead (no Farmer World, right toggle opens
 * the application entry), put this in .env.local and restart with -c:
 *
 *     EXPO_PUBLIC_PREVIEW_FARMER=false
 *
 * The application entry stays reachable from the /dev index either way.
 */
export const previewIsFarmer = process.env.EXPO_PUBLIC_PREVIEW_FARMER !== 'false';

/**
 * The fake `farm_members` answer. Points at the sample farm below, whose name
 * begins with "PREVIEW —" so a screenshot of the farmer dashboard can never be
 * mistaken for a real signed farm (CLAUDE.md invariant 6).
 */
export const previewFarmMembership: {
  member: { id: string; farm_id: string; role: 'owner' | 'farmer' | 'staff' } | null;
  farmName: string | null;
} = previewIsFarmer
  ? {
      member: { id: 'preview-membership-1', farm_id: 'preview-farm-1', role: 'owner' },
      farmName: 'PREVIEW — Willow Bend Orchard',
    }
  : { member: null, farmName: null };

/**
 * Sample farms. Named so nobody can mistake them for signed farms — CLAUDE.md
 * invariant 6 forbids presenting invented farm data as real, and the whole
 * point of preview mode is that it is obviously not real.
 */
export const previewFarms: Farm[] = [
  {
    id: 'preview-farm-1',
    name: 'PREVIEW — Willow Bend Orchard',
    slug: 'preview-willow-bend',
    description:
      'Sample data for design review. Not a real farm and not under contract — this row exists only in preview mode.',
    created_by: null,
    latitude: 37.8044,
    longitude: -122.2712,
    address: 'Sample data — no real address',
    farm_type: 'verified_farm',
    location_precision: 'exact',
    is_active: true,
    is_demo: true,
    created_at: NOW,
    updated_at: NOW,
  },
  {
    id: 'preview-farm-2',
    name: 'PREVIEW — Marsh Lane Market Garden',
    slug: 'preview-marsh-lane',
    description: 'Sample data for design review. Not a real farm.',
    created_by: null,
    // Deliberately NULL: a city-precision grower has no pin, and preview mode
    // should show that case rather than only the happy one.
    latitude: null,
    longitude: null,
    address: 'Oakland, CA — sample data, no real address',
    // A community grower at city precision — the coarse-location case the map
    // and every future pin renderer has to handle.
    farm_type: 'individual',
    location_precision: 'city',
    is_active: true,
    is_demo: true,
    created_at: NOW,
    updated_at: NOW,
  },
];

export const previewGrowthLedger: GrowthLedgerEntry[] = [
  { id: 'pg1', profile_id: previewProfile.id, amount: 100, source: 'signup', reference_id: null, metadata: null, created_at: NOW },
  { id: 'pg2', profile_id: previewProfile.id, amount: 25, source: 'daily_movement', reference_id: null, metadata: null, created_at: NOW },
  { id: 'pg3', profile_id: previewProfile.id, amount: 40, source: 'farm_visit', reference_id: null, metadata: null, created_at: NOW },
];

export const previewSeedsLedger: SeedsLedgerEntry[] = [
  { id: 'ps1', profile_id: previewProfile.id, amount: 500, type: 'earn', source: 'signup_bonus', reference_id: null, metadata: null, created_at: NOW },
  { id: 'ps2', profile_id: previewProfile.id, amount: 500, type: 'earn', source: 'referral', reference_id: null, metadata: null, created_at: NOW },
  { id: 'ps3', profile_id: previewProfile.id, amount: -500, type: 'spend', source: 'adoption', reference_id: null, metadata: null, created_at: NOW },
  { id: 'ps4', profile_id: previewProfile.id, amount: 25, type: 'earn', source: 'daily_movement', reference_id: null, metadata: null, created_at: NOW },
];

/** Every screen in the app, for the preview index at /dev. */
export const PREVIEW_SCREENS: { path: string; title: string; note: string }[] = [
  { path: '/splash', title: 'Splash', note: '3s intro. Shows "Welcome home :)" when a session exists on the device.' },
  { path: '/(auth)/sign-in', title: 'Login', note: 'Email / username / phone in one field.' },
  { path: '/(auth)/sign-up', title: 'Sign up', note: 'Three-step wizard. Step 2 is skipped on the third-party path.' },
  {
    path: '/(app)/world',
    title: 'My World',
    note: 'The living canvas. Starts with the box; onboarding grants the first life.',
  },
  { path: '/(app)/farm', title: 'Farm', note: 'Locked narrative placeholder — USE SEEDS.' },
  { path: '/(app)/quest', title: 'Quest', note: 'Locked narrative placeholder — GROW SEEDS.' },
  { path: '/(app)/community', title: 'Community', note: 'Locked narrative placeholder — posts.' },
  {
    path: '/(app)/map',
    title: 'Map',
    note: 'Stylised map with real distance text. Route kept, but no longer a tab.',
  },
  { path: '/(app)/profile', title: 'Profile', note: 'Avatar, username, referral code, sign out.' },
  {
    path: '/(app)/post',
    title: 'Post (farmer)',
    note: 'Farmer tab slot 2. Placeholder — the real 30-second update flow is Step 2.',
  },
  {
    path: '/(app)/balance',
    title: 'Seeds & Growth',
    note: 'Read-only detail behind the balance pill. Opens from either world.',
  },
  {
    path: '/(app)/apply',
    title: 'Farmer application',
    note:
      'What a NON-farmer gets from the right toggle. Real Step-2A flow: tier choice, form, ' +
      'review/rejected/approved states. Preview has no backend, so nothing submits.',
  },
  { path: '/setup', title: 'Setup', note: 'Shown when Supabase is not configured.' },
];
