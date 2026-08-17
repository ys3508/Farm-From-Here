import * as Clipboard from 'expo-clipboard';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BalancePill, Button, Card, Logo, Text, colors, spacing } from '@/design';
import { REFERRAL_REWARD_SEEDS } from '@/config/economy';
import { useAuth } from '@/features/auth/AuthProvider';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, session, signOut, busy } = useAuth();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + spacing.md, paddingBottom: spacing.xxxl },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Logo size="sm" />

      <View style={styles.headings}>
        <Text variant="title" display>
          {profile?.display_name ?? 'Your basket'}
        </Text>
        <Text variant="small" tone="muted">
          {session?.user.email ?? (profile?.is_guest ? 'Guest session' : 'Signed in')}
        </Text>
      </View>

      <Card>
        <Text variant="subheading" display>
          Your two balances
        </Text>
        <View style={styles.balances}>
          <BalancePill kind="seeds" value={profile?.seeds_balance ?? 0} />
          <BalancePill kind="growth" value={profile?.growth_xp ?? 0} />
        </View>
        <Text variant="caption" tone="muted" style={styles.gap}>
          Seeds are spendable and can never be bought with money. Growth only rises — it is never
          spent.
        </Text>
      </Card>

      {/* ── Referral ────────────────────────────────────────────────────────── */}
      <Card>
        <Text variant="subheading" display>
          Bring someone into the world
        </Text>
        <Text variant="small" tone="secondary" style={styles.gapSm}>
          You both get {REFERRAL_REWARD_SEEDS} Seeds once they finish signing up.
        </Text>

        <View style={styles.codeBox}>
          <Text variant="heading" display style={styles.code}>
            {profile?.referral_code ?? '········'}
          </Text>
        </View>

        <Button
          label="Copy my code"
          variant="secondary"
          disabled={!profile?.referral_code}
          onPress={() => {
            if (profile?.referral_code) void Clipboard.setStringAsync(profile.referral_code);
          }}
        />
      </Card>

      <Card locked>
        <Text variant="subheading" display>
          🤝 Volunteer hours & impact
        </Text>
        <Text variant="small" tone="secondary" style={styles.gapSm}>
          Impact is the real-world result of what you do — trees supported, hours given, pounds of
          local food. It is never a currency and never shown as Seeds.
        </Text>
      </Card>

      <Button label="Sign out" variant="ghost" loading={busy} onPress={() => void signOut()} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
  headings: { gap: spacing.xxs },
  balances: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md, flexWrap: 'wrap' },
  codeBox: {
    marginVertical: spacing.md,
    backgroundColor: colors.paperDeep,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  code: { letterSpacing: 4 },
  gap: { marginTop: spacing.md },
  gapSm: { marginTop: spacing.xs },
});
