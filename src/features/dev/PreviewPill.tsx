import { usePathname, useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import { BrandText, brandRadius, brandSpacing } from '@/design/brand';
import { isPreviewMode } from './preview';

/**
 * The floating PREVIEW badge.
 *
 * Two jobs at once: it is the way back to the screen index, and it is the
 * standing admission that nothing on screen is real. That second job is why it
 * is always visible rather than tucked into a menu — a screenshot taken in
 * preview mode carries the label with it.
 *
 * Renders nothing at all when preview mode is off, and cannot render in a
 * production build.
 */
export function PreviewPill() {
  const router = useRouter();
  const pathname = usePathname();

  if (!isPreviewMode) return null;
  if (pathname === '/dev') return null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Preview mode. Open the screen index."
      onPress={() => router.push('/dev')}
      style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
    >
      <BrandText variant="caption" weight="semibold" tone="onImage">
        PREVIEW · sample data
      </BrandText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: 'absolute',
    right: brandSpacing.lg,
    bottom: brandSpacing.xxxl,
    backgroundColor: 'rgba(44, 58, 46, 0.88)',
    borderRadius: brandRadius.pill,
    paddingHorizontal: brandSpacing.lg,
    paddingVertical: brandSpacing.sm,
    zIndex: 999,
  },
  pressed: { opacity: 0.75 },
});
