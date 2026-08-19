# Asset contract

Use this contract for prototypes and future integration discussions. It does not require a database table or a Farmer interface.

```ts
type AdoptableAssetRequest = {
  sourcePhoto: {
    uri: string;
    storagePath?: string;
  };
  target: {
    /** Existing adoptable id when this is already a product object. */
    adoptableId?: string;
    subjectType: 'crop' | 'tree' | 'flower' | 'animal' | 'insect' | 'bird' | 'other';
    description: string;
    /** User-confirmed crop, mask, or selection reference when the source has multiple subjects. */
    selection?: string;
  };
  identityAnchors: string[];
  /** Counts, ratios, crowding, growth directions — what the density axis must preserve. */
  densityRecord?: string;
};

type AdoptableAssetResult = {
  image: {
    uri: string;
    format: 'png';
    /** False is a legitimate, recordable outcome — a failed extraction must be representable. */
    transparentBackground: boolean;
    width: number;
    height: number;
  };
  identityAnchorsPreserved: string[];
  artisticChoices: string[];
  provenance: {
    sourcePhotoRef: string;
    visualLanguage: 'photo-adoptable-world-asset';
    generatedAt: string;
    revision: number;
  };
  qa: {
    /** Which of the eight SKILL.md acceptance gates passed. */
    gatesPassed: number[];
    accepted: boolean;
    notes?: string;
  };
};
```

## Integration boundaries

- Preserve the original farmer photo independently from the generated derivative.
- Attach a generated asset to a specific `adoptable` only after the product has confirmed the target identity.
- Treat generated assets as revisable derivatives; do not overwrite the original photo.
- Do not make the output publicly visible or production-persistent until product storage, permissions, review, and My World rendering are designed.
