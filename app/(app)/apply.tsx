import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FARMER_APPLICATION_COPY } from '@/config/farmerWorld';
import { INELIGIBLE_COPY, TIERS, TIER_ORDER } from '@/config/farmerApplication';
import {
  BrandButton,
  BrandText,
  brandColors,
  brandRadius,
  brandSpacing,
} from '@/design/brand';
import { useAuth } from '@/features/auth/AuthProvider';
import { useWorldMode } from '@/features/farmer';
import {
  ApplicationForm,
  applicationsOffline,
  useFarmApplication,
  withdrawApplication,
} from '@/features/farmer/application';
import type { FarmType } from '@/lib/supabase/types';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * BECOMING A FARMER — the whole applicant side, in one route.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-step2a-farmer-application.md §7
 *
 * ⚠️ THIS IS THE SINGLE CANONICAL ENTRY. It is reached from the shell's
 * `Homestead | Grow` toggle when someone who is not yet a farmer taps into
 * Grow. Do NOT add a second "apply" entry point anywhere else — one door means
 * one place to change the copy, and one place a real farmer can be told why
 * they are stuck.
 *
 * It routes on the applicant's own state and nothing else:
 *
 *   ineligible → why not, plainly            none     → pick a tier, then apply
 *   pending    → under review, can withdraw  rejected → the reason, then edit
 *   approved   → the farmer world is open
 *
 * ⚠️ NO ADMIN OR REVIEW UI LIVES HERE, deliberately. One owner reviews a
 * handful of applications in the Supabase dashboard; building a review console
 * for that would be building the wrong thing (spec §4).
 */
export default function FarmerApplicationScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { refreshGate } = useWorldMode();

  const { state, application, media, documents, ineligibleReason, reload } =
    useFarmApplication(profile?.id);

  const [tier, setTier] = useState<FarmType | null>(null);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const pad = { paddingTop: insets.top + brandSpacing.xl };

  /** After an approval the gate must be re-read, or the tabs stay locked. */
  const finish = async (status: string) => {
    setTier(null);
    setEditing(false);
    await reload();
    await refreshGate();
    if (status === 'approved') router.replace('/(app)/world');
  };

  if (state === 'loading') {
    return (
      <View style={[styles.centre, pad]}>
        <ActivityIndicator color={brandColors.primary} />
      </View>
    );
  }

  /* ── The form, once a tier is chosen (or a rejection is being edited) ──── */
  if (profile && (tier || (editing && application))) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <ApplicationForm
          profileId={profile.id}
          farmType={tier ?? application?.farm_type ?? 'individual'}
          existing={editing ? application : null}
          existingMedia={editing ? media : []}
          existingDocuments={editing ? documents : []}
          onSubmitted={(status) => void finish(status)}
          onCancel={() => {
            setTier(null);
            setEditing(false);
          }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[styles.content, pad]}
      showsVerticalScrollIndicator={false}
    >
      {state === 'approved' ? (
        <Approved farmType={application?.farm_type ?? 'individual'} onGo={() => router.replace('/(app)/world')} />
      ) : state === 'pending' ? (
        <UnderReview
          busy={busy}
          notice={notice}
          onWithdraw={async () => {
            if (!application) return;
            setBusy(true);
            setNotice(null);
            const result = await withdrawApplication(application.id);
            setBusy(false);
            if (!result.ok) {
              setNotice('That could not be withdrawn just now.');
              return;
            }
            await reload();
          }}
        />
      ) : state === 'rejected' ? (
        <Rejected note={application?.review_note ?? null} onEdit={() => setEditing(true)} />
      ) : state === 'ineligible' ? (
        <Ineligible reason={ineligibleReason} />
      ) : (
        <PickTier onPick={setTier} />
      )}

      {applicationsOffline ? (
        <View style={styles.note}>
          <BrandText textRole="hint" tone="inkSoft">
            No backend is connected, so nothing here is really submitted. The screens are real;
            the round trip is not.
          </BrandText>
        </View>
      ) : null}

      {router.canGoBack() ? (
        <BrandButton label="Back" variant="link" onPress={() => router.back()} />
      ) : null}
    </ScrollView>
  );
}

/* ────────────────────────────────────────────────────────────────────────────
 * States
 * ──────────────────────────────────────────────────────────────────────────── */

/**
 * The tier choice — the first and most consequential thing they pick.
 *
 * Both options are offered plainly, lowest barrier first. The copy must never
 * imply that a community grower is a lesser kind of person: it is a different
 * amount of paperwork, and one of them is auto-approved because we cannot
 * verify it, not because it matters less.
 */
function PickTier({ onPick }: { onPick: (tier: FarmType) => void }) {
  return (
    <>
      <BrandText textRole="title" tone="ink">
        {FARMER_APPLICATION_COPY.title}
      </BrandText>
      <BrandText textRole="body" tone="inkSoft">
        {FARMER_APPLICATION_COPY.subtitle}
      </BrandText>

      <View style={styles.tiers}>
        {TIER_ORDER.map((value) => {
          const tier = TIERS[value];
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityLabel={tier.label}
              accessibilityHint={tier.outcome}
              onPress={() => onPick(value)}
              style={({ pressed }) => [styles.tier, pressed && styles.pressed]}
            >
              <BrandText textRole="detail" weight="semibold" tone="primaryDeep">
                {tier.label}
              </BrandText>
              <BrandText textRole="hint" tone="inkSoft">
                {tier.who}
              </BrandText>
              <BrandText textRole="hint" tone="inkSoft">
                {tier.outcome}
              </BrandText>
            </Pressable>
          );
        })}
      </View>

      {/* The honest trust model, said out loud rather than buried. */}
      <BrandText textRole="hint" tone="inkSoft">
        “Verified” is only ever used for a farm a person has actually checked. Being able to start
        straight away is not the same thing, and we will not label it as if it were.
      </BrandText>
    </>
  );
}

function UnderReview({
  onWithdraw,
  busy,
  notice,
}: {
  onWithdraw: () => void;
  busy: boolean;
  notice: string | null;
}) {
  return (
    <>
      <BrandText textRole="kicker" tone="inkSoft" style={styles.kicker}>
        WITH US NOW
      </BrandText>
      <BrandText textRole="title" tone="ink">
        A person is reading it
      </BrandText>
      <BrandText textRole="body" tone="inkSoft">
        That takes a few days. Nothing else changes in the meantime — the rest of the app is
        yours as usual.
      </BrandText>

      {notice ? (
        <BrandText textRole="detail" tone="ink">
          {notice}
        </BrandText>
      ) : null}

      <BrandButton label="Withdraw it" variant="quiet" onPress={onWithdraw} loading={busy} />
    </>
  );
}

/**
 * A rejection, with its reason shown verbatim.
 *
 * The reason is the whole screen. A rejection without one is the fastest way to
 * lose a real farmer who was one missing document away.
 */
function Rejected({ note, onEdit }: { note: string | null; onEdit: () => void }) {
  return (
    <>
      <BrandText textRole="title" tone="ink">
        Not yet
      </BrandText>
      <View style={styles.note}>
        <BrandText textRole="body" tone="ink">
          {note ?? 'No reason was given. Send us what you have and we will look again.'}
        </BrandText>
      </View>
      <BrandText textRole="body" tone="inkSoft">
        You can change what you sent and try again — this does not count against you.
      </BrandText>
      <BrandButton label="Edit and resend" onPress={onEdit} />
    </>
  );
}

function Approved({ farmType, onGo }: { farmType: FarmType; onGo: () => void }) {
  return (
    <>
      <BrandText textRole="title" tone="ink">
        You’re on the map
      </BrandText>
      <BrandText textRole="body" tone="inkSoft">
        You joined as a {TIERS[farmType].consumerLabel.toLowerCase()}. Grow is open — your farm,
        your photos, and the place you post from.
      </BrandText>
      <BrandButton label="Go to Grow" onPress={onGo} />
    </>
  );
}

/** Why they cannot apply. One farm per person, one application at a time. */
function Ineligible({ reason }: { reason: string | null }) {
  return (
    <>
      <BrandText textRole="title" tone="ink">
        Not this time
      </BrandText>
      <BrandText textRole="body" tone="inkSoft">
        {INELIGIBLE_COPY[reason ?? ''] ??
          'That cannot be started right now. Try again in a moment.'}
      </BrandText>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandColors.bg },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: brandColors.bg },
  content: {
    paddingHorizontal: brandSpacing.xl,
    paddingBottom: brandSpacing.xxxl,
    gap: brandSpacing.md,
  },
  kicker: { letterSpacing: 1.6 },
  tiers: { gap: brandSpacing.sm, paddingTop: brandSpacing.sm },
  tier: {
    gap: brandSpacing.xxs,
    padding: brandSpacing.lg,
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
  note: {
    padding: brandSpacing.lg,
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
  pressed: { opacity: 0.7 },
});
