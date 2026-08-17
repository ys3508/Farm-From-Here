import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, StyleSheet, View } from 'react-native';

import {
  BalancePill,
  Button,
  Card,
  Field,
  IllustrationSlot,
  Logo,
  Screen,
  Text,
  colors,
  radius,
  spacing,
} from '@/design';
import { useAuth, type OAuthProvider } from '@/features/auth/AuthProvider';

/**
 * The seven entry points, per the spec:
 *   Phone · Email · Google · Facebook · Twitter · Apple · Guest
 * plus the referral code field.
 *
 * Apple is present because the App Store requires Sign in with Apple wherever
 * other third-party logins are offered.
 */
const PROVIDERS: { key: OAuthProvider; label: string; glyph: string }[] = [
  { key: 'google', label: 'Continue with Google', glyph: 'G' },
  { key: 'facebook', label: 'Continue with Facebook', glyph: 'f' },
  { key: 'twitter', label: 'Continue with X', glyph: '𝕏' },
];

export default function SignInScreen() {
  const router = useRouter();
  const {
    signInWithOAuth,
    signInWithAppleNative,
    continueAsGuest,
    busy,
    pendingReferralCode,
    setPendingReferralCode,
  } = useAuth();

  const [showReferral, setShowReferral] = useState(false);

  const run = async (fn: () => Promise<unknown>, what: string) => {
    try {
      await fn();
    } catch (err) {
      Alert.alert(
        `Could not ${what}`,
        err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      );
    }
  };

  return (
    <Screen scroll edgeToEdgeTop contentStyle={styles.screen}>
      {/* Warm paper wash behind the hero — stands in for the painted market scene. */}
      <LinearGradient
        colors={['#F7E7C6', '#FBF3E4']}
        style={styles.wash}
        pointerEvents="none"
      />

      <View style={styles.hero}>
        <Logo />

        <IllustrationSlot
          brief="Hand-painted hero: a neighbourhood rendered as a farmers-market food map — orchard rows, a red barn, tomatoes on the vine, hand-lettered street names."
          assetName="signin-hero-map.png"
          glyph="🍅"
          height={172}
        />

        <Text variant="hero" display style={styles.headline}>
          Everything on this map is real.
        </Text>
        <Text variant="body" tone="secondary">
          Real local farms. Real farmers. A real tree you adopt and watch grow — with photos from
          the person who actually tends it.
        </Text>

        <View style={styles.economyRow}>
          <BalancePill kind="seeds" value={0} compact />
          <BalancePill kind="growth" value={0} compact />
          <Text variant="caption" tone="muted">
            earn both by doing real-world good
          </Text>
        </View>
      </View>

      {/* ── Primary entry points ───────────────────────────────────────────── */}
      <View style={styles.stack}>
        <Button
          label="Sign up with email"
          onPress={() => router.push('/(auth)/email')}
          accessibilityHint="Create an account with an email address and password"
        />
        <Button
          label="Continue with phone"
          variant="secondary"
          leading={<Text variant="subheading">📱</Text>}
          onPress={() => router.push('/(auth)/phone')}
        />
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.rule} />
        <Text variant="caption" tone="muted" weight="bold" style={styles.dividerLabel}>
          OR
        </Text>
        <View style={styles.rule} />
      </View>

      {/* ── Social ─────────────────────────────────────────────────────────── */}
      <View style={styles.stack}>
        {PROVIDERS.map((provider) => (
          <Button
            key={provider.key}
            label={provider.label}
            variant="provider"
            leading={
              <Text variant="subheading" weight="bold">
                {provider.glyph}
              </Text>
            }
            disabled={busy}
            onPress={() => run(() => signInWithOAuth(provider.key), `sign in with ${provider.key}`)}
          />
        ))}

        <Button
          label={Platform.OS === 'ios' ? 'Sign in with Apple' : 'Continue with Apple'}
          variant="provider"
          // U+F8FF (the Apple mark) is an Apple-only private-use glyph and
          // renders as an empty box on Android, so it is iOS-only here.
          leading={
            <Text variant="subheading" weight="bold">
              {Platform.OS === 'ios' ? '' : '🍏'}
            </Text>
          }
          disabled={busy}
          onPress={() => run(signInWithAppleNative, 'sign in with Apple')}
        />

        <Button
          label="Look around as a guest"
          variant="ghost"
          disabled={busy}
          onPress={() => run(continueAsGuest, 'continue as a guest')}
          accessibilityHint="Explore without an account. You keep your Seeds and Growth if you sign up later."
        />
      </View>

      {/* ── Referral code ──────────────────────────────────────────────────── */}
      <Card>
        {showReferral ? (
          <View style={styles.referralOpen}>
            <Field
              label="Referral code"
              placeholder="e.g. K7QW2MPD"
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              value={pendingReferralCode}
              onChangeText={(text) => setPendingReferralCode(text.toUpperCase())}
              hint="Both of you get 500 Seeds once your signup is finished — not just for entering the code."
            />
          </View>
        ) : (
          <Button
            label="Have a referral code?"
            variant="ghost"
            onPress={() => setShowReferral(true)}
          />
        )}
      </Card>

      <Text variant="caption" tone="muted" center style={styles.footnote}>
        Seeds can never be bought with money. You earn them by doing real-world good.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: { paddingTop: spacing.xxxl, gap: spacing.xl },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 420,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  hero: { gap: spacing.lg },
  headline: { marginTop: spacing.xs },
  economyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  stack: { gap: spacing.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  rule: { flex: 1, height: 1.5, backgroundColor: colors.border },
  dividerLabel: { letterSpacing: 1.5 },
  referralOpen: { gap: spacing.sm },
  footnote: { paddingHorizontal: spacing.lg },
});
