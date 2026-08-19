import { FarmerOnly, FarmerStub } from '@/features/farmer';

/**
 * EDIT FARM PROFILE. Reached from My Farm.
 *
 * Deliberately small in Step 2: description, photos and contact only. No
 * employee management and no permissions system.
 *
 * Placeholder until Step 2 lands.
 */
export default function FarmProfileScreen() {
  return (
    <FarmerOnly>
      <FarmerStub
        title="Edit farm profile"
        line="Your description, your photos, and how people reach you."
        specSection="§3"
      />
    </FarmerOnly>
  );
}
