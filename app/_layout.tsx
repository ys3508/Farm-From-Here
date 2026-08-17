import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider } from '@/features/auth/AuthProvider';
import { appFonts, colors } from '@/design';
import { brandFonts } from '@/design/brand';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // Both sets load together: onboarding uses the brand faces (Cormorant / Inter
  // / Dancing Script) while the not-yet-reskinned screens still use Fraunces and
  // Nunito. `appFonts` retires when the last screen migrates to the brand system.
  const [fontsLoaded, fontError] = useFonts({ ...appFonts, ...brandFonts });

  useEffect(() => {
    // Hide the splash once type is ready — text popping from a fallback face to
    // Fraunces is exactly the cheap-feeling moment this product cannot afford.
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.bg },
            animation: 'fade',
          }}
        />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
