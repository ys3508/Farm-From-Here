import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
  type NativeSyntheticEvent,
  type TextLayoutEventData,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandText, SceneBackground, brandColors, brandSpacing, type SceneName } from '@/design/brand';

export type SceneTimings = {
  /** ms after mount when each layer starts fading in. */
  title: number;
  subtitle: number;
  script: number;
  /** ms after mount when the whole screen begins fading out. */
  exit: number;
};

/**
 * 3s total, for BOTH the new-user and returning-user splash. The two versions
 * differ by one line of text and nothing else — same illustration, same rhythm,
 * same placement (owner, 2026-08-17).
 */
export const SPLASH_TIMINGS: SceneTimings = {
  title: 400,
  subtitle: 1000,
  script: 1800,
  exit: 3000,
};

const FADE_IN_MS = 700;
const FADE_OUT_MS = 450;

export type CinematicSceneProps = {
  scene: SceneName;
  /**
   * The handwritten line — the ONLY thing that differs between the new-user and
   * returning-user splash.
   *
   * `null` renders nothing, for the brief moment before we have read local
   * storage to find out which line to show. It resolves in a millisecond or
   * two and the line does not fade in until 1.8s, so no one ever sees a gap —
   * but this way nobody sees the wrong line flash either.
   */
  scriptLine: string | null;
  timings: SceneTimings;
  /** Called once, after the fade-out completes or the user taps to skip. */
  onFinish: () => void;
};

/**
 * The layered fade-in used by both onboarding cinematics.
 *
 * One component so splash and welcome-back can never drift apart — same faces,
 * same rhythm, same placement, only the illustration, the script line and the
 * timings differ.
 *
 * Tappable to skip at any point: a returning user must never be held hostage by
 * an animation.
 */
export function CinematicScene({ scene, scriptLine, timings, onFinish }: CinematicSceneProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const title = useRef(new Animated.Value(0)).current;
  const subtitle = useRef(new Animated.Value(0)).current;
  const script = useRef(new Animated.Value(0)).current;
  const screen = useRef(new Animated.Value(1)).current;

  // Once the wordmark has wrapped, keep it wrapped. The wrapped style is
  // smaller, so re-measuring could make it fit again and oscillate forever.
  const [wrapped, setWrapped] = useState(false);

  const finished = useRef(false);

  const finish = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    Animated.timing(screen, {
      toValue: 0,
      duration: FADE_OUT_MS,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => onFinish());
  }, [screen, onFinish]);

  useEffect(() => {
    const fadeIn = (value: Animated.Value, delay: number) =>
      Animated.timing(value, {
        toValue: 1,
        duration: FADE_IN_MS,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      });

    const animation = Animated.parallel([
      fadeIn(title, timings.title),
      fadeIn(subtitle, timings.subtitle),
      fadeIn(script, timings.script),
    ]);
    animation.start();

    const exitTimer = setTimeout(finish, timings.exit);

    return () => {
      clearTimeout(exitTimer);
      animation.stop();
    };
  }, [title, subtitle, script, timings, finish]);

  const onWordmarkLayout = (event: NativeSyntheticEvent<TextLayoutEventData>) => {
    if (!wrapped && event.nativeEvent.lines.length > 1) setWrapped(true);
  };

  return (
    // The cream ground sits behind the scene so the fade-out reads as a soft
    // dissolve into the app rather than a flash of black.
    <View style={styles.root}>
      <Animated.View style={[styles.fill, { opacity: screen }]}>
        <SceneBackground scene={scene}>
          <Pressable
            style={styles.fill}
            onPress={finish}
            accessibilityRole="button"
            accessibilityLabel="Skip"
            accessibilityHint="Skips the intro and continues"
          >
            {/* Title block sits over the clean sky/cloud band at the top —
                deliberately clear of the door and the grass below. */}
            <View style={[styles.top, { paddingTop: insets.top + height * 0.07 }]}>
              <Animated.View style={{ opacity: title }}>
                <BrandText
                  family="display"
                  weight="light"
                  variant={wrapped ? 'wordmarkWrapped' : 'wordmark'}
                  onImage
                  center
                  onTextLayout={onWordmarkLayout}
                >
                  FARM FROM HERE
                </BrandText>
              </Animated.View>

              <Animated.View style={{ opacity: subtitle }}>
                <BrandText variant="subtitle" weight="medium" onImage center style={styles.subtitle}>
                  Real world. Real growth.
                </BrandText>
              </Animated.View>
            </View>

            <View style={[styles.bottom, { paddingBottom: insets.bottom + brandSpacing.xxl }]}>
              <Animated.View style={{ opacity: script }}>
                {scriptLine ? (
                  <BrandText family="script" variant="script" onImage center>
                    {scriptLine}
                  </BrandText>
                ) : null}
              </Animated.View>
            </View>
          </Pressable>
        </SceneBackground>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandColors.bg },
  fill: { flex: 1 },
  top: {
    // Narrow gutters here on purpose: they buy the wordmark the width it needs
    // to stay on one line at 375pt.
    paddingHorizontal: brandSpacing.lg,
    gap: brandSpacing.md,
    alignItems: 'center',
  },
  subtitle: { marginTop: brandSpacing.xs },
  bottom: {
    marginTop: 'auto',
    paddingHorizontal: brandSpacing.xl,
    alignItems: 'center',
  },
});
