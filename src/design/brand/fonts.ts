/**
 * Brand font loading.
 *
 * Deep imports, not the package barrel: the barrel `require`s every weight and
 * Metro bundles all of them, which shipped megabytes of unused fonts. Only the
 * eight faces below are bundled.
 *
 * These are merged with the legacy fonts in app/_layout.tsx — both sets load in
 * one `useFonts` call, because onboarding uses these while the not-yet-reskinned
 * screens still use Fraunces/Nunito.
 */
import { Cormorant_300Light } from '@expo-google-fonts/cormorant/300Light';
import { Cormorant_400Regular } from '@expo-google-fonts/cormorant/400Regular';
import { Cormorant_500Medium } from '@expo-google-fonts/cormorant/500Medium';
import { DancingScript_500Medium } from '@expo-google-fonts/dancing-script/500Medium';
import { DancingScript_600SemiBold } from '@expo-google-fonts/dancing-script/600SemiBold';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';

export const brandFonts = {
  Cormorant_300Light,
  Cormorant_400Regular,
  Cormorant_500Medium,
  DancingScript_500Medium,
  DancingScript_600SemiBold,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};
