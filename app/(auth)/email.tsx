import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';

import { Button, Card, Field, Logo, Screen, Text, spacing } from '@/design';
import { useAuth } from '@/features/auth/AuthProvider';

export default function EmailAuthScreen() {
  const router = useRouter();
  const { signUpWithEmail, signInWithEmail, busy, pendingReferralCode } = useAuth();

  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isSignup = mode === 'signup';

  const submit = async () => {
    setError(null);
    if (!email.includes('@')) return setError('That does not look like an email address.');
    if (password.length < 8) return setError('Password must be at least 8 characters.');

    try {
      if (isSignup) {
        await signUpWithEmail(email.trim(), password, displayName);
        Alert.alert(
          'Check your email',
          'If email confirmation is on for this project, tap the link we just sent. ' +
            'Your Growth, Seeds and referral reward are granted the moment your account is created.',
        );
      } else {
        await signInWithEmail(email.trim(), password);
      }
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Screen scroll>
        <Logo size="sm" />

        <View style={styles.headings}>
          <Text variant="title" display>
            {isSignup ? 'Plant your roots' : 'Welcome back'}
          </Text>
          <Text variant="body" tone="secondary">
            {isSignup
              ? 'One account, and the map becomes yours.'
              : 'Your tree has been waiting for you.'}
          </Text>
        </View>

        <Card>
          <View style={styles.form}>
            {isSignup ? (
              <Field
                label="What should we call you?"
                placeholder="Your name"
                autoCapitalize="words"
                value={displayName}
                onChangeText={setDisplayName}
              />
            ) : null}

            <Field
              label="Email"
              placeholder="you@example.com"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />

            <Field
              label="Password"
              placeholder="At least 8 characters"
              secureTextEntry
              autoCapitalize="none"
              autoComplete={isSignup ? 'new-password' : 'current-password'}
              value={password}
              onChangeText={setPassword}
              error={error ?? undefined}
            />

            {isSignup && pendingReferralCode ? (
              <Text variant="small" tone="seeds" weight="medium">
                🌱 Referral code {pendingReferralCode} will be applied — 500 Seeds each for you and
                your friend.
              </Text>
            ) : null}

            <Button
              label={isSignup ? 'Create my account' : 'Sign in'}
              loading={busy}
              onPress={submit}
            />
          </View>
        </Card>

        <Button
          label={isSignup ? 'I already have an account' : 'I need an account'}
          variant="ghost"
          onPress={() => {
            setMode(isSignup ? 'signin' : 'signup');
            setError(null);
          }}
        />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headings: { gap: spacing.xs },
  form: { gap: spacing.lg },
});
