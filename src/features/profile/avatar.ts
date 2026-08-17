import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  AVATAR_BUCKET,
  AVATAR_JPEG_QUALITY,
  AVATAR_MAX_BYTES,
  AVATAR_MAX_DIMENSION,
} from '@/config/media';
import { env } from '@/lib/env';
import { supabase } from '@/lib/supabase/client';

/**
 * Avatar upload.
 *
 * `profiles.avatar_url` stores the STORAGE PATH, not an absolute URL — an
 * absolute URL bakes in the project ref and breaks if the project is restored or
 * moved between staging and production. The URL is built at read time by
 * `avatarPublicUrl` below.
 */

/** Turns a stored path into something an <Image> can load. Null passes through. */
export function avatarPublicUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  // Already absolute (older rows, or an OAuth provider's picture URL).
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${env.supabaseUrl}/storage/v1/object/public/${AVATAR_BUCKET}/${path}`;
}

export type AvatarPickResult =
  | { status: 'cancelled' }
  | { status: 'denied' }
  | { status: 'picked'; uri: string };

/**
 * Opens the library and returns a square, already-cropped image.
 *
 * `allowsEditing` with a 1:1 aspect means the user chooses the crop rather than
 * us guessing which part of their photo is the face.
 */
export async function pickAvatar(): Promise<AvatarPickResult> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return { status: 'denied' };

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1, // compress once, below — not twice
  });

  if (result.canceled || !result.assets?.[0]) return { status: 'cancelled' };
  return { status: 'picked', uri: result.assets[0].uri };
}

/** Reads the processed file as bytes. Web and native disagree about URIs. */
async function readBytes(uri: string): Promise<Uint8Array> {
  if (Platform.OS === 'web') {
    // The picker hands back a blob:/data: URI, which fetch understands and
    // expo-file-system does not.
    const response = await fetch(uri);
    return new Uint8Array(await response.arrayBuffer());
  }
  return new File(uri).bytes();
}

export type AvatarUploadResult =
  | { ok: true; path: string }
  | { ok: false; message: string };

/**
 * Shrinks, re-encodes and uploads an avatar, then points the profile at it.
 *
 * Resizing happens on the device so an 8 MB camera original never crosses the
 * network. The byte check afterwards is a backstop for anything that still
 * comes out oversized — the bucket enforces the same limit, and hitting it
 * server-side gives a far worse error message.
 *
 * Failure is always returned, never thrown: the avatar is optional, and a
 * failed upload must not take the sign-up down with it.
 */
export async function uploadAvatar(profileId: string, uri: string): Promise<AvatarUploadResult> {
  try {
    const processed = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: AVATAR_MAX_DIMENSION } }],
      { compress: AVATAR_JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
    );

    const bytes = await readBytes(processed.uri);

    if (bytes.byteLength > AVATAR_MAX_BYTES) {
      return {
        ok: false,
        message: 'That photo is too large even after resizing. Try a different one.',
      };
    }

    // The first path segment must be the user's own id — that IS the storage
    // authorisation rule, so it is not decorative.
    const path = `${profileId}/${Date.now()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, bytes, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) return { ok: false, message: uploadError.message };

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ avatar_url: path })
      .eq('id', profileId);

    if (profileError) return { ok: false, message: profileError.message };

    return { ok: true, path };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Could not upload that photo.',
    };
  }
}
