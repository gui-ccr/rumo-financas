import { File, Paths } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';

import { EMPTY_PROFILE, normalizeName, type Profile } from '../domain/profile';

const NAME_KEY = 'profile.name';
const PHOTO_KEY = 'profile.photoUri';

/** Reads the stored profile. Synchronous, so it can run inside a query without a loading flash. */
export function readProfile(): Profile {
  try {
    const name = Storage.getItemSync(NAME_KEY) ?? EMPTY_PROFILE.name;
    const photoUri = Storage.getItemSync(PHOTO_KEY);
    // A photo file can disappear (cache cleanup, restore on another device): treat it as missing.
    const exists = photoUri !== null && new File(photoUri).exists;
    return { name, photoUri: exists ? photoUri : null };
  } catch {
    return EMPTY_PROFILE;
  }
}

/**
 * Copies a picked image into the app's documents folder, so the photo survives
 * the picker's temporary cache, then points the profile at the copy and drops the old file.
 */
export async function storePhoto(sourceUri: string): Promise<string> {
  const previous = Storage.getItemSync(PHOTO_KEY);
  const target = new File(Paths.document, `profile-${Date.now()}.jpg`);
  await new File(sourceUri).copy(target);
  Storage.setItemSync(PHOTO_KEY, target.uri);
  if (previous && previous !== target.uri) deleteFile(previous);
  return target.uri;
}

export function removePhoto(): void {
  const previous = Storage.getItemSync(PHOTO_KEY);
  Storage.removeItemSync(PHOTO_KEY);
  if (previous) deleteFile(previous);
}

export function writeName(name: string): void {
  Storage.setItemSync(NAME_KEY, normalizeName(name));
}

function deleteFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Orphaned copies are harmless; never fail a save because of cleanup.
  }
}
