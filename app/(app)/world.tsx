import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BalancePill,
  Button,
  Card,
  IllustrationSlot,
  Logo,
  Text,
  colors,
  radius,
  spacing,
} from '@/design';
import { PENDING_OWNER_DECISIONS } from '@/config/economy';
import { useAuth } from '@/features/auth/AuthProvider';
import { describeSource, useLedgers } from '@/features/economy/useEconomy';
import { useFarms } from '@/features/farms/useFarms';

/**
 * MY WORLD — the app's home, and the thing that differentiates it from a
 * marketplace or a donation app.
 *
 * It is a PERSONAL REAL-WORLD DASHBOARD: it shows the things this person has an
 * actual relationship with, not a feed of content. Live modules are interactive;
 * locked ones are narrative "coming soon" — the user sees the whole world on day
 * one and watches it unlock. Locked ≠ broken (CLAUDE.md invariant 8).
 *
 * V1.0 modules: My Tree · My Farms · My Seeds · My Growth · My Creatures ·
 *               My Quests · My Volunteer Hours / My Impact
 */
export default function MyWorldScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile, session, refreshProfile } = useAuth();
  const { growth, seeds, reload: reloadLedgers } = useLedgers(profile?.id);
  const { farms, loading: farmsLoading } = useFarms();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshProfile(), reloadLedgers()]);
    } finally {
      setRefreshing(false);
    }
  };

  const firstName = profile?.display_name?.split(' ')[0];
  const isGuest = profile?.is_guest ?? false;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <Logo size="sm" />
        <View style={styles.balances}>
          <BalancePill kind="seeds" value={profile?.seeds_balance ?? 0} compact />
          <BalancePill kind="growth" value={profile?.growth_xp ?? 0} compact />
        </View>
      </View>

      <View style={styles.greeting}>
        <Text variant="title" display>
          {firstName ? `${firstName}'s world` : 'My World'}
        </Text>
        <Text variant="body" tone="secondary">
          Everything here is something you have a real relationship with.
        </Text>
      </View>

      {isGuest ? (
        <Card>
          <Text variant="subheading" display>
            You&apos;re looking around as a guest
          </Text>
          <Text variant="small" tone="secondary" style={styles.gap}>
            Your Seeds and Growth are already real and already yours. Add an email later and they
            come with you.
          </Text>
        </Card>
      ) : null}

      {/* ── 🌳 MY TREE — the hero module ───────────────────────────────────── */}
      <Section title="🌳 My Tree" subtitle="The real one, with a real farmer tending it.">
        <Card>
          <IllustrationSlot
            brief="Hand-painted apple tree portrait, seasonal — the user's adopted tree as the emotional centre of the app."
            assetName="my-tree-hero.png"
            glyph="🌳"
            height={150}
          />
          <Text variant="subheading" display style={styles.gap}>
            You haven&apos;t adopted anything yet
          </Text>
          <Text variant="small" tone="secondary" style={styles.gapSm}>
            Find a real farm near you, spend Seeds on a real tree, and the farmer&apos;s updates
            start arriving here.
          </Text>
          <View style={styles.gap}>
            <Button label="Find a farm near me" onPress={() => router.push('/(app)/map')} />
          </View>
        </Card>
      </Section>

      {/* ── 🧑‍🌾 MY FARMS ───────────────────────────────────────────────────── */}
      <Section title="🧑‍🌾 My Farms" subtitle="Farms you're connected to.">
        <Card>
          {farmsLoading ? (
            <Text variant="small" tone="muted">
              Looking for farms…
            </Text>
          ) : farms.length === 0 ? (
            <>
              <Text variant="subheading" display>
                No farms signed yet
              </Text>
              <Text variant="small" tone="secondary" style={styles.gapSm}>
                Only real, contracted farms ever appear here. The first one is being signed.
              </Text>
            </>
          ) : (
            <>
              <Text variant="subheading" display>
                {farms.length} real {farms.length === 1 ? 'farm' : 'farms'} nearby
              </Text>
              <View style={styles.gap}>
                <Button
                  label="Open the map"
                  variant="secondary"
                  onPress={() => router.push('/(app)/map')}
                />
              </View>
            </>
          )}
        </Card>
      </Section>

      {/* ── 🌱 MY SEEDS + ✨ MY GROWTH — both live ─────────────────────────── */}
      <Section
        title="🌱 My Seeds"
        subtitle="Spendable. Earned only by real-world good — never bought."
      >
        <Card>
          <BalancePill kind="seeds" value={profile?.seeds_balance ?? 0} />
          <LedgerList
            rows={seeds.map((row) => ({
              id: row.id,
              label: describeSource(row.source),
              amount: row.amount,
            }))}
            emptyText="No Seeds activity yet."
            kind="seeds"
          />
        </Card>
      </Section>

      <Section title="✨ My Growth" subtitle="Progression. It only ever rises.">
        <Card>
          <BalancePill kind="growth" value={profile?.growth_xp ?? 0} />
          <LedgerList
            rows={growth.map((row) => ({
              id: row.id,
              label: describeSource(row.source),
              amount: row.amount,
            }))}
            emptyText="No Growth activity yet."
            kind="growth"
          />
        </Card>
      </Section>

      {/* ── Locked modules — narrative, not broken ─────────────────────────── */}
      <Section title="Still growing" subtitle="You can see the whole world on day one.">
        <View style={styles.lockedGrid}>
          <Card locked>
            <Text variant="subheading" display>
              🐣 My Creatures
            </Text>
            <Text variant="small" tone="secondary" style={styles.gapSm}>
              Companions you earn by visiting real farms — never bought. Fed with Growth.
            </Text>
          </Card>

          <Card locked>
            <Text variant="subheading" display>
              🏆 My Quests
            </Text>
            <Text variant="small" tone="secondary" style={styles.gapSm}>
              Real-world things to go and do. Walk, bike, volunteer, visit.
            </Text>
          </Card>

          <Card locked>
            <Text variant="subheading" display>
              🤝 My Volunteer Hours
            </Text>
            <Text variant="small" tone="secondary" style={styles.gapSm}>
              Hours you actually gave to a real farm.
            </Text>
          </Card>

          <Card locked>
            <Text variant="subheading" display>
              💚 My Impact
            </Text>
            <Text variant="small" tone="secondary" style={styles.gapSm}>
              What your actions did in the real world — trees supported, pounds of local food.
              Impact is the result, not a currency.
            </Text>
          </Card>
        </View>
      </Section>

      {/* Dev-only reminder that some numbers are still placeholders. */}
      {__DEV__ && PENDING_OWNER_DECISIONS.length > 0 ? (
        <Card locked>
          <Text variant="caption" weight="bold" tone="muted">
            DEV ONLY — PENDING OWNER DECISIONS
          </Text>
          <Text variant="caption" tone="muted" style={styles.gapSm}>
            Placeholder values still in src/config/economy.ts:{'\n'}
            {PENDING_OWNER_DECISIONS.join('\n')}
          </Text>
        </Card>
      ) : null}

      <Text variant="caption" tone="muted" center>
        {session?.user.email ?? 'Guest session'}
      </Text>
    </ScrollView>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text variant="heading" display>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="small" tone="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

/** Recent ledger rows. The ledgers are the truth behind the balance above. */
function LedgerList({
  rows,
  emptyText,
  kind,
}: {
  rows: { id: string; label: string; amount: number }[];
  emptyText: string;
  /** Keeps each economy in its own colour — Seeds green, Growth gold. */
  kind: 'seeds' | 'growth';
}) {
  if (rows.length === 0) {
    return (
      <Text variant="small" tone="muted" style={styles.gap}>
        {emptyText}
      </Text>
    );
  }

  return (
    <View style={styles.ledger}>
      {rows.slice(0, 5).map((row) => (
        <View key={row.id} style={styles.ledgerRow}>
          <Text variant="small" tone="secondary">
            {row.label}
          </Text>
          <Text variant="small" weight="bold" tone={row.amount > 0 ? kind : 'danger'}>
            {row.amount > 0 ? '+' : ''}
            {row.amount.toLocaleString()}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balances: { flexDirection: 'row', gap: spacing.xs },
  greeting: { gap: spacing.xs },
  section: { gap: spacing.md },
  sectionHead: { gap: spacing.xxs },
  gap: { marginTop: spacing.md },
  gapSm: { marginTop: spacing.xs },
  lockedGrid: { gap: spacing.md },
  ledger: {
    marginTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1.5,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    borderRadius: radius.sm,
  },
  ledgerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
