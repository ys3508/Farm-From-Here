/**
 * The brand design system — import from '@/design/brand'.
 *
 * This is the standard going forward. Onboarding uses it today; every other
 * screen migrates here as it gets re-skinned. See tokens.ts for the scope note.
 */
export * from './tokens';
export { brandFonts } from './fonts';
export { BrandText, type BrandTextProps } from './BrandText';
export { textRoles, type TextRole, type TextRoleStyle } from './textRoles';
export { BrandButton } from './BrandButton';
export { BrandField } from './BrandField';
export { ScrimCard } from './ScrimCard';
export { OnboardingStage } from './OnboardingStage';
export { StepProgress } from './StepProgress';
export { Collapsible } from './Collapsible';
export { SceneBackground, SceneSlot, scenes, type SceneName } from './SceneBackground';
