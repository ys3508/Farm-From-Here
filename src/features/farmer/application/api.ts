import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import {
  APPLICATION_DOCS_BUCKET,
  APPLICATION_FILE_MAX_BYTES,
  APPLICATION_MEDIA_BUCKET,
  APPLICATION_PHOTO_JPEG_QUALITY,
  APPLICATION_PHOTO_MAX_DIMENSION,
} from '@/config/farmerApplication';
import { isPreviewMode } from '@/features/dev/preview';
import { env, isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';
import type {
  FarmApplication,
  FarmApplicationDocument,
  FarmApplicationMedia,
} from '@/lib/supabase/types';

/**
 * ════════════════════════════════════════════════════════════════════════════
 * THE FARMER APPLICATION — everything that talks to the backend.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Spec: revise/2026-08-19-step2a-farmer-application.md
 *
 * ORDER MATTERS, and it is the reason `submit` is a separate step rather than
 * part of the insert:
 *
 *   1. create the application row (status `pending`)
 *   2. upload photos, and documents if this is a verified farm
 *   3. submit → an INDIVIDUAL is auto-approved right here
 *
 * An individual is approved the instant they submit, and approval copies their
 * photos into `farm_media`. Approving at step 1 would seed an EMPTY album, and
 * the farmer-world unlock gate (farm_members present AND farm_media ≥ 1) would
 * then fail for a farm that does in fact have photos. So the row is created
 * first, filled, and only then submitted.
 *
 * Nothing here can approve anything by itself: RLS forbids a client writing
 * `status = 'approved'`, so approval only ever happens inside
 * `submit_farm_application` or when the owner flips the row in the dashboard.
 */

/** True when there is no backend to talk to. The UI explains rather than fails. */
export const applicationsOffline = isPreviewMode || !isSupabaseConfigured;

const OFFLINE_MESSAGE = isPreviewMode
  ? 'Preview mode has no backend, so nothing is really submitted here.'
  : 'The backend is not configured yet, so this cannot be submitted.';

export type ApplicationDraft = {
  farm_type: FarmApplication['farm_type'];
  farm_name: string;
  description: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  location_precision: FarmApplication['location_precision'];
  size: FarmApplication['size'];
  contact_name: string;
  contact_phone: string | null;
  contact_email: string | null;
  about_text: string;
  links: FarmApplication['links'];
};

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

/* ────────────────────────────────────────────────────────────────────────────
 * Reading
 * ──────────────────────────────────────────────────────────────────────────── */

export type ApplicationBundle = {
  application: FarmApplication | null;
  media: FarmApplicationMedia[];
  documents: FarmApplicationDocument[];
};

const EMPTY: ApplicationBundle = { application: null, media: [], documents: [] };

/**
 * This profile's CURRENT application, with its files.
 *
 * "Current" = the most recent one that still matters: a pending, rejected or
 * approved row. A withdrawn one is history and must not reopen itself in the
 * UI — someone who withdrew should be offered a fresh form, not their old one.
 */
export async function loadCurrentApplication(profileId: string): Promise<ApplicationBundle> {
  if (applicationsOffline) return EMPTY;

  const { data, error } = await supabase
    .from('farm_applications')
    .select('*')
    .eq('profile_id', profileId)
    .in('status', ['pending', 'rejected', 'approved'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn('[application] load failed:', error.message);
    return EMPTY;
  }

  const [media, documents] = await Promise.all([
    supabase
      .from('farm_application_media')
      .select('*')
      .eq('application_id', data.id)
      .order('sort_order'),
    supabase
      .from('farm_application_documents')
      .select('*')
      .eq('application_id', data.id)
      .order('sort_order'),
  ]);

  return {
    application: data,
    media: media.data ?? [],
    documents: documents.data ?? [],
  };
}

/**
 * Whether this profile may apply at all.
 *
 * The two limits are the owner's anti-abuse rule — one farm per account, one
 * in-flight application — and they are enforced in the DATABASE. This only asks
 * so the UI can say why before someone fills in a long form.
 */
export async function checkEligibility(
  profileId: string,
): Promise<{ ok: boolean; reason: string }> {
  if (applicationsOffline) return { ok: true, reason: 'eligible' };

  const { data, error } = await supabase.rpc('farm_application_eligibility', {
    target: profileId,
  });

  if (error) {
    console.warn('[application] eligibility check failed:', error.message);
    // Do not claim someone is eligible when we could not check — the database
    // is the real gate and will refuse anyway, but with a worse message.
    return { ok: false, reason: 'unknown' };
  }
  return { ok: data?.ok === true, reason: data?.reason ?? 'unknown' };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Writing
 * ──────────────────────────────────────────────────────────────────────────── */

/** Creates the row so photos have something to attach to. Status starts pending. */
export async function createApplication(
  profileId: string,
  draft: ApplicationDraft,
): Promise<Result<FarmApplication>> {
  if (applicationsOffline) return { ok: false, message: OFFLINE_MESSAGE };

  const { data, error } = await supabase
    .from('farm_applications')
    .insert({ ...draft, profile_id: profileId })
    .select('*')
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? 'Could not start that application.' };
  }
  return { ok: true, value: data };
}

/** Saves edits to an open (pending or rejected) application. */
export async function updateApplication(
  applicationId: string,
  draft: Partial<ApplicationDraft>,
): Promise<Result<FarmApplication>> {
  if (applicationsOffline) return { ok: false, message: OFFLINE_MESSAGE };

  const { data, error } = await supabase
    .from('farm_applications')
    .update(draft)
    .eq('id', applicationId)
    .select('*')
    .single();

  if (error || !data) {
    return { ok: false, message: error?.message ?? 'Could not save those changes.' };
  }
  return { ok: true, value: data };
}

/**
 * Submit. Tier-aware, and the ONLY route by which an individual gets approved.
 *
 * Returns the resulting status so the caller can route: `approved` means the
 * farmer world just unlocked, `pending` means a person will read it.
 */
export async function submitApplication(
  applicationId: string,
): Promise<Result<{ status: string }>> {
  if (applicationsOffline) return { ok: false, message: OFFLINE_MESSAGE };

  const { data, error } = await supabase.rpc('submit_farm_application', {
    application_id: applicationId,
  });

  if (error) return { ok: false, message: error.message };
  if (!data?.ok) return { ok: false, message: data?.reason ?? 'unknown' };
  return { ok: true, value: { status: data.status ?? 'pending' } };
}

export async function withdrawApplication(applicationId: string): Promise<Result<null>> {
  if (applicationsOffline) return { ok: false, message: OFFLINE_MESSAGE };

  const { data, error } = await supabase.rpc('withdraw_farm_application', {
    application_id: applicationId,
  });

  if (error) return { ok: false, message: error.message };
  if (!data?.ok) return { ok: false, message: data?.reason ?? 'unknown' };
  return { ok: true, value: null };
}

/* ────────────────────────────────────────────────────────────────────────────
 * Files
 *
 * Both buckets authorise on the FIRST PATH SEGMENT, which is the profile id —
 * the applicant has no farm yet, so authorisation keys off the person. Getting
 * the path shape wrong is a permission error, not a cosmetic one:
 *
 *     <profile_id>/<application_id>/<name>
 * ──────────────────────────────────────────────────────────────────────────── */

function objectPath(profileId: string, applicationId: string, extension: string) {
  // Date.now() rather than a uuid: unique enough per user per millisecond, and
  // it keeps the listing in upload order when read raw in the dashboard.
  return `${profileId}/${applicationId}/${Date.now()}-${Math.floor(Math.random() * 1e4)}.${extension}`;
}

/** Reads a local file as bytes. Web and native disagree about URIs. */
async function readBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    return new Uint8Array(await response.arrayBuffer());
  }
  return new File(uri).bytes();
}

export type PickResult =
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'picked'; uris: string[] };

/**
 * Photos of what they grow. Library only — this is a considered choice of
 * existing photos, not a "take one now" moment (that is 2C's job).
 */
export async function pickApplicationPhotos(remaining: number): Promise<PickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: Math.max(1, remaining),
    quality: 1, // compressed once below, not twice
  });

  if (result.canceled || !result.assets?.length) return { status: 'cancelled' };
  return { status: 'picked', uris: result.assets.map((a) => a.uri) };
}

export type PickedDocument = { uri: string; name: string; mimeType: string | null };

/**
 * Supporting material for a verified farm. Images AND PDFs — a land deed or a
 * lease is almost always a PDF, and refusing them would block exactly the tier
 * we are asking to prove the most.
 */
export async function pickApplicationDocuments(): Promise<
  { status: 'cancelled' } | { status: 'picked'; files: PickedDocument[] }
> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    multiple: true,
    copyToCacheDirectory: true,
  });

  if (result.canceled || !result.assets?.length) return { status: 'cancelled' };
  return {
    status: 'picked',
    files: result.assets.map((a) => ({
      uri: a.uri,
      name: a.name,
      mimeType: a.mimeType ?? null,
    })),
  };
}

/**
 * Shrinks, re-encodes and uploads one photo, then records it.
 *
 * Resizing happens on the device so a 12 MB camera original never crosses a
 * farmer's phone data. Same approach as avatars.
 */
export async function uploadApplicationPhoto(
  profileId: string,
  applicationId: string,
  uri: string,
  sortOrder: number,
): Promise<Result<FarmApplicationMedia>> {
  if (applicationsOffline) return { ok: false, message: OFFLINE_MESSAGE };

  try {
    const processed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: APPLICATION_PHOTO_MAX_DIMENSION } }],
      { compress: APPLICATION_PHOTO_JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
    );
    const bytes = await readBytes(processed.uri);

    if (bytes.byteLength > APPLICATION_FILE_MAX_BYTES) {
      return { ok: false, message: 'That photo is too large even after resizing.' };
    }

    const path = objectPath(profileId, applicationId, 'jpg');
    const { error: uploadError } = await supabase.storage
      .from(APPLICATION_MEDIA_BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: false });

    if (uploadError) return { ok: false, message: uploadError.message };

    const { data, error } = await supabase
      .from('farm_application_media')
      .insert({
        application_id: applicationId,
        storage_path: path,
        mime_type: 'image/jpeg',
        sort_order: sortOrder,
      })
      .select('*')
      .single();

    if (error || !data) return { ok: false, message: error?.message ?? 'Could not save that photo.' };
    return { ok: true, value: data };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not upload that photo.',
    };
  }
}

/**
 * Uploads one supporting document to the PRIVATE bucket.
 *
 * ⚠️ NOT resized and NOT re-encoded: a deed must arrive exactly as it was, and
 * running a PDF through an image pipeline would destroy it. The bucket's own
 * size limit is the backstop.
 */
export async function uploadApplicationDocument(
  profileId: string,
  applicationId: string,
  file: PickedDocument,
  sortOrder: number,
): Promise<Result<FarmApplicationDocument>> {
  if (applicationsOffline) return { ok: false, message: OFFLINE_MESSAGE };

  try {
    const bytes = await readBytes(file.uri);
    if (bytes.byteLength > APPLICATION_FILE_MAX_BYTES) {
      return { ok: false, message: `${file.name} is too large to upload.` };
    }

    const extension = file.name.includes('.') ? file.name.split('.').pop()! : 'bin';
    const path = objectPath(profileId, applicationId, extension.toLowerCase());

    const { error: uploadError } = await supabase.storage
      .from(APPLICATION_DOCS_BUCKET)
      .upload(path, bytes, {
        contentType: file.mimeType ?? 'application/octet-stream',
        upsert: false,
      });

    if (uploadError) return { ok: false, message: uploadError.message };

    const { data, error } = await supabase
      .from('farm_application_documents')
      .insert({
        application_id: applicationId,
        storage_path: path,
        mime_type: file.mimeType,
        original_filename: file.name,
        sort_order: sortOrder,
      })
      .select('*')
      .single();

    if (error || !data) {
      return { ok: false, message: error?.message ?? 'Could not save that document.' };
    }
    return { ok: true, value: data };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not upload that file.',
    };
  }
}

/** Removes a photo from an open application, bytes and row. */
export async function removeApplicationPhoto(media: FarmApplicationMedia): Promise<void> {
  if (applicationsOffline) return;
  await supabase.storage.from(APPLICATION_MEDIA_BUCKET).remove([media.storage_path]);
  await supabase.from('farm_application_media').delete().eq('id', media.id);
}

/** Removes a document from an open application, bytes and row. */
export async function removeApplicationDocument(
  doc: FarmApplicationDocument,
): Promise<void> {
  if (applicationsOffline) return;
  await supabase.storage.from(APPLICATION_DOCS_BUCKET).remove([doc.storage_path]);
  await supabase.from('farm_application_documents').delete().eq('id', doc.id);
}

/**
 * A displayable URL for an application PHOTO.
 *
 * ⚠️ There is deliberately NO equivalent for documents. That bucket is private
 * and its contents are identity papers; they are never rendered in the app and
 * never handed a URL. The applicant sees a filename, and that is all.
 */
export function applicationPhotoUrl(path: string): string {
  return `${env.supabaseUrl}/storage/v1/object/public/${APPLICATION_MEDIA_BUCKET}/${path}`;
}
