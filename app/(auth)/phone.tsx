import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button, Card, Field, Logo, Screen, Text, spacing } from '@/design';
import { useAuth } from '@/features/auth/AuthProvider';

/**
 * PHONE SIGN-IN — UI BUILT, BACKEND DELIBERATELY STUBBED.
 *
 * The spec is explicit: build the UI, leave the backend a clear stub, do not
 * block Step 1 on it. SMS costs real money per message and needs a Twilio
 * account wired to Supabase.
 *
 * This screen therefore renders the real designed flow and, on submit, says
 * plainly that the channel is not connected yet. It does NOT pretend to send a
 * code and then fail at the verify step — a fake success would be worse than an
 * honest "not yet".
 */
export default function PhoneAuthScreen() {
  const router = useRouter();
  const { startPhoneSignIn } = useAuth();

  const [phone, setPhone] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  const submit = async () => {
    try {
      await startPhoneSignIn(phone);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Phone sign-in is not available yet.');
    }
  };

  return (
    <Screen scroll>
      <Logo size="sm" />

      <View style={styles.headings}>
        <Text variant="title" display>
          Sign in with your phone
        </Text>
        <Text variant="body" tone="secondary">
          We&apos;ll text you a six-digit code.
        </Text>
      </View>

      <Card>
        <View style={styles.form}>
          <Field
            label="Phone number"
            placeholder="+1 555 123 4567"
            keyboardType="phone-pad"
            autoComplete="tel"
            value={phone}
            onChangeText={setPhone}
            hint="Standard message rates apply."
          />
          <Button label="Send me a code" onPress={submit} />
        </View>
      </Card>

      {notice ? (
        <Card locked>
          <Text variant="subheading" display>
            Not connected yet
          </Text>
          <Text variant="small" tone="secondary" style={styles.notice}>
            {notice}
          </Text>
        </Card>
      ) : null}

      <Button label="Back" variant="ghost" onPress={() => router.back()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  headings: { gap: spacing.xs },
  form: { gap: spacing.lg },
  notice: { marginTop: spacing.sm },
});
