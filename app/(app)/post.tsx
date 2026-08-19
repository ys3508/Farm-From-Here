import { FarmerOnly, FarmerStub } from '@/features/farmer';

/**
 * POST — farmer tab slot 2, and the reason the farmer bar exists.
 *
 * ONE JOB: the camera-first, ~30-second update. Nothing else may move into this
 * slot; keeping it to one job is what makes posting an ongoing update easier
 * than posting to social media, which is the whole product bet
 * (revise/skills/2026-08-17-step2-farmer-portal.md §4).
 *
 * Updates attach to the PLOT, never to an individual adoptable — one post fans
 * out to everyone who adopted something in that plot (CLAUDE.md invariant 3).
 *
 * Placeholder until Step 2 lands. The tab, the route and the position are real.
 */
export default function PostScreen() {
  return (
    <FarmerOnly>
      <FarmerStub
        title="Post an update"
        line="One photo, a line of text, done — about thirty seconds, from the field."
        specSection="§4"
      />
    </FarmerOnly>
  );
}
