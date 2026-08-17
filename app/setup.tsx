import { StyleSheet, View } from 'react-native';

import { Card, Logo, Screen, Text, spacing } from '@/design';
import { supabaseConfigProblem } from '@/lib/env';

/**
 * Shown when EXPO_PUBLIC_SUPABASE_* is missing.
 *
 * A fresh checkout has no .env.local, and a red Metro error screen would make a
 * working app look broken. This says exactly what to do instead.
 */
export default function SetupScreen() {
  const problem = supabaseConfigProblem();

  return (
    <Screen scroll>
      <Logo />

      <View style={styles.headings}>
        <Text variant="title" display>
          One step to go
        </Text>
        <Text variant="body" tone="secondary">
          The app is built and running — it just needs your Supabase project.
        </Text>
      </View>

      <Card>
        <Text variant="caption" weight="bold" tone="danger">
          {problem}
        </Text>
      </Card>

      <Card>
        <Text variant="subheading" display>
          1 · Create the env file
        </Text>
        <Text variant="small" tone="secondary" style={styles.gapSm}>
          In the project root:
        </Text>
        <Text variant="small" style={styles.code}>
          cp .env.local.example .env.local
        </Text>
      </Card>

      <Card>
        <Text variant="subheading" display>
          2 · Paste two values
        </Text>
        <Text variant="small" tone="secondary" style={styles.gapSm}>
          From your Supabase project → Project Settings → Data API and API Keys:
        </Text>
        <Text variant="small" style={styles.code}>
          EXPO_PUBLIC_SUPABASE_URL{'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY
        </Text>
        <Text variant="caption" tone="muted" style={styles.gapSm}>
          Use the anon / publishable key — never the service_role key.
        </Text>
      </Card>

      <Card>
        <Text variant="subheading" display>
          3 · Apply the database
        </Text>
        <Text variant="small" tone="secondary" style={styles.gapSm}>
          Run every file in supabase/migrations/ in order, then supabase/seed.sql. See
          supabase/README.md for both ways to do it.
        </Text>
      </Card>

      <Card>
        <Text variant="subheading" display>
          4 · Restart Metro
        </Text>
        <Text variant="small" style={styles.code}>
          npx expo start -c
        </Text>
        <Text variant="caption" tone="muted" style={styles.gapSm}>
          The -c matters: Expo bakes EXPO_PUBLIC_* values into the bundle, so a running Metro will
          not pick up your new file.
        </Text>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  headings: { gap: spacing.xs },
  code: {
    marginTop: spacing.sm,
    fontFamily: 'Courier',
    backgroundColor: '#F3E4C8',
    padding: spacing.md,
    borderRadius: 10,
    overflow: 'hidden',
  },
  gapSm: { marginTop: spacing.xs },
});
