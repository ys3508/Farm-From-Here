import { FarmerOnly, FarmerStub } from '@/features/farmer';

/**
 * ADD AN ADOPTABLE. Reached from My Farm.
 *
 * Note for whoever builds this: the farmer does NOT set the Seeds cost. It is a
 * centrally configured constant shown read-only — farmers pricing adoptions
 * freely would break the Seeds economy (Step 2 §3).
 *
 * Placeholder until Step 2 lands.
 */
export default function NewAdoptableScreen() {
  return (
    <FarmerOnly>
      <FarmerStub
        title="Add something to adopt"
        line="A tree, a crop or an animal, with its own real identity — #1048 stays #1048 whoever adopts it."
        specSection="§3"
      />
    </FarmerOnly>
  );
}
