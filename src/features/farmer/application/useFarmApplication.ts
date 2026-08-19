import { useCallback, useEffect, useState } from 'react';

import type {
  FarmApplication,
  FarmApplicationDocument,
  FarmApplicationMedia,
} from '@/lib/supabase/types';

import { checkEligibility, loadCurrentApplication } from './api';

/**
 * The applicant's own state, and the thing the apply screen routes on.
 *
 * Spec: revise/2026-08-19-step2a-farmer-application.md §7
 *
 * There are five states and each is a different screen:
 *
 *   loading      — say nothing yet
 *   ineligible   — already has a farm, or an application is already in review
 *   none         — the form
 *   pending      — "under review", can withdraw          (verified_farm only)
 *   rejected     — shows review_note, can edit + resubmit
 *   approved     — the farmer world just unlocked
 *
 * It is derived from the row, never stored separately, so the screen and the
 * database cannot disagree about where someone is in the process.
 */

export type ApplicationState =
  | 'loading'
  | 'ineligible'
  | 'none'
  | 'pending'
  | 'rejected'
  | 'approved';

export type FarmApplicationHook = {
  state: ApplicationState;
  application: FarmApplication | null;
  media: FarmApplicationMedia[];
  documents: FarmApplicationDocument[];
  /** Machine code from the eligibility check, for the "why not" copy. */
  ineligibleReason: string | null;
  reload: () => Promise<void>;
};

export function useFarmApplication(profileId: string | undefined): FarmApplicationHook {
  const [application, setApplication] = useState<FarmApplication | null>(null);
  const [media, setMedia] = useState<FarmApplicationMedia[]>([]);
  const [documents, setDocuments] = useState<FarmApplicationDocument[]>([]);
  const [ineligibleReason, setIneligibleReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!profileId) {
      setApplication(null);
      setMedia([]);
      setDocuments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const bundle = await loadCurrentApplication(profileId);
    setApplication(bundle.application);
    setMedia(bundle.media);
    setDocuments(bundle.documents);

    /* Eligibility is only asked when there is NOTHING open. With a pending or
     * rejected row in hand the answer is already known — and the check would
     * report `application_pending` for the very application being displayed,
     * which would show "you already have one in review" instead of the review
     * screen itself. */
    if (!bundle.application) {
      const eligibility = await checkEligibility(profileId);
      setIneligibleReason(eligibility.ok ? null : eligibility.reason);
    } else {
      setIneligibleReason(null);
    }

    setLoading(false);
  }, [profileId]);

  useEffect(() => {
    void load();
  }, [load]);

  const state: ApplicationState = (() => {
    if (loading) return 'loading';
    if (application) {
      if (application.status === 'approved') return 'approved';
      if (application.status === 'rejected') return 'rejected';
      if (application.status === 'pending') return 'pending';
    }
    if (ineligibleReason) return 'ineligible';
    return 'none';
  })();

  return { state, application, media, documents, ineligibleReason, reload: load };
}
