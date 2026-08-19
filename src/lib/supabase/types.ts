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

/** Trust tier. `individual` is NEVER presented to consumers as "verified". */
export type FarmType = 'individual' | 'verified_farm';

/** How precise a farm's published location is. `city` means there is no pin. */
export type LocationPrecision = 'city' | 'exact';

export type Farm = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_by: string | null;
  /**
   * ⚠️ NULLABLE since Step 2A. A city-precision farm has no pin — a backyard
   * grower is not required to publish their home address. Anything drawing a
   * map marker must handle null rather than assuming coordinates exist.
   */
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  farm_type: FarmType;
  location_precision: LocationPrecision;
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
  /**
   * Which bucket `storage_path` lives in. Rows seeded from an application point
   * at `farm-application-media` (approval copies the row, not the bytes);
   * everything uploaded later is `farm-media`. Build URLs from THIS, not from a
   * hardcoded bucket name.
   */
  storage_bucket: 'farm-media' | 'farm-application-media';
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

/* ────────────────────────────────────────────────────────────────────────────
 * STEP 2A — the farmer application
 * Spec: revise/2026-08-19-step2a-farmer-application.md
 * ──────────────────────────────────────────────────────────────────────────── */

export type FarmApplicationStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn';

/** Coarse buckets, never a number. Nobody has to measure their yard to join. */
export type FarmSizeBucket =
  | '<0.25 acre'
  | '0.25-2 acre'
  | '2-10 acre'
  | '10-50 acre'
  | '50+ acre';

export type FarmApplicationLink = { label: string; url: string };

export type FarmApplication = {
  id: string;
  profile_id: string;
  farm_type: FarmType;
  farm_name: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: LocationPrecision;
  size: FarmSizeBucket;
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  about_text: string;
  links: FarmApplicationLink[];
  status: FarmApplicationStatus;
  /** Owner-written rejection reason. Shown to the applicant, verbatim. */
  review_note: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  /** Set by the approval trigger. Its presence is what makes approval idempotent. */
  created_farm_id: string | null;
  created_at: string;
  updated_at: string;
};

/** verified_farm ONLY. Sensitive — lives in a PRIVATE bucket, never public. */
export type FarmApplicationDocument = {
  id: string;
  application_id: string;
  storage_path: string;
  mime_type: string | null;
  original_filename: string | null;
  sort_order: number;
  created_at: string;
};

/** Both tiers. Copied into farm_media on approval — this seeds the album. */
export type FarmApplicationMedia = {
  id: string;
  application_id: string;
  storage_path: string;
  mime_type: string | null;
  sort_order: number;
  created_at: string;
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
 * The creature CATALOG — reference data, not per-user. `slug` is the stable
 * handle the app looks a creature up by (see FIRST_CREATURE_SLUG).
 */
export type Creature = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  rarity: string | null;
  /** How it is obtained — real-world action or gift. NEVER purchase. */
  obtain_method: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

/**
 * A creature this user actually has — one LIFE standing in their world.
 *
 * `world_x` / `world_y` are WORLD coordinates, not screen positions and not
 * slot indices. V1 renders 0–1 across the visible screen; V2's roamable world
 * reuses these rows unchanged. See src/features/world/worldCoords.ts.
 */
export type UserCreature = {
  id: string;
  profile_id: string;
  creature_id: string;
  /** The name THIS user gave it. The creature's own name lives on `creatures`. */
  nickname: string | null;
  /** Reserved for V2 Growth-fed creatures. V1 builds no feeding flow at all. */
  feed_level: number;
  state: string | null;
  obtained_at: string;
  world_x: number | null;
  world_y: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
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
      // An applicant creates and edits their OWN application while it is open.
      // Approval is NOT self-settable — RLS forbids writing status='approved',
      // so the only routes in are submit_farm_application (individuals) and the
      // owner flipping it in the dashboard (verified farms).
      farm_applications: Writable<
        FarmApplication,
        Partial<FarmApplication> & { profile_id: string }
      >;
      farm_application_documents: Writable<
        FarmApplicationDocument,
        Partial<FarmApplicationDocument> & { application_id: string; storage_path: string }
      >;
      farm_application_media: Writable<
        FarmApplicationMedia,
        Partial<FarmApplicationMedia> & { application_id: string; storage_path: string }
      >;
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
      // The creature catalog is public reference data — read-only to everyone.
      creatures: ReadOnly<Creature>;
      // A user may RECEIVE their own creature (the onboarding gift) and
      // reposition or rename it. Granting a creature moves no Seeds, no Growth
      // and no money — it is not a purchase and never touches a ledger.
      //
      // Spelled out rather than built with Writable<> because this is the one
      // table My World reads through an EMBEDDED JOIN
      // (`select('..., creatures(slug, name, metadata)')`). supabase-js resolves
      // an embed from `Relationships`, and the shared helpers all declare that
      // empty — so with `Writable<>` the join would silently type as an error
      // object instead of the catalog row.
      user_creatures: {
        Row: UserCreature;
        Insert: {
          profile_id: string;
          creature_id: string;
          nickname?: string | null;
          world_x?: number | null;
          world_y?: number | null;
          metadata?: Record<string, unknown> | null;
        };
        Update: {
          nickname?: string | null;
          world_x?: number | null;
          world_y?: number | null;
          metadata?: Record<string, unknown> | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_creatures_creature_id_fkey';
            columns: ['creature_id'];
            isOneToOne: false;
            referencedRelation: 'creatures';
            referencedColumns: ['id'];
          },
        ];
      };
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
      /**
       * Whether this profile may apply at all. Enforces the owner's two
       * anti-abuse limits: at most ONE farm per account, and at most ONE
       * in-flight application. `reason` is a machine code — the app owns the
       * wording so it can change without a migration.
       */
      farm_application_eligibility: {
        Args: { target: string };
        Returns: { ok: boolean; reason: string };
      };
      /**
       * Submit a filled-in application. Tier-aware: an `individual` is
       * AUTO-APPROVED here (which fires the approval trigger), a
       * `verified_farm` goes to `pending` for the owner to read.
       *
       * It is an RPC rather than a plain update because approval must happen
       * AFTER the photos exist — the trigger copies them into farm_media, and
       * approving first would seed an empty album.
       */
      submit_farm_application: {
        Args: { application_id: string };
        Returns: { ok: boolean; status?: string; reason?: string };
      };
      /** Withdraw one's own pending application. */
      withdraw_farm_application: {
        Args: { application_id: string };
        Returns: { ok: boolean; status?: string; reason?: string };
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
