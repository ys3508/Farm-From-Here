/**
 * Media limits. One place, so the app and the bucket policy cannot disagree.
 */

/**
 * Avatar processing, decided by the owner on 2026-08-17.
 *
 * Every upload is resized and re-encoded on the device before it leaves, so an
 * 8 MB camera original becomes roughly 200-400 KB. The byte cap below is the
 * backstop for anything that still comes out large; it matches the
 * `file_size_limit` on the `avatars` bucket, and if you raise one you must
 * raise the other or uploads start failing at the server with a vague error.
 */
export const AVATAR_MAX_DIMENSION = 1024;
export const AVATAR_JPEG_QUALITY = 0.85;
export const AVATAR_MAX_BYTES = 5 * 1024 * 1024; // 5 MB — mirrors the bucket limit

/** The public bucket avatars live in. Public read; write only your own folder. */
export const AVATAR_BUCKET = 'avatars';
