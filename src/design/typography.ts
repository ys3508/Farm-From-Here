/**
 * Font loading. Called once from the root layout; nothing else should load fonts.
 *
 * Fraunces stands in for the hand-lettered display face and Nunito for warm,
 * legible body copy. If real hand-lettered assets are commissioned later, swap
 * the map below and `fontFamily` in tokens.ts — no component changes needed.
 *
 * NOTE: these are deep imports on purpose. The package barrel
 * (`from '@expo-google-fonts/fraunces'`) `require`s all 18 weights, and Metro
 * bundles every asset it can see — that shipped ~4 MB of fonts the app never
 * renders. Importing the exact weight keeps only the 7 files below.
 */
import { Fraunces_400Regular } from '@expo-google-fonts/fraunces/400Regular';
import { Fraunces_600SemiBold } from '@expo-google-fonts/fraunces/600SemiBold';
import { Fraunces_600SemiBold_Italic } from '@expo-google-fonts/fraunces/600SemiBold_Italic';
import { Fraunces_700Bold } from '@expo-google-fonts/fraunces/700Bold';
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';

export const appFonts = {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_600SemiBold_Italic,
  Fraunces_700Bold,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
};
