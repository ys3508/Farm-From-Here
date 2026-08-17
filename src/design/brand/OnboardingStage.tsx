import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

import { scenes, type SceneName } from './SceneBackground';
import { brandColors, scrim } from './tokens';

export type OnboardingStageProps = {
  scene: SceneName;
  /** The card. Rendered below the illustration, filling the rest of the screen. */
  children: React.ReactNode;
};

/**
 * Layout for the login and sign-up screens.
 *
 * The illustration owns the top band and the card starts where the band ends —
 * the card never sits on top of the artwork.
 *
 * EVERY SCENE IS DRAWN AT THE SAME WIDTH, so the warm-white margins down the
 * sides are identical on login and sign up. Aspect ratio is never altered: the
 * art is scaled to that width and ANCHORED TO THE BOTTOM, so anything taller
 * than the band is trimmed off the TOP. The dog and the path live at the bottom
 * of these paintings, which is exactly what that keeps (owner, 2026-08-17).
 */
export function OnboardingStage({ scene, children }: OnboardingStageProps) {
  const { width, height } = useWindowDimensions();

  const bandHeight = height * scrim.revealFraction;
  const artWidth = width * (1 - scrim.artSideInset * 2);

  const art = scenes[scene];
  // Full height the art wants at this width. Taller than the band means the top
  // is cropped; shorter would letterbox, which none of the current scenes do.
  const artHeight = artWidth / (art.width / art.height);

  return (
    <View style={styles.root}>
      <View style={[styles.band, { height: bandHeight }]}>
        <View style={[styles.window, { width: artWidth }]}>
          <Image
            source={art.source}
            resizeMode="cover"
            style={{ width: artWidth, height: artHeight }}
            accessibilityIgnoresInvertColors
          />
        </View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandColors.bg },
  band: { width: '100%', alignItems: 'center' },
  /**
   * Clips the art to the band. `justifyContent: flex-end` is what anchors the
   * image to the bottom, so the crop comes off the top rather than the feet.
   */
  window: { height: '100%', overflow: 'hidden', justifyContent: 'flex-end' },
});
