/**
 * MY WORLD — the living-canvas home screen.
 *
 * Import from '@/features/world', never from the individual files.
 * Spec: revise/2026-08-17-my-world.md
 */
export { ComingSoon, type ComingSoonProps } from './ComingSoon';
export { Day1CreatureSlot, type Day1CreatureSlotProps } from './Day1CreatureSlot';
export { EconomyIndicator, type EconomyIndicatorProps } from './EconomyIndicator';
export { Greening, type GreeningProps } from './Greening';
export { LifeSprite, type LifeSpriteProps } from './LifeSprite';
export { MyWorldPanel, type MyWorldPanelProps } from './MyWorldPanel';
export {
  ONBOARDING_STEPS,
  OnboardingOverlay,
  highlights,
  type OnboardingOverlayProps,
  type OnboardingStep,
} from './OnboardingOverlay';
export { StarterBox, type StarterBoxProps } from './StarterBox';
export { WORLD_PLATE, WorldBackground, WorldPlateSlot } from './WorldBackground';
export { flavorLineFor } from './flavorText';
export {
  grantFirstCreature,
  loadLives,
  resetLocalLives,
  saveLifePosition,
  usesLocalLives,
  type GrantResult,
  type Life,
} from './lives';
export { useOnboardingSeen } from './useOnboardingSeen';
export { useWorldLives } from './useWorldLives';
export {
  clampToDunes,
  placeLife,
  project,
  scaleForId,
  scatterPosition,
  type ScreenPlacement,
  type Viewport,
  type WorldPoint,
} from './worldCoords';
