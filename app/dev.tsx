import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import {
  BrandButton,
  BrandText,
  ScrimCard,
  brandColors,
  brandRadius,
  brandSpacing,
} from '@/design/brand';
import { PREVIEW_SCREENS, isPreviewMode } from '@/features/dev/preview';

/**
 * THE PREVIEW INDEX — every screen, one tap away, no signing up.
 *
 * Reached from the PREVIEW pill that floats on every screen while preview mode
 * is on. Without the flag this route just explains how to switch it on, so
 * visiting /dev by accident never shows a broken page.
 */
export default function DevIndexScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <BrandText family="display" variant="title">
          Preview
        </BrandText>
        <BrandText variant="small" tone="inkSoft">
          {isPreviewMode
            ? 'Signed in as a fake account with sample content. Nothing here is real.'
            : 'Preview mode is off.'}
        </BrandText>
      </View>

      {!isPreviewMode ? (
        <ScrimCard fillRemaining>
          <BrandText family="display" variant="title" center>
            Switch it on
          </BrandText>
          <BrandText variant="small" tone="inkSoft">
            Add this line to .env.local:
          </BrandText>
          <BrandText variant="small" style={styles.code}>
            EXPO_PUBLIC_PREVIEW_MODE=true
          </BrandText>
          <BrandText variant="small" tone="inkSoft">
            Then restart with `npx expo start -c`. The -c matters — Expo bakes
            EXPO_PUBLIC_* values into the bundle at build time.
          </BrandText>
          <BrandText variant="caption" tone="inkSoft">
            It only ever works in development. A production build ignores the flag entirely.
          </BrandText>
        </ScrimCard>
      ) : (
        <ScrimCard fillRemaining>
          {PREVIEW_SCREENS.map((screen) => (
            <View key={screen.path} style={styles.row}>
              <BrandButton
                label={screen.title}
                variant="quiet"
                onPress={() => router.push(screen.path as never)}
              />
              <BrandText variant="caption" tone="inkSoft">
                {screen.note}
              </BrandText>
            </View>
          ))}

          <View style={styles.note}>
            <BrandText variant="caption" tone="inkSoft">
              Balances, farms and ledger rows are fixtures from
              src/features/dev/preview.ts. The farms are named PREVIEW so they can never be
              mistaken for signed farms. Sign out, sign in and sign up do not reach a real
              backend while this is on.
            </BrandText>
          </View>
        </ScrimCard>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandColors.bg, paddingTop: brandSpacing.xxxl },
  header: { paddingHorizontal: brandSpacing.xl, paddingBottom: brandSpacing.lg, gap: brandSpacing.xs },
  row: { gap: brandSpacing.xs },
  note: {
    marginTop: brandSpacing.md,
    paddingTop: brandSpacing.md,
    borderTopWidth: 1,
    borderTopColor: brandColors.line,
  },
  code: {
    fontFamily: 'Courier',
    backgroundColor: brandColors.bg,
    padding: brandSpacing.md,
    borderRadius: brandRadius.sm,
    overflow: 'hidden',
  },
});
