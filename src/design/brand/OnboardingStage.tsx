import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';

import { BrandText } from './BrandText';
import { scenes, type SceneName } from './SceneBackground';
import { brandColors, brandSpacing, scrim } from './tokens';

export type OnboardingStageProps = {
  scene: SceneName;
  /** The card. Rendered below the illustration, filling the rest of the screen. */
  children: React.ReactNode;
};

/**
 * Layout for the login and sign-up screens.
 *
 * THE WHOLE PAINTING IS VISIBLE. The illustration is NOT cropped and the card
 * does NOT sit on top of it — the image gets the top band of the screen to
 * itself and the card starts where the image ends (owner, 2026-08-17).
 *
 * Because the art is portrait and the band is wider than it is tall, fitting the
 * whole image leaves warm-white margins down each side. That is the accepted
 * trade for never cropping: the owner chose keeping the 52/48 split over an
 * edge-to-edge crop. The two scenes have different aspect ratios, so signup
 * (941x1672) shows noticeably wider margins than login (1086x1448).
 *
 * The splash is unaffected — it stays full-bleed via SceneBackground.
 */
export function OnboardingStage({ scene, children }: OnboardingStageProps) {
  const { width, height } = useWindowDimensions();

  const bandHeight = height * scrim.revealFraction;

  // How wide the image actually renders once contained in the band. The wordmark
  // is clamped to this, so white type can never drift off the painting and onto
  // the cream margin, where it would be invisible.
  const art = scenes[scene];
  const renderedWidth = Math.min(width, bandHeight * (art.width / art.height));

  return (
    <View style={styles.root}>
      <View style={[styles.band, { height: bandHeight }]}>
        <Image
          source={art.source}
          resizeMode="contain"
          style={styles.image}
          accessibilityIgnoresInvertColors
        />

        {/* Wordmark rides the lower edge of the painting itself. */}
        <View style={styles.wordmarkLayer} pointerEvents="none">
          <View style={{ width: renderedWidth }}>
            <BrandText family="display" weight="light" variant="wordmark" onImage center>
              FARM FROM HERE
            </BrandText>
          </View>
        </View>
      </View>

      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandColors.bg },
  band: { width: '100%', justifyContent: 'flex-end' },
  image: { width: '100%', height: '100%' },
  wordmarkLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: brandSpacing.lg,
    alignItems: 'center',
  },
});
