import { useState } from 'react';
import { LayoutAnimation, Platform, Pressable, StyleSheet, UIManager, View } from 'react-native';

import { BrandText } from './BrandText';
import { brandColors, brandSpacing } from './tokens';

// Old-architecture Android needs this opt-in for LayoutAnimation. Harmless
// elsewhere; guarded because the setter does not exist on every platform.
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export type CollapsibleProps = {
  label: string;
  /** Label shown once expanded. Defaults to `label`. */
  expandedLabel?: string;
  children: React.ReactNode;
  initiallyOpen?: boolean;
};

/**
 * A disclosure row that is COLLAPSED BY DEFAULT.
 *
 * Used for "More options" and "Have a referral code?". Collapsed-by-default is
 * the whole point of both: a user WITHOUT a referral code should never see a
 * code field and conclude they need one, and the third-party buttons should not
 * compete with the primary email path.
 */
export function Collapsible({
  label,
  expandedLabel,
  children,
  initiallyOpen = false,
}: CollapsibleProps) {
  const [open, setOpen] = useState(initiallyOpen);

  const toggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((v) => !v);
  };

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={toggle}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <BrandText variant="small" weight="medium" tone="primaryDeep">
          {open ? (expandedLabel ?? label) : label}
        </BrandText>
        <BrandText variant="small" tone="primaryDeep">
          {open ? '⌃' : '⌄'}
        </BrandText>
      </Pressable>

      {open ? <View style={styles.body}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: brandSpacing.sm,
    paddingVertical: brandSpacing.sm,
  },
  pressed: { opacity: 0.6 },
  body: {
    gap: brandSpacing.md,
    paddingTop: brandSpacing.md,
    borderTopWidth: 1,
    borderTopColor: brandColors.line,
  },
});
