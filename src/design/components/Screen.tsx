import {
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, spacing } from '../tokens';

export type ScreenProps = {
  children: React.ReactNode;
  scroll?: boolean;
  /** Skip the top safe-area pad when a header already handles it. */
  edgeToEdgeTop?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

/**
 * Page frame: paper ground + safe-area handling. Every screen uses one so the
 * background colour and gutters can never drift between steps.
 */
export function Screen({ children, scroll = false, edgeToEdgeTop = false, contentStyle }: ScreenProps) {
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: edgeToEdgeTop ? 0 : insets.top + spacing.md,
    paddingBottom: insets.bottom + spacing.xl,
  };

  if (scroll) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={[styles.content, pad, contentStyle]}
        showsVerticalScrollIndicator={false}
      >
        {children}
      </ScrollView>
    );
  }

  return <View style={[styles.root, styles.content, pad, contentStyle]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
});
