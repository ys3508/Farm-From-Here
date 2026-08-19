import type { FarmSizeBucket, FarmType } from '@/lib/supabase/types';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * FARMER APPLICATION CONFIG — every locked decision, in one readable place.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-step2a-farmer-application.md
 *
 * The values here are OWNER DECISIONS, not defaults to be tuned. Where one
 * mirrors a database CHECK constraint, changing it here alone will produce a
 * runtime constraint violation — change both, in a migration.
 */

/* ────────────────────────────────────────────────────────────────────────────
 * THE TWO TIERS
 *
 * The honest trust model, and the most important thing in this file.
 *
 * V1 has NO technical way to prove that the plants an individual photographs
 * are theirs. So the product does not pretend to verify them. It says what it
 * knows: a community grower can use the app immediately, and "Verified" is
 * reserved for a farm a human actually checked. "Can use it immediately" is
 * NOT the same claim as "verified", and the copy below must never blur that.
 * ──────────────────────────────────────────────────────────────────────────── */

export type TierCopy = {
  /** What the applicant picks. */
  label: string;
  /** One line on who this is for. */
  who: string;
  /** What happens on submit — stated plainly, because it differs by tier. */
  outcome: string;
  /** ⚠️ CONSUMER-FACING trust label. Owner-confirmed 2026-08-19. */
  consumerLabel: string;
};

export const TIERS: Record<FarmType, TierCopy> = {
  individual: {
    label: 'Community grower',
    who: 'A backyard, an allotment, a few pots on a roof. Any scale.',
    outcome: 'You can start straight away — no waiting for review.',
    consumerLabel: 'Community grower',
  },
  verified_farm: {
    label: 'Verified farm',
    who: 'A working farm or orchard, with paperwork to show for it.',
    outcome: 'A person reads your application. That takes a few days.',
    consumerLabel: 'Verified farm',
  },
};

/** Order the tiers are offered in. Lowest barrier first — that is the funnel. */
export const TIER_ORDER: FarmType[] = ['individual', 'verified_farm'];

/* ────────────────────────────────────────────────────────────────────────────
 * SIZE — coarse buckets, never a number
 *
 * ⚠️ These strings are stored verbatim and are mirrored by a CHECK constraint
 * on farm_applications.size. Editing one without the other breaks submission.
 * ──────────────────────────────────────────────────────────────────────────── */

export const SIZE_BUCKETS: { value: FarmSizeBucket; label: string }[] = [
  { value: '<0.25 acre', label: 'Under a quarter acre' },
  { value: '0.25-2 acre', label: 'A quarter to 2 acres' },
  { value: '2-10 acre', label: '2 to 10 acres' },
  { value: '10-50 acre', label: '10 to 50 acres' },
  { value: '50+ acre', label: 'Over 50 acres' },
];

/* ────────────────────────────────────────────────────────────────────────────
 * ANTI-ABUSE — one farm per person
 *
 * Enforced in the database (a partial unique index plus a trigger), not here.
 * These are only the sentences shown when the database says no, keyed by the
 * machine reason it returns. Wording lives in the app so it can change without
 * a migration.
 * ──────────────────────────────────────────────────────────────────────────── */

export const INELIGIBLE_COPY: Record<string, string> = {
  already_owns_farm:
    'This account already has a farm. One farm per person, so the map stays real.',
  application_pending:
    'You already have an application in review. We will come back to you on that one first.',
  not_signed_in: 'You need to be signed in to apply.',
};

/** Shown when the database refuses a submit for a reason the form can fix. */
export const SUBMIT_ERROR_COPY: Record<string, string> = {
  needs_photo: 'Add at least one photo of what you grow before sending this.',
  not_editable: 'This application has already been sent.',
  not_found: 'That application could not be found.',
  already_owns_farm: 'This account already has a farm.',
};

/* ────────────────────────────────────────────────────────────────────────────
 * STORAGE
 * ──────────────────────────────────────────────────────────────────────────── */

/** ⚠️ PRIVATE bucket. Identity/ownership documents. Never a public URL. */
export const APPLICATION_DOCS_BUCKET = 'farm-application-docs';

/** Public-read. These photos become the farm's album on approval. */
export const APPLICATION_MEDIA_BUCKET = 'farm-application-media';

/** Matches the buckets' own file_size_limit. Raise both or neither. */
export const APPLICATION_FILE_MAX_BYTES = 25 * 1024 * 1024;

/** Photos are resized on the device before upload, exactly like avatars. */
export const APPLICATION_PHOTO_MAX_DIMENSION = 1600;
export const APPLICATION_PHOTO_JPEG_QUALITY = 0.85;

/**
 * How many files an applicant may attach. Generous rather than tight — the
 * point of the document list is that we do not know what a given farm's
 * paperwork looks like.
 */
export const MAX_APPLICATION_PHOTOS = 8;
export const MAX_APPLICATION_DOCUMENTS = 12;

/** At least one photo of what you grow. Both tiers. It also seeds the album. */
export const MIN_APPLICATION_PHOTOS = 1;

/* ────────────────────────────────────────────────────────────────────────────
 * COPY the owner may want to rewrite. One place, not scattered through JSX.
 * ──────────────────────────────────────────────────────────────────────────── */

export const APPLICATION_COPY = {
  documentsHelp:
    'A land deed or lease, a state or county agricultural registration, an ' +
    'organic or other certification, a farmers-market listing, photos of the ' +
    'place working — anything that shows this is a real farm and that it is ' +
    'yours. There is no checklist; a person reads it.',
  photosHelp:
    'A few photos of the plants, animals or land you want on the map. These ' +
    'become your farm’s first photos.',
  aboutHelp:
    'What do you grow, and how long have you been at it? Write it how you ' +
    'would say it. This is the part a person actually reads.',
  locationHelp:
    'City and state is enough. A street address is optional — you never have ' +
    'to publish where you live.',
  nameHelpIndividual:
    'Tying it to your own name keeps it yours and avoids clashing with someone else.',
} as const;
