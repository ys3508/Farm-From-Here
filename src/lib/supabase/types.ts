/**
 * Database types.
 *
 * Hand-written to match supabase/migrations/. Once the Supabase CLI is installed
 * this file can be regenerated instead:
 *
 *     supabase gen types typescript --linked > src/lib/supabase/types.ts
 *
 * Until then, KEEP IT IN SYNC WITH THE MIGRATIONS BY HAND. Only the tables the
 * client actually queries are fully typed; reserved tables are typed thin
 * because V1.0 never writes to them.
 */
import type {
  AdoptableStatus,
  AdoptableType,
  AdoptionStatus,
  AdoptionType,
  GrowthSource,
  SeedsSource,
} from '@/config/economy';

export type Profile = {
  id: string;
  display_name: string | null;
  /** Public identity. Unique case-insensitively; 3–32 letters/digits/underscore. */
  username: string | null;
  /**
   * Storage PATH inside the public `avatars` bucket — NOT an absolute URL.
   * Build the URL with avatarPublicUrl() so the value survives a project move.
   */
  avatar_url: string | null;
  /** CACHE of growth_ledger. Called "Growth" in the UI, never "XP". */
  growth_xp: number;
  /** CACHE of seeds_ledger. */
  seeds_balance: number;
  referral_code: string;
  referred_by_code: string | null;
  is_guest: boolean;
  created_at: string;
  updated_at: string;
};

export type Farm = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_by: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  is_active: boolean;
  is_demo: boolean;
  created_at: string;
  updated_at: string;
};

export type FarmMedia = {
  id: string;
  farm_id: string;
  media_type: 'image' | 'video';
  storage_path: string;
  mime_type: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type FarmMember = {
  id: string;
  farm_id: string;
  profile_id: string;
  role: 'owner' | 'farmer' | 'staff';
  created_at: string;
  updated_at: string;
};

export type Plot = {
  id: string;
  farm_id: string;
  plot_id: string;
  name: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type Adoptable = {
  id: string;
  plot_id: string;
  /** Real-world identity, e.g. "#1048". Never changes, never per-user. */
  identifier: string;
  type: AdoptableType;
  species: string | null;
  status: AdoptableStatus;
  seeds_cost_override: number | null;
  planted_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type Adoption = {
  id: string;
  user_id: string;
  adoptable_id: string;
  type: AdoptionType;
  status: AdoptionStatus;
  /** The pet name THIS user gave it. Per-user; the identity stays on adoptables. */
  display_name: string | null;
  seeds_spent: number;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  updated_at: string;
};

export type PlotUpdate = {
  id: string;
  plot_id: string;
  author_id: string | null;
  text: string;
  milestone: string | null;
  created_at: string;
  updated_at: string;
};

export type PlotUpdateMedia = {
  id: string;
  plot_update_id: string;
  media_type: 'image' | 'video';
  storage_path: string;
  mime_type: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type GrowthLedgerEntry = {
  id: string;
  profile_id: string;
  amount: number;
  source: GrowthSource;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type SeedsLedgerEntry = {
  id: string;
  profile_id: string;
  amount: number;
  type: 'earn' | 'spend';
  source: SeedsSource;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export type Referral = {
  id: string;
  referrer_id: string;
  referred_id: string;
  code: string;
  status: 'pending' | 'completed';
  rewarded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ImpactEvent = {
  id: string;
  profile_id: string;
  impact_type: string;
  amount: number;
  unit: string;
  reference_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

/**
 * Table shapes as supabase-js expects them. Every entry needs Row, Insert,
 * Update AND Relationships — omit any one and the client quietly falls back to
 * an untyped schema, so every query silently becomes `any` and nothing in this
 * file protects you.
 *
 * `ReadOnly` gives a table an uninhabited Insert/Update, which turns an attempt
 * to write it into a compile error. That is how the RLS rules are mirrored into
 * the type system: the ledgers are readable and never writable from the client.
 */
type ReadOnly<T> = {
  Row: T;
  Insert: Record<string, never>;
  Update: Record<string, never>;
  Relationships: [];
};
type Writable<T, W extends Record<string, unknown>> = {
  Row: T;
  Insert: W;
  Update: Partial<W>;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Writable<Profile, Partial<Profile> & { id: string }>;
      farms: ReadOnly<Farm>;
      farm_media: ReadOnly<FarmMedia>;
      farm_members: ReadOnly<FarmMember>;
      plots: ReadOnly<Plot>;
      adoptables: ReadOnly<Adoptable>;
      // Renaming your own adoption is allowed by RLS; creating one is not —
      // that spends Seeds and lands in Step 3 as a SECURITY DEFINER function.
      adoptions: Writable<Adoption, Partial<Adoption> & { id: string }>;
      plot_updates: ReadOnly<PlotUpdate>;
      plot_update_media: ReadOnly<PlotUpdateMedia>;
      // Ledgers are READ-ONLY from the client, by RLS. Writes happen only in
      // SECURITY DEFINER triggers. Typing them read-only makes that a compile error.
      growth_ledger: ReadOnly<GrowthLedgerEntry>;
      seeds_ledger: ReadOnly<SeedsLedgerEntry>;
      referrals: ReadOnly<Referral>;
      impact_events: ReadOnly<ImpactEvent>;
    };
    Views: Record<string, never>;
    Functions: {
      /**
       * Settles a referral for an OAuth signup, which cannot carry metadata
       * through the provider. Email/Guest signups are handled by
       * handle_new_user() instead. Returns { ok, reason? }.
       */
      claim_referral_code: {
        Args: { input_code: string };
        Returns: { ok: boolean; reason?: string; seeds_awarded?: number };
      };
      /**
       * True when a username is free AND passes format and reserved-word rules.
       * SECURITY DEFINER, because RLS stops a user from reading anyone else's
       * profile — a plain query would report every taken name as available.
       */
      is_username_available: {
        Args: { candidate: string };
        Returns: boolean;
      };
      /**
       * ⚠️ Resolves a username to its account's email so username login can
       * work. Callable before sign-in, which means anyone can turn a username
       * into an email address. Accepted for now; see the warning block in
       * migration 20260817000700 — this must be replaced by a server-side
       * Edge Function before public launch.
       */
      email_for_username: {
        Args: { candidate: string };
        Returns: { found: boolean; email?: string; has_password?: boolean };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
