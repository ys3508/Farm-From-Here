import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  APPLICATION_COPY,
  MAX_APPLICATION_DOCUMENTS,
  MAX_APPLICATION_PHOTOS,
  MIN_APPLICATION_PHOTOS,
  SIZE_BUCKETS,
  SUBMIT_ERROR_COPY,
  TIERS,
} from '@/config/farmerApplication';
import {
  BrandButton,
  BrandField,
  BrandText,
  brandColors,
  brandRadius,
  brandSpacing,
} from '@/design/brand';
import type {
  FarmApplication,
  FarmApplicationDocument,
  FarmApplicationMedia,
  FarmSizeBucket,
  FarmType,
  LocationPrecision,
} from '@/lib/supabase/types';

import {
  applicationPhotoUrl,
  createApplication,
  pickApplicationDocuments,
  pickApplicationPhotos,
  removeApplicationDocument,
  removeApplicationPhoto,
  submitApplication,
  updateApplication,
  uploadApplicationDocument,
  uploadApplicationPhoto,
  type ApplicationDraft,
} from './api';
import { addressLookupAvailable, suggestAddresses, type AddressSuggestion } from './geocode';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE APPLICATION FORM — one screen, after the tier is chosen.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-step2a-farmer-application.md §3
 *
 * A wizard was the obvious shape and is the wrong one here: this is filled in
 * once, often standing in a field, and a farmer should be able to see the whole
 * ask before deciding to start. So it is a single scroll with the tier already
 * settled above it.
 *
 * WHAT IT REFUSES TO DO:
 *   ✗ demand a street address — city and state is a complete answer
 *   ✗ demand a document type from a dropdown — there is no checklist
 *   ✗ measure anything — size is a coarse bucket
 *   ✗ take money, or mention it
 *
 * ORDER ON SUBMIT (this is why the row is created before the files):
 *   create row → upload photos/documents → submit RPC → individual is approved.
 * See api.ts for why approving any earlier would seed an empty album.
 */

export type ApplicationFormProps = {
  profileId: string;
  farmType: FarmType;
  /** An existing rejected application being edited, if any. */
  existing?: FarmApplication | null;
  existingMedia?: FarmApplicationMedia[];
  existingDocuments?: FarmApplicationDocument[];
  /** Called after a successful submit, with the resulting status. */
  onSubmitted: (status: string) => void;
  onCancel: () => void;
};

type LocalPhoto = { id: string; uri: string; row?: FarmApplicationMedia };
type LocalDocument = { id: string; name: string; row?: FarmApplicationDocument };

export function ApplicationForm({
  profileId,
  farmType,
  existing = null,
  existingMedia = [],
  existingDocuments = [],
  onSubmitted,
  onCancel,
}: ApplicationFormProps) {
  const tier = TIERS[farmType];
  const isVerifiedFarm = farmType === 'verified_farm';

  const [farmName, setFarmName] = useState(existing?.farm_name ?? '');
  const [about, setAbout] = useState(existing?.about_text ?? '');
  const [contactName, setContactName] = useState(existing?.contact_name ?? '');
  const [contactPhone, setContactPhone] = useState(existing?.contact_phone ?? '');
  const [contactEmail, setContactEmail] = useState(existing?.contact_email ?? '');
  const [link, setLink] = useState(existing?.links?.[0]?.url ?? '');
  const [size, setSize] = useState<FarmSizeBucket | null>(existing?.size ?? null);

  const [address, setAddress] = useState(existing?.address ?? '');
  const [coords, setCoords] = useState<{ lat: number | null; lng: number | null }>({
    lat: existing?.latitude ?? null,
    lng: existing?.longitude ?? null,
  });
  const [precision, setPrecision] = useState<LocationPrecision>(
    existing?.location_precision ?? 'city',
  );
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);

  const [photos, setPhotos] = useState<LocalPhoto[]>(
    existingMedia.map((row) => ({ id: row.id, uri: applicationPhotoUrl(row.storage_path), row })),
  );
  const [documents, setDocuments] = useState<LocalDocument[]>(
    existingDocuments.map((row) => ({
      id: row.id,
      name: row.original_filename ?? 'Document',
      row,
    })),
  );

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  /* ── Address autocomplete ────────────────────────────────────────────────
   * Optional the whole way down: with no Mapbox token this never fires and the
   * typed address stands on its own. Debounced, and every in-flight request is
   * aborted when the query moves on. */
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!addressLookupAvailable || address.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setSuggestions(await suggestAddresses(address, controller.signal));
    }, 350);
    return () => clearTimeout(timer);
  }, [address]);

  const chooseSuggestion = (suggestion: AddressSuggestion) => {
    setAddress(suggestion.label);
    setCoords({ lat: suggestion.latitude, lng: suggestion.longitude });
    // The kind of place they picked IS the precision — no need to ask.
    setPrecision(suggestion.precision);
    setSuggestions([]);
  };

  /* ── Files ──────────────────────────────────────────────────────────────── */

  const addPhotos = async () => {
    setNotice(null);
    const remaining = MAX_APPLICATION_PHOTOS - photos.length;
    if (remaining <= 0) {
      setNotice(`That is the maximum of ${MAX_APPLICATION_PHOTOS} photos.`);
      return;
    }

    const picked = await pickApplicationPhotos(remaining);
    if (picked.status === 'denied') {
      setNotice('Photo access is off. Turn it on in Settings to add photos.');
      return;
    }
    if (picked.status !== 'picked') return;

    setPhotos((prev) => [
      ...prev,
      ...picked.uris.slice(0, remaining).map((uri, i) => ({ id: `local-${Date.now()}-${i}`, uri })),
    ]);
  };

  const addDocuments = async () => {
    setNotice(null);
    const picked = await pickApplicationDocuments();
    if (picked.status !== 'picked') return;

    const remaining = MAX_APPLICATION_DOCUMENTS - documents.length;
    setDocuments((prev) => [
      ...prev,
      ...picked.files.slice(0, Math.max(0, remaining)).map((file, i) => ({
        id: `local-doc-${Date.now()}-${i}`,
        name: file.name,
        uri: file.uri,
        mimeType: file.mimeType,
      })),
    ]);
    pendingDocs.current.push(...picked.files.slice(0, Math.max(0, remaining)));
  };

  // Files chosen but not yet uploaded — they go up on submit, once there is an
  // application id to hang them on.
  const pendingDocs = useRef<{ uri: string; name: string; mimeType: string | null }[]>([]);

  const dropPhoto = async (photo: LocalPhoto) => {
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    if (photo.row) await removeApplicationPhoto(photo.row);
  };

  const dropDocument = async (doc: LocalDocument) => {
    setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    pendingDocs.current = pendingDocs.current.filter((f) => f.name !== doc.name);
    if (doc.row) await removeApplicationDocument(doc.row);
  };

  /* ── Submit ─────────────────────────────────────────────────────────────── */

  const missing: string[] = [];
  if (!farmName.trim()) missing.push('a name');
  if (!address.trim()) missing.push('where you grow');
  if (!size) missing.push('roughly how big it is');
  if (!contactName.trim()) missing.push('your name');
  if (!about.trim()) missing.push('a bit about it');
  if (photos.length < MIN_APPLICATION_PHOTOS) missing.push('at least one photo');

  const submit = async () => {
    setNotice(null);
    if (missing.length > 0 || !size) {
      setNotice(`Still needed: ${missing.join(', ')}.`);
      return;
    }

    setBusy(true);
    try {
      const draft: ApplicationDraft = {
        farm_type: farmType,
        farm_name: farmName.trim(),
        description: null,
        address: address.trim(),
        latitude: coords.lat,
        longitude: coords.lng,
        location_precision: precision,
        size,
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim() || null,
        contact_email: contactEmail.trim() || null,
        about_text: about.trim(),
        links: link.trim() ? [{ label: 'Link', url: link.trim() }] : [],
      };

      // 1. The row must exist before anything can be attached to it.
      const saved = existing
        ? await updateApplication(existing.id, draft)
        : await createApplication(profileId, draft);

      if (!saved.ok) {
        setNotice(saved.message);
        return;
      }
      const application = saved.value;

      // 2. Files. Only the ones not already uploaded.
      let order = 0;
      for (const photo of photos) {
        if (photo.row) {
          order += 1;
          continue;
        }
        const uploaded = await uploadApplicationPhoto(profileId, application.id, photo.uri, order);
        if (!uploaded.ok) {
          setNotice(uploaded.message);
          return;
        }
        order += 1;
      }

      let docOrder = 0;
      for (const file of pendingDocs.current) {
        const uploaded = await uploadApplicationDocument(
          profileId,
          application.id,
          file,
          docOrder,
        );
        if (!uploaded.ok) {
          setNotice(uploaded.message);
          return;
        }
        docOrder += 1;
      }
      pendingDocs.current = [];

      // 3. Only now. An individual is approved inside this call.
      const result = await submitApplication(application.id);
      if (!result.ok) {
        setNotice(SUBMIT_ERROR_COPY[result.message] ?? result.message);
        return;
      }
      onSubmitted(result.value.status);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.tierBanner}>
        <BrandText textRole="kicker" tone="inkSoft" style={styles.kicker}>
          APPLYING AS
        </BrandText>
        <BrandText textRole="title" tone="ink">
          {tier.label}
        </BrandText>
        <BrandText textRole="hint" tone="inkSoft">
          {tier.outcome}
        </BrandText>
      </View>

      <BrandField
        label="What do you want it called?"
        value={farmName}
        onChangeText={setFarmName}
        placeholder={isVerifiedFarm ? 'Willow Bend Orchard' : 'The Ojeda backyard'}
        hint={isVerifiedFarm ? undefined : APPLICATION_COPY.nameHelpIndividual}
      />

      {/* ── Location. Coarse is a complete answer, not a fallback. ────────── */}
      <View style={styles.block}>
        <BrandField
          label="Where do you grow?"
          value={address}
          onChangeText={(text) => {
            setAddress(text);
            // Typed by hand = we do not know it is exact. Choosing a suggestion
            // is what upgrades this.
            setCoords({ lat: null, lng: null });
            setPrecision('city');
          }}
          placeholder="Oakland, CA"
          hint={APPLICATION_COPY.locationHelp}
          autoCapitalize="words"
        />

        {suggestions.length > 0 ? (
          <View style={styles.suggestions}>
            {suggestions.map((suggestion) => (
              <Pressable
                key={suggestion.id}
                accessibilityRole="button"
                onPress={() => chooseSuggestion(suggestion)}
                style={({ pressed }) => [styles.suggestion, pressed && styles.pressed]}
              >
                <BrandText textRole="detail" tone="ink">
                  {suggestion.label}
                </BrandText>
              </Pressable>
            ))}
          </View>
        ) : null}

        {precision === 'exact' ? (
          <BrandText textRole="hint" tone="inkSoft">
            Pinned exactly. You can retype it to keep it to the city instead.
          </BrandText>
        ) : null}
      </View>

      {/* ── Size. Buckets, because nobody should measure a yard to sign up. ─ */}
      <View style={styles.block}>
        <BrandText variant="caption" weight="medium" tone="inkSoft">
          Roughly how big?
        </BrandText>
        <View style={styles.choices}>
          {SIZE_BUCKETS.map((bucket) => {
            const active = size === bucket.value;
            return (
              <Pressable
                key={bucket.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={bucket.label}
                onPress={() => setSize(bucket.value)}
                style={({ pressed }) => [
                  styles.choice,
                  active && styles.choiceActive,
                  pressed && styles.pressed,
                ]}
              >
                <BrandText
                  textRole="detail"
                  style={{ color: active ? brandColors.primaryDeep : brandColors.inkSoft }}
                >
                  {bucket.label}
                </BrandText>
              </Pressable>
            );
          })}
        </View>
      </View>

      <BrandField
        label="Your name"
        value={contactName}
        onChangeText={setContactName}
        placeholder="The real one"
        autoCapitalize="words"
      />
      <BrandField
        label="Phone (optional)"
        value={contactPhone}
        onChangeText={setContactPhone}
        keyboardType="phone-pad"
      />
      <BrandField
        label="Email (optional)"
        value={contactEmail}
        onChangeText={setContactEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <BrandField
        label="Tell us about it"
        value={about}
        onChangeText={setAbout}
        hint={APPLICATION_COPY.aboutHelp}
        multiline
        numberOfLines={5}
        style={styles.textarea}
      />

      <BrandField
        label="Website or Instagram (optional)"
        value={link}
        onChangeText={setLink}
        autoCapitalize="none"
        keyboardType="url"
      />

      {/* ── Photos. Both tiers. These become the farm's first album. ──────── */}
      <View style={styles.block}>
        <BrandText variant="caption" weight="medium" tone="inkSoft">
          Photos of what you grow
        </BrandText>
        <BrandText textRole="hint" tone="inkSoft">
          {APPLICATION_COPY.photosHelp}
        </BrandText>

        {photos.length > 0 ? (
          <View style={styles.photoRow}>
            {photos.map((photo) => (
              <View key={photo.id} style={styles.photoWrap}>
                <Image source={{ uri: photo.uri }} style={styles.photo} resizeMode="cover" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Remove this photo"
                  onPress={() => void dropPhoto(photo)}
                  style={styles.photoRemove}
                >
                  <BrandText textRole="hint" tone="onImage">
                    ✕
                  </BrandText>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <BrandButton
          label={photos.length ? 'Add another photo' : 'Add photos'}
          variant="quiet"
          onPress={() => void addPhotos()}
        />
      </View>

      {/* ── Documents. verified_farm ONLY, and never a checklist. ─────────── */}
      {isVerifiedFarm ? (
        <View style={styles.block}>
          <BrandText variant="caption" weight="medium" tone="inkSoft">
            Anything that shows it is a real, working farm
          </BrandText>
          <BrandText textRole="hint" tone="inkSoft">
            {APPLICATION_COPY.documentsHelp}
          </BrandText>

          {documents.map((doc) => (
            <View key={doc.id} style={styles.docRow}>
              <BrandText textRole="detail" tone="ink" style={styles.docName} numberOfLines={1}>
                {doc.name}
              </BrandText>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${doc.name}`}
                onPress={() => void dropDocument(doc)}
              >
                <BrandText textRole="detail" tone="inkSoft">
                  ✕
                </BrandText>
              </Pressable>
            </View>
          ))}

          <BrandButton
            label={documents.length ? 'Add another file' : 'Add files'}
            variant="quiet"
            onPress={() => void addDocuments()}
          />
          <BrandText textRole="hint" tone="inkSoft">
            These are private. Only you and the person reviewing can see them —
            they are never shown on your farm’s page.
          </BrandText>
        </View>
      ) : null}

      {notice ? (
        <View style={styles.notice}>
          <BrandText textRole="detail" tone="ink">
            {notice}
          </BrandText>
        </View>
      ) : null}

      <BrandButton
        label={isVerifiedFarm ? 'Send for review' : 'Bring it to the map'}
        onPress={() => void submit()}
        loading={busy}
      />
      <BrandButton label="Not now" variant="link" onPress={onCancel} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: brandColors.bg },
  content: { padding: brandSpacing.xl, gap: brandSpacing.lg, paddingBottom: brandSpacing.xxxl },
  tierBanner: { gap: brandSpacing.xxs, paddingBottom: brandSpacing.sm },
  kicker: { letterSpacing: 1.6 },
  block: { gap: brandSpacing.sm },
  textarea: { minHeight: 110, textAlignVertical: 'top' },
  choices: { flexDirection: 'row', flexWrap: 'wrap', gap: brandSpacing.sm },
  choice: {
    paddingVertical: brandSpacing.sm,
    paddingHorizontal: brandSpacing.md,
    borderRadius: brandRadius.pill,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
  choiceActive: { borderColor: brandColors.primary, backgroundColor: '#EDF3E9' },
  suggestions: {
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
    overflow: 'hidden',
  },
  suggestion: {
    paddingVertical: brandSpacing.sm,
    paddingHorizontal: brandSpacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: brandColors.line,
  },
  photoRow: { flexDirection: 'row', flexWrap: 'wrap', gap: brandSpacing.sm },
  photoWrap: { width: 88, height: 88, borderRadius: brandRadius.md, overflow: 'hidden' },
  photo: { width: '100%', height: '100%', backgroundColor: brandColors.line },
  photoRemove: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingHorizontal: brandSpacing.sm,
    paddingVertical: brandSpacing.xxs,
    backgroundColor: 'rgba(44, 58, 46, 0.65)',
    borderBottomLeftRadius: brandRadius.sm,
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: brandSpacing.md,
    paddingVertical: brandSpacing.sm,
    paddingHorizontal: brandSpacing.md,
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
  docName: { flexShrink: 1 },
  notice: {
    padding: brandSpacing.lg,
    borderRadius: brandRadius.md,
    backgroundColor: brandColors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: brandColors.line,
  },
  pressed: { opacity: 0.7 },
});
