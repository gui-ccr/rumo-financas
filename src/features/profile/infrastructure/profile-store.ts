import { File, Paths } from 'expo-file-system';
import Storage from 'expo-sqlite/kv-store';

import {
  buildProfile,
  EMPTY_PROFILE,
  normalizeName,
  normalizeStatus,
  type Profile,
  type ProfileDetails,
  type StoredProfile,
} from '../domain/profile';

const KEYS = {
  name: 'profile.name',
  photoUri: 'profile.photoUri',
  avatarColor: 'profile.avatarColor',
  avatarIcon: 'profile.avatarIcon',
  status: 'profile.status',
  timeGreeting: 'profile.timeGreeting',
  savingsGoalCents: 'profile.savingsGoalCents',
} as const;

/** Reads the stored profile. Synchronous, so it can run inside a query without a loading flash. */
export function readProfile(): Profile {
  try {
    const stored: StoredProfile = {
      name: Storage.getItemSync(KEYS.name),
      avatarColor: Storage.getItemSync(KEYS.avatarColor),
      avatarIcon: Storage.getItemSync(KEYS.avatarIcon),
      status: Storage.getItemSync(KEYS.status),
      timeGreeting: Storage.getItemSync(KEYS.timeGreeting),
      savingsGoalCents: Storage.getItemSync(KEYS.savingsGoalCents),
    };
    const photoUri = Storage.getItemSync(KEYS.photoUri);
    // A photo file can disappear (cache cleanup, restore on another device): treat it as missing.
    const exists = photoUri !== null && new File(photoUri).exists;
    return buildProfile(stored, exists ? photoUri : null);
  } catch {
    return EMPTY_PROFILE;
  }
}

/**
 * Copies a picked image into the app's documents folder, so the photo survives
 * the picker's temporary cache, then points the profile at the copy and drops the old file.
 */
export async function storePhoto(sourceUri: string): Promise<string> {
  const previous = Storage.getItemSync(KEYS.photoUri);
  const target = new File(Paths.document, `profile-${Date.now()}.jpg`);
  await new File(sourceUri).copy(target);
  Storage.setItemSync(KEYS.photoUri, target.uri);
  if (previous && previous !== target.uri) deleteFile(previous);
  return target.uri;
}

export function removePhoto(): void {
  const previous = Storage.getItemSync(KEYS.photoUri);
  Storage.removeItemSync(KEYS.photoUri);
  if (previous) deleteFile(previous);
}

/** Saves every profile field except the photo, which has its own path. Null removes the key. */
export function writeDetails(details: ProfileDetails): void {
  writeOptional(KEYS.name, normalizeName(details.name));
  writeOptional(KEYS.avatarColor, details.avatarColor);
  writeOptional(KEYS.avatarIcon, details.avatarIcon);
  writeOptional(KEYS.status, normalizeStatus(details.status) || null);
  Storage.setItemSync(KEYS.timeGreeting, details.timeGreeting ? '1' : '0');
  writeOptional(KEYS.savingsGoalCents, details.savingsGoalCents === null ? null : String(details.savingsGoalCents));
}

function writeOptional(key: string, value: string | null): void {
  if (value === null) Storage.removeItemSync(key);
  else Storage.setItemSync(key, value);
}

function deleteFile(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Orphaned copies are harmless; never fail a save because of cleanup.
  }
}
