import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BrandButton,
  BrandText,
  brandColors,
  brandRadius,
  brandSpacing,
} from '@/design/brand';
import { useAuth } from '@/features/auth/AuthProvider';
import { describeSource, useLedgers } from '@/features/economy/useEconomy';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * SEEDS & GROWTH — the detail behind the balance pill. READ-ONLY.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-homestead-ui-polish.md §4
 *
 * Reached by tapping the balance in the fixed head of the world canvas, from
 * EITHER world — it is one person's balance, so there is one screen for it.
 *
 * Owner's call (2026-08-19): a pushed screen with a back button rather than an
 * overlay sheet, so the hardware back button works and it can be deep-linked.
 * It is NOT a sixth bottom tab — the bar is fixed at five.
 *
 * ⚠️ READ-ONLY, AND THAT IS A PRODUCT RULE, NOT A SCOPE CUT.
 *   • Nothing here earns, spends, converts or buys. No actions of any kind.
 *   • Seeds CANNOT be bought with money, ever (CLAUDE.md invariant 1). Do not
 *     add a "get more Seeds" affordance to this screen, now or later.
 *   • The two quantities are never summed, compared or converted into each
 *     other. They are two separate lists on purpose.
 *
 * WHERE THE NUMBERS COME FROM. The big figures are the cached balances on
 * `profiles`; the lists are the LEDGERS, which are the actual source of truth
 * (CLAUDE.md invariant 2). So if a balance ever looks wrong, this screen is
 * where the answer is — that is the real reason it exists.
 *
 * Both ledgers are SELECT-only to the client by RLS, and typed read-only in
 * lib/supabase/types.ts, so nothing on this screen could write even by mistake.
 */

const ICONS = {
  seeds: require('../../assets/my_world/seeds.png'),
  growth: require('../../assets/my_world/growth.png'),
} as const;

export default function BalanceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const { growth, seeds, loading } = useLedgers(profile?.id);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + brandSpacing.xl, paddingBottom: brandSpacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <BrandText textRole="kicker" tone="inkSoft" style={styles.kicker}>
        WHAT YOU HAVE
      </BrandText>

      {/* The two quantities, side by side but never added together. */}
      <View style={styles.balances}>
        <Balance
          kind="seeds"
          value={profile?.seeds_balance ?? 0}
          name="Seeds"
          line="Earned by real-world good, and spent on it. Never bought."
        />
        <Balance
          kind="growth"
          value={profile?.growth_xp ?? 0}
          name="Growth"
          line="Everything you have done so far. It only ever rises."
        />
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={brandColors.primary} />
        </View>
      ) : (
        <>
          <Ledger
            title="Seeds"
            empty="No Seeds movements yet."
            rows={seeds.map((row) => ({
              id: row.id,
              label: describeSource(row.source),
              at: row.created_at,
              amount: row.amount,
            }))}
          />
          <Ledger
            title="Growth"
            empty="No Growth yet."
            rows={growth.map((row) => ({
              id: row.id,
              label: describeSource(row.source),
              at: row.created_at,
              amount: row.amount,
            }))}
          />
        </>
      )}

      {router.canGoBack() ? (
        <BrandButton label="Back" variant="quiet" onPress={() => router.back()} />
      ) : null}
    </ScrollView>
  );
}

function Balance({
  kind,
  value,
  name,
  line,
}: {
  kind: keyof typeof ICONS;
  value: number;
  name: string;
  line: string;
}) {
  return (
    <View style={styles.balance}>
      <View style={styles.balanceHead}>
        <Image
          source={ICONS[kind]}
          style={styles.icon}
          resizeMode="contain"
          accessibilityIgnoresInvertColors
        />
        <BrandText textRole="title" tone="ink" accessibilityLabel={`${value} ${name}`}>
          {value.toLocaleString()}
        </BrandText>
      </View>
      <BrandText textRole="detail" weight="semibold" tone="primaryDeep">
        {name}
      </BrandText>
      <BrandText textRole="hint" tone="inkSoft">
        {line}
      </BrandText>
    </View>
  );
}

type Row = { id: string; label: string; at: string; amount: number };

function Ledger({ title, rows, empty }: { title: string; rows: Row[]; empty: string }) {
  return (
    <View style={styles.section}>
      <BrandText textRole="detail" weight="semibold" tone="ink">
        {title}
      </BrandText>

      {rows.length === 0 ? (
        <BrandText textRole="hint" tone="inkSoft">
          {empty}
        </BrandText>
      ) : (
        <View style={styles.rows}>
          {rows.map((row) => (
            <View key={row.id} style={styles.row}>
              <View style={styles.rowCopy}>
                <BrandText textRole="detail" tone="ink">
                  {row.label}
                </BrandText>
                <BrandText textRole="hint" tone="inkSoft">
                  {formatDay(row.at)}
                </BrandText>
              </View>
              {/* A spend is signed, so the row reads honestly either way. */}
              <BrandText
                textRole="amount"
                tone={row.amount < 0 ? 'inkSoft' : 'primaryDeep'}
              >
                {row.amount > 0 ? `+${row.amount.toLocaleString()}` : row.amount.toLocaleString()}
              </BrandText>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

/** Date only — the hour a ledger row landed is noise to the person reading it. */
function formatDay(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandColors.bg },
  content: { paddingHorizontal: brandSpacing.xl, gap: brandSpacing.lg },
  kicker: { letterSpacing: 1.6 },
  balances: { flexDirection: 'row', gap: brandSpacing.md },
  balance: {
    flex: 1,
    gap: brandSpacing.xxs,
    padding: brandSpacing.lg,
    borderRadius: brandRadius.lg,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
  balanceHead: { flexDirection: 'row', alignItems: 'center', gap: brandSpacing.sm },
  icon: { width: 26, height: 26 },
  loading: { paddingVertical: brandSpacing.xxl },
  section: { gap: brandSpacing.sm },
  rows: { gap: brandSpacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: brandSpacing.md,
    paddingVertical: brandSpacing.sm,
    paddingHorizontal: brandSpacing.md,
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
  rowCopy: { gap: brandSpacing.xxs, flexShrink: 1 },
});
