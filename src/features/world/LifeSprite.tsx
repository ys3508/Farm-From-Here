import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';

import { FLAVOR_VISIBLE_MS, IDLE_LOOP_MS, TAP_REACTION_MS } from '@/config/myWorld';
import { BrandText, brandColors, brandRadius, brandSpacing } from '@/design/brand';

import { flavorLineFor } from './flavorText';
import type { Life } from './lives';
import { Greening } from './Greening';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * A LIFE — one watercolour creature standing on the dunes.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * ART STATUS: V1 draws a PLACEHOLDER (see PlaceholderLife below). The real
 * pieces are hand-drawn watercolour collage and do not exist yet. The house
 * rule is to leave a clearly-marked stand-in rather than fake a painting
 * (CLAUDE.md invariant 10) — so this is deliberately a simple vector shape that
 * nobody could mistake for the finished thing.
 *
 * ⚠️ NO photo→watercolour pipeline. That is V2 and needs the farmer side, which
 *    does not exist.
 */

export type LifeSpriteProps = {
  life: Life;
  /** Screen placement, already projected from the life's world coordinate. */
  left: number;
  top: number;
  size: number;
  /** Greening level from the user's Growth. Vegetation at this life's base. */
  greeningLevel: number;
  /**
   * ┌────────────────────────────────────────────────────────────────────────┐
   * │ THE ZOOM SEAM — this is the whole reason the tap is a prop.            │
   * │                                                                        │
   * │ The product's intended navigation is                                   │
   * │     MY WORLD → (zoom into a life) MY GROVE → (tap tree) tree detail    │
   * │                                                                        │
   * │ V1 does NOT build any of that: no GROVE, no tree detail, no photo      │
   * │ stream, no growth stages, no milestone timeline. So V1 passes nothing  │
   * │ here and a tap plays the light interaction below instead.              │
   * │                                                                        │
   * │ When GROVE ships it supplies this callback and the zoom takes over —   │
   * │ no rewrite of this component, and no popup-card or push-a-screen       │
   * │ decision baked in now that would have to be undone.                    │
   * └────────────────────────────────────────────────────────────────────────┘
   */
  onZoomToDetail?: (life: Life) => void;
};

export function LifeSprite({
  life,
  left,
  top,
  size,
  greeningLevel,
  onZoomToDetail,
}: LifeSpriteProps) {
  const [tapCount, setTapCount] = useState(0);
  const [flavor, setFlavor] = useState<string | null>(null);

  const bob = useRef(new Animated.Value(0)).current;
  const react = useRef(new Animated.Value(0)).current;
  const flavorFade = useRef(new Animated.Value(0)).current;

  /* ── Idle breathing ──────────────────────────────────────────────────────
   * Slow on purpose. This world is calm; a jaunty loop would make it a game. */
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: 1,
          duration: IDLE_LOOP_MS / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: IDLE_LOOP_MS / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);

  /**
   * Fade the flavour line in, hold it, then fade it out.
   *
   * This has to live in an effect rather than in the tap handler. The line's
   * view only mounts once `flavor` is set, so starting the fade synchronously
   * inside the handler runs it against a view that does not exist yet — the
   * value never reaches the mounted node and the line sits at opacity 0
   * forever. Running it after the render fixes that.
   *
   * Keyed on `tapCount` as well as the text, so tapping twice restarts the
   * timer even in the unlikely case the same line comes up again.
   */
  useEffect(() => {
    if (!flavor) return;
    console.log('[probe] flavor effect running', flavor, tapCount);

    flavorFade.setValue(0);
    Animated.timing(flavorFade, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => console.log('[probe] fade-in done', finished, (flavorFade as unknown as {__getValue():number}).__getValue()));

    const timer = setTimeout(() => {
      Animated.timing(flavorFade, {
        toValue: 0,
        duration: 380,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setFlavor(null);
      });
    }, FLAVOR_VISIBLE_MS);

    return () => clearTimeout(timer);
  }, [flavor, tapCount, flavorFade]);

  /**
   * The light interaction: a small bob and one hand-written line.
   *
   * ⚠️ THIS IS THE WHOLE INTERACTION. It is local animation plus a local
   *    string, and it must stay that way — no dialogue, no AI, no model call,
   *    no back-and-forth, no feeding UI, no presence outside the app. If a
   *    change here needs the network, it has been overbuilt. See flavorText.ts.
   */
  const playLightInteraction = () => {
    const next = tapCount + 1;
    setTapCount(next);
    setFlavor(flavorLineFor(life.id, next));

    react.setValue(0);
    Animated.sequence([
      Animated.timing(react, {
        toValue: 1,
        duration: TAP_REACTION_MS * 0.42,
        easing: Easing.out(Easing.back(2.4)),
        useNativeDriver: true,
      }),
      Animated.timing(react, {
        toValue: 0,
        duration: TAP_REACTION_MS * 0.58,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
    // The line's own fade is driven by the effect above, once it has mounted.
  };

  const handlePress = () => {
    // The seam. Today this is always undefined; when GROVE lands it is not.
    if (onZoomToDetail) {
      onZoomToDetail(life);
      return;
    }
    playLightInteraction();
  };

  const translateY = Animated.add(
    bob.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.035] }),
    react.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.11] }),
  );
  const scale = react.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });

  const label = life.nickname ?? life.name;

  return (
    <View style={[styles.root, { left, top, width: size, height: size }]}>
      {/* Vegetation sits BEHIND the sprite, so the life stands in the grass. */}
      <Greening level={greeningLevel} size={size} />

      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint="Say hello"
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[styles.sprite, { transform: [{ translateY }, { scale }] }]}>
          <PlaceholderLife size={size} sparkle={react} />
        </Animated.View>
      </Pressable>

      {flavor ? (
        <Animated.View
          pointerEvents="none"
          // Opacity only, and deliberately no transform: the line holds still
          // while the creature bobs under it. Sharing the sprite's animated
          // transform also stopped the fade from ever reaching the DOM, since
          // the bubble mounts after the tap that starts it.
          style={[styles.flavor, { bottom: size * 0.92, opacity: flavorFade }]}
        >
          <BrandText textRole="whisper" tone="ink" center>
            {flavor}
          </BrandText>
        </Animated.View>
      ) : null}

      {/*
        Marks the stand-in as a stand-in, so a screenshot of the world can never
        be mistaken for delivered art. Dev builds only — it is a note to us, not
        part of the world.
      */}
      {__DEV__ && life.art === 'placeholder' ? (
        <View pointerEvents="none" style={styles.artTag}>
          <BrandText textRole="hint" tone="inkSoft" center>
            placeholder — replace with real watercolour asset
          </BrandText>
        </View>
      ) : null}
    </View>
  );
}

/**
 * THE STAND-IN. A simple vector shape, not artwork.
 *
 * It only has to do two things: sit correctly on the sand, and read as "a life"
 * rather than a UI icon. Everything about it — flat fills, no texture, no paper
 * grain — is meant to look provisional.
 *
 * REPLACE WITH THE REAL WATERCOLOUR ASSET. When the painted pieces arrive this
 * becomes an <Image>, and nothing else in this file needs to change.
 */
function PlaceholderLife({ size, sparkle }: { size: number; sparkle: Animated.Value }) {
  const sparkleOpacity = sparkle.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.9, 0],
  });

  // Memoised so the sparkle animation does not rebuild the tree every frame.
  const body = useMemo(
    () => (
      <Svg width="100%" height="100%" viewBox="0 0 100 100">
        {/* contact shadow — what makes it stand ON the sand, not float above */}
        <Ellipse cx="50" cy="93" rx="24" ry="5.5" fill="#B9A98C" opacity={0.28} />

        {/* two leaf ears, behind the body */}
        <Path d="M34 44 C 24 30, 26 18, 36 16 C 43 22, 43 36, 38 46 Z" fill="#7FA95C" />
        <Path d="M66 44 C 76 30, 74 18, 64 16 C 57 22, 57 36, 62 46 Z" fill="#6E9950" />

        {/* body */}
        <Ellipse cx="50" cy="60" rx="30" ry="29" fill="#A8C97E" />
        <Ellipse cx="43" cy="53" rx="19" ry="17" fill="#BEDA95" opacity={0.75} />

        {/* face — restrained, three marks */}
        <Circle cx="41" cy="57" r="2.6" fill={brandColors.ink} />
        <Circle cx="59" cy="57" r="2.6" fill={brandColors.ink} />
        <Path
          d="M44 67 C 47 70.5, 53 70.5, 56 67"
          stroke={brandColors.ink}
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
        />
      </Svg>
    ),
    [],
  );

  return (
    <View style={{ width: size, height: size }}>
      {body}
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity: sparkleOpacity }]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 100">
          <G fill={brandColors.accentWarm}>
            <Path d="M22 34 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2 z" />
            <Path d="M79 42 l1.6 4 4 1.6 -4 1.6 -1.6 4 -1.6 -4 -4 -1.6 4 -1.6 z" />
            <Path d="M52 20 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4 z" />
          </G>
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute' },
  sprite: { flex: 1 },
  flavor: {
    position: 'absolute',
    left: '50%',
    width: 190,
    marginLeft: -95,
    paddingHorizontal: brandSpacing.md,
    paddingVertical: brandSpacing.sm,
    borderRadius: brandRadius.md,
    // Warm ivory and semi-transparent: the UI recedes and the dunes read
    // through it. Never an opaque game-style speech bubble.
    backgroundColor: 'rgba(247, 244, 236, 0.88)',
  },
  artTag: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    width: 170,
    marginLeft: -85,
  },
});
