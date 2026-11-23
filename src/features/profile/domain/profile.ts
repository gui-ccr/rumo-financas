export const NAME_MAX_LENGTH = 40;

/** Per-device profile. Lives in the key-value store and the app documents folder, never in SQLite. */
export type Profile = {
  name: string;
  /** file:// URI of the copied photo inside documentDirectory, or null. */
  photoUri: string | null;
};

export const EMPTY_PROFILE: Profile = { name: '', photoUri: null };

/** Trims and collapses inner spaces, and caps the length. */
export function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX_LENGTH);
}
