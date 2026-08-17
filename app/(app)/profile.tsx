import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BalancePill, Button, Card, Logo, Text, colors, spacing } from '@/design';
import { REFERRAL_REWARD_SEEDS } from '@/config/economy';
import { useAuth } from '@/features/auth/AuthProvider';
import { avatarPublicUrl, pickAvatar, uploadAvatar } from '@/features/profile/avatar';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { profile, session, signOut, busy, refreshProfile } = useAuth();

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarNotice, setAvatarNotice] = useState<string | null>(null);

  const avatarUrl = avatarPublicUrl(profile?.avatar_url);

  /**
   * The "change it later" path the avatar spec asks for. Deliberately the whole
   * settings surface for now — a full settings screen is not this round's job.
   */
  const changeAvatar = async () => {
    setAvatarNotice(null);
    const picked = await pickAvatar();

    if (picked.status === 'denied') {
      setAvatarNotice('Photo access is off. Turn it on in Settings to change your photo.');
      return;
    }
    if (picked.status !== 'picked' || !profile?.id) return;

    setUploadingAvatar(true);
    try {
      const result = await uploadAvatar(profile.id, picked.uri);
      if (result.ok) {
        await refreshProfile();
      } else {
        setAvatarNotice(`That photo did not upload: ${result.message}`);
      }
    } finally {
      setUploadingAvatar(false);
    }
  };

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

      <View style={styles.identity}>
        <Pressable onPress={changeAvatar} accessibilityRole="button" style={styles.avatar}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text variant="title" tone="muted">
              {(profile?.display_name?.trim()[0] ?? '🌱').toUpperCase()}
            </Text>
          )}
        </Pressable>

        <View style={styles.headings}>
          <Text variant="title" display>
            {profile?.display_name ?? 'Your basket'}
          </Text>
          {profile?.username ? (
            <Text variant="small" tone="secondary">
              @{profile.username}
            </Text>
          ) : null}
          <Text variant="small" tone="muted">
            {session?.user.email ?? (profile?.is_guest ? 'Guest session' : 'Signed in')}
          </Text>
          <Pressable onPress={changeAvatar} disabled={uploadingAvatar}>
            <Text variant="small" weight="medium" tone="seeds">
              {uploadingAvatar ? 'Uploading…' : avatarUrl ? 'Change photo' : 'Add a photo'}
            </Text>
          </Pressable>
        </View>
      </View>

      {avatarNotice ? (
        <Card>
          <Text variant="small" tone="secondary">
            {avatarNotice}
          </Text>
        </Card>
      ) : null}

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
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  headings: { flex: 1, gap: spacing.xxs },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colors.paperDeep,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: { width: '100%', height: '100%' },
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
