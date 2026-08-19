/**
 * STEP 2A — the farmer application.
 * Spec: revise/2026-08-19-step2a-farmer-application.md
 *
 * Import from '@/features/farmer/application', never from the individual files.
 */
export { ApplicationForm, type ApplicationFormProps } from './ApplicationForm';
export {
  applicationPhotoUrl,
  applicationsOffline,
  checkEligibility,
  createApplication,
  loadCurrentApplication,
  submitApplication,
  updateApplication,
  withdrawApplication,
  type ApplicationBundle,
  type ApplicationDraft,
} from './api';
export { addressLookupAvailable, suggestAddresses, type AddressSuggestion } from './geocode';
export {
  useFarmApplication,
  type ApplicationState,
  type FarmApplicationHook,
} from './useFarmApplication';
