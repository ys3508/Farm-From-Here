import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, StyleSheet, View, type ColorValue } from 'react-native';

import { TAB_BAR_HEIGHT } from '@/config/myWorld';
import { BrandText, brandColors, brandSpacing } from '@/design/brand';
import { useAuth } from '@/features/auth/AuthProvider';
import { WorldModeProvider, useWorldMode } from '@/features/farmer';

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
 *
 * ────────────────────────────────────────────────────────────────────────────
 * TWO BARS, FIVE SLOTS, ONE NAVIGATOR
 * (revise/2026-08-19-farmer-world-and-tabs.md, Task 2)
 *
 *   My World   │ My World │ Farm     │ Quest │ Community │ Me
 *   Farmer     │ My Farm  │ Post     │ Quest │ Community │ Me
 *                ▲ slot 1   ▲ slot 2   ▲──── identical ────▲
 *
 * ONLY SLOTS 1 AND 2 CHANGE. Quest, Community and Me are the SAME screens, not
 * forks and not copies — they are declared once, and crossing between worlds
 * never touches them, so they do not remount and lose their state.
 *
 * How that is achieved matters, so: this is ONE navigator with every screen
 * declared once, and world switching only flips `href` on `farm` / `post`.
 * `href: null` hides a tab button without unregistering the route, so the
 * remaining buttons keep their declared order — which is why `post` is declared
 * immediately after `farm` rather than at the end.
 *
 * Slot 1 does not even change route: My World and My Farm are two panels of the
 * SAME canvas screen (app/(app)/world.tsx), so only the label and the icon move.
 *
 * `activeWorld` from WorldModeProvider is the single source of truth for which
 * of the two bars is showing; the canvas derives its pan position from the same
 * value. A profile with no `farm_members` row can never reach 'farmer-world',
 * so a pure consumer sees the top row and nothing else — no farmer tabs, no
 * farmer screens, no hints.
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

  // Above the navigator, because the bar itself reads it.
  return (
    <WorldModeProvider>
      <AppTabs />
    </WorldModeProvider>
  );
}

function AppTabs() {
  const { activeWorld } = useWorldMode();
  const inFarmerWorld = activeWorld === 'farmer-world';

  /** `href: null` hides a tab; spreading nothing leaves the default in place. */
  const hiddenWhen = (hidden: boolean): { href: null } | null => (hidden ? { href: null } : null);

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
          My World is first, and therefore the tab the app opens on.

          SLOT 1 — one route, two faces. Both worlds are panels of this same
          screen, so switching changes the label and the glyph and nothing else;
          the canvas is never remounted and the pan is never interrupted. */}
      <Tabs.Screen
        name="world"
        options={{
          tabBarLabel: ({ color }) => (
            <TabLabel title={inFarmerWorld ? 'My Farm' : 'My World'} color={color} />
          ),
          tabBarIcon: ({ color }) => <TabGlyph glyph={inFarmerWorld ? '🚜' : '🏜️'} color={color} />,
          tabBarAccessibilityLabel: inFarmerWorld ? 'My Farm' : 'My World',
        }}
      />

      {/* SLOT 2 — the main action, mirrored. Consumer: Farm, where Seeds are
          SPENT on something real. Farmer: Post, the ~30-second update. Exactly
          one of the two is in the bar at any moment. */}
      <Tabs.Screen
        name="farm"
        options={{
          ...hiddenWhen(inFarmerWorld),
          tabBarLabel: ({ color }) => <TabLabel title="Farm" kicker="USE SEEDS" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="🧑‍🌾" color={color} />,
          tabBarAccessibilityLabel: 'Farm — use Seeds',
        }}
      />
      <Tabs.Screen
        name="post"
        options={{
          ...hiddenWhen(!inFarmerWorld),
          tabBarLabel: ({ color }) => <TabLabel title="Post" kicker="PRODUCE" color={color} />,
          tabBarIcon: ({ color }) => <TabGlyph glyph="📷" color={color} />,
          tabBarAccessibilityLabel: 'Post an update',
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

      {/* Reachable, but never a tab.
          `apply` is where a NON-farmer's right toggle goes. The three farmer
          management screens are reached from inside My Farm — the spec is
          explicit that they do NOT get bottom tabs of their own. */}
      <Tabs.Screen name="apply" options={{ href: null }} />
      <Tabs.Screen name="plot-new" options={{ href: null }} />
      <Tabs.Screen name="adoptable-new" options={{ href: null }} />
      <Tabs.Screen name="farm-profile" options={{ href: null }} />
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
