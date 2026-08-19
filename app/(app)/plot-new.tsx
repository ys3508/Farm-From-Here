import { FarmerOnly, FarmerStub } from '@/features/farmer';

/**
 * CREATE A PLOT. Reached from My Farm, never from a bottom tab — management
 * actions live inside the farmer's home, not in the bar.
 *
 * Placeholder until Step 2 lands.
 */
export default function NewPlotScreen() {
  return (
    <FarmerOnly>
      <FarmerStub
        title="Create a plot"
        line="A plot is the unit you post updates about. One update reaches everyone who adopted something in it."
        specSection="§3"
      />
    </FarmerOnly>
  );
}
