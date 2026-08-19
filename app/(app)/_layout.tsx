import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, type ColorValue } from 'react-native';

import { TAB_BAR_HEIGHT } from '@/config/myWorld';
import { BrandText, brandColors, brandSpacing } from '@/design/brand';
import { useAuth } from '@/features/auth/AuthProvider';

/**
 * Protected area. Everything under (app) requires a session — including a Guest
 * session, which is a real auth user and so has a real profile and real balances.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THE TAB BAR (My World spec + owner decision, 2026-08-19)
 *
 * The spec asks for four tabs: My World / Quest / Farm / Community. The owner
 * chose to keep Profile as a fifth, because Profile is where the avatar,
 * username, referral code and — critically — SIGN OUT live, and dropping it
 * from the bar would leave no way to sign out.
 *
 * Quest, Farm and Community are VISIBLE BUT LOCKED narrative placeholders. They
 * are not greyed out and not dead buttons: tapping one opens a calm, designed
 * "not yet" screen. The user sees the whole world on day one and watches it
 * unlock (CLAUDE.md invariant 8).
 *
 * Map keeps its route but has no tab (`href: null`). It is still reachable by
 * deep link and from the /dev preview index; the spec's bar simply has no slot
 * for it. Nothing was deleted.
 *
 * ORDER — My World | Farm | Quest | Community | Me
 * (revise/2026-08-19-farmer-world-and-tabs.md, Task 1. Quest and Farm swapped;
 * nothing else changed.)
 *
 * The two ROLE-SPECIFIC tabs — home, then the main action — are grouped on the
 * LEFT; the two SHARED SOCIAL tabs (Quest, Community) sit on the RIGHT with Me.
 * That grouping is what lets the Farmer World toggle animate only the left half
 * of the bar. Please do not "tidy" Quest back to slot 2.
 * ────────────────────────────────────────────────────────────────────────────
 */
export default function AppLayout() {
  const { session, initialising } = useAuth();

  if (initialising) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={brandColors.primary} />
      </View>
    );
  }

  if (!session) return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brandColors.primaryDeep,
        tabBarInactiveTintColor: brandColors.inkSoft,
        tabBarStyle: styles.tabBar,
      }}
    >
      {/* Declaration order here IS the order of the bar.
          My World is first, and therefore the tab the app opens on. */}
      <Tabs.Screen
        name="world"
        options={{
          tabBarLabel: ({ color }) => <TabLabel title="My World" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="🏜️" color={color} />,
          tabBarAccessibilityLabel: 'My World',
        }}
      />
      <Tabs.Screen
        name="farm"
        options={{
          tabBarLabel: ({ color }) => <TabLabel title="Farm" kicker="USE SEEDS" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="🧑‍🌾" color={color} />,
          tabBarAccessibilityLabel: 'Farm — use Seeds',
        }}
      />
      <Tabs.Screen
        name="quest"
        options={{
          tabBarLabel: ({ color }) => <TabLabel title="Quest" kicker="GROW SEEDS" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="🧭" color={color} />,
          tabBarAccessibilityLabel: 'Quest — grow Seeds',
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          tabBarLabel: ({ color }) => <TabLabel title="Community" kicker="POSTS" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="🤝" color={color} />,
          tabBarAccessibilityLabel: 'Community — posts',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarLabel: ({ color }) => <TabLabel title="Me" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="🧺" color={color} />,
          tabBarAccessibilityLabel: 'Me',
        }}
      />

      {/* Route kept, tab removed — see the note above. */}
      <Tabs.Screen name="map" options={{ href: null }} />
    </Tabs>
  );
}

/**
 * Tab title with the spec's optional subtitle underneath.
 *
 * The kicker is tiny and tracked out so it reads as a quiet hint about what the
 * tab is FOR ("GROW SEEDS" / "USE SEEDS") rather than as a second label.
 */
function TabLabel({
  title,
  kicker,
  color,
}: {
  title: string;
  kicker?: string;
  color: ColorValue;
}) {
  return (
    <View style={styles.label}>
      <BrandText variant="caption" weight="medium" center style={{ color }}>
        {title}
      </BrandText>
      {kicker ? (
        <BrandText variant="caption" center style={[styles.kicker, { color }]}>
          {kicker}
        </BrandText>
      ) : null}
    </View>
  );
}

/** Emoji stand-ins. Replace with hand-drawn tab icons when the art lands. */
function TabGlyph({ glyph, color }: { glyph: string; color: ColorValue }) {
  return <BrandText variant="body" style={{ color }}>{glyph}</BrandText>;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: brandColors.bg,
  },
  tabBar: {
    backgroundColor: brandColors.bg,
    borderTopColor: brandColors.line,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: brandSpacing.xs,
    height: TAB_BAR_HEIGHT,
  },
  label: { alignItems: 'center' },
  kicker: { fontSize: 8, lineHeight: 11, letterSpacing: 0.6, opacity: 0.75 },
});
