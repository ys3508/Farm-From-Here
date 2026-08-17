import { Image, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { BrandText } from './BrandText';
import { brandColors, brandSpacing } from './tokens';

/**
 * The onboarding illustrations, referenced from the bundled assets folder.
 *
 * Originals live in ui_design/onboarding/ (the owner's working directory) and
 * are copied into assets/onboarding/ — Expo cannot load from an arbitrary
 * Desktop path at runtime, so the copy is what actually ships.
 */
/**
 * Intrinsic pixel size is recorded here alongside each require.
 *
 * `Image.resolveAssetSource` does not exist on react-native-web and expo-asset
 * is not a direct dependency, so there is no runtime way to ask an image how
 * big it is that works everywhere. These are committed, fixed assets, so the
 * dimensions are simply stated.
 *
 * ⚠️ REPLACING ANY ARTWORK MEANS UPDATING ITS NUMBERS HERE. They decide how wide
 * the picture renders, which decides how wide the wordmark is allowed to be.
 */
type Scene = { source: ImageSourcePropType; width: number; height: number };

export const scenes: Record<'splash' | 'welcome' | 'login' | 'signup', Scene> = {
  splash: { source: require('../../../assets/onboarding/splash.png'), width: 1024, height: 1536 },
  welcome: { source: require('../../../assets/onboarding/welcome.png'), width: 1024, height: 1536 },
  login: { source: require('../../../assets/onboarding/login-bg.png'), width: 1086, height: 1448 },
  signup: { source: require('../../../assets/onboarding/signup-bg.png'), width: 941, height: 1672 },
};

export type SceneName = keyof typeof scenes;

export type SceneBackgroundProps = {
  scene: SceneName;
  children?: React.ReactNode;
};

/**
 * Full-bleed illustration behind a screen.
 *
 * `resizeMode="cover"` on purpose: the art is near-portrait (roughly 2:3) and
 * tall phones are narrower than that, so `contain` would letterbox and `stretch`
 * would distort the clouds. Cover crops the sides slightly and keeps the door,
 * the dog and the cloud mass intact.
 */
export function SceneBackground({ scene, children }: SceneBackgroundProps) {
  return (
    <View style={styles.root}>
      {/*
       * Absolutely positioned rather than an <ImageBackground> wrapper: pinning
       * to the edges makes "fill the screen, crop the overflow" depend only on
       * this container, not on whether every ancestor happens to have a resolved
       * height. ImageBackground with a percentage height is the usual source of
       * a background that silently stops short on one platform.
       */}
      <Image
        source={scenes[scene].source}
        resizeMode="cover"
        style={styles.image}
        accessibilityIgnoresInvertColors
      />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

/**
 * A CLEARLY-MARKED SLOT for artwork that has not been delivered yet.
 *
 * All four onboarding illustrations exist today, so nothing renders this right
 * now. It stays because later onboarding scenes (the "Plant Your Roots" quest in
 * Step 7) will need it, and because the house rule is to leave a visible slot
 * rather than fake a painting.
 */
export function SceneSlot({ brief, assetName }: { brief: string; assetName: string }) {
  return (
    <View style={styles.slot}>
      <BrandText variant="caption" weight="semibold" tone="inkSoft" center>
        ILLUSTRATION SLOT
      </BrandText>
      <BrandText variant="small" tone="inkSoft" center>
        {brief}
      </BrandText>
      <BrandText variant="caption" tone="inkSoft" center>
        assets/onboarding/{assetName}
      </BrandText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandColors.bg, overflow: 'hidden' },
  // Explicit box rather than StyleSheet.absoluteFill: on react-native-web the
  // Image otherwise lays out at the asset's intrinsic size (1086x1448) and
  // overflows the screen, so the art renders zoomed and off-centre. Stating
  // width/height outright pins it to the container on every platform.
  image: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  content: { flex: 1 },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: brandSpacing.xs,
    padding: brandSpacing.xl,
    backgroundColor: brandColors.bg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: brandColors.line,
  },
});
