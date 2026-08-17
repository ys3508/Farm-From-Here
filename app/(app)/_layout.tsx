import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, type ColorValue } from 'react-native';

import { Text, colors, fontFamily, spacing } from '@/design';
import { useAuth } from '@/features/auth/AuthProvider';

/**
 * Protected area. Everything under (app) requires a session — including a Guest
 * session, which is a real auth user and so has a real profile and real balances.
 */
export default function AppLayout() {
  const { session, initialising } = useAuth();

  if (initialising) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontFamily: fontFamily.bodyMedium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="world"
        options={{
          title: 'My World',
          tabBarIcon: ({ color }) => <TabGlyph glyph="🌳" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <TabGlyph glyph="🗺️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Me',
          tabBarIcon: ({ color }) => <TabGlyph glyph="🧺" color={color} />,
        }}
      />
    </Tabs>
  );
}

/** Emoji stand-ins. Replace with hand-drawn tab icons when the art lands. */
function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  return (
    <Text variant="subheading" style={{ color }}>
      {glyph}
    </Text>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  tabBar: {
    backgroundColor: colors.bgRaised,
    borderTopColor: colors.border,
    borderTopWidth: 1.5,
    paddingTop: spacing.xs,
    height: 88,
  },
});
