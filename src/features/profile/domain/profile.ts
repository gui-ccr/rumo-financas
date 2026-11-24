export const NAME_MAX_LENGTH = 40;
export const STATUS_MAX_LENGTH = 60;

/** Avatar glyphs the user can pick instead of initials. Keys are stored; the icon lives in presentation. */
export const AVATAR_ICON_KEYS = [
  'bike',
  'wallet',
  'piggy-bank',
  'rocket',
  'star',
  'heart',
  'sun',
  'moon',
  'coffee',
  'music',
  'gamepad',
  'leaf',
] as const;

export type AvatarIconKey = (typeof AVATAR_ICON_KEYS)[number];

/** Per-device profile details. Lives in the key-value store, never in SQLite. */
export type ProfileDetails = {
  name: string;
  /** Hex color from the app swatches, or null for the default avatar tone. */
  avatarColor: string | null;
  /** Glyph shown in place of initials, or null for initials. */
  avatarIcon: AvatarIconKey | null;
  /** Short status line shown under the name on Home. Empty = none. */
  status: string;
  /** When on, Home greets by the time of day instead of "Olá,". */
  timeGreeting: boolean;
  /** Monthly saving goal in cents (reminder only), or null. */
  savingsGoalCents: number | null;
};

export type Profile = ProfileDetails & {
  /** file:// URI of the copied photo inside documentDirectory, or null. */
  photoUri: string | null;
};

export const EMPTY_PROFILE: Profile = {
  name: '',
  avatarColor: null,
  avatarIcon: null,
  status: '',
  timeGreeting: false,
  savingsGoalCents: null,
  photoUri: null,
};

/** Raw strings as read from the key-value store. Any field may be missing on profiles saved by older versions. */
export type StoredProfile = {
  name: string | null;
  avatarColor: string | null;
  avatarIcon: string | null;
  status: string | null;
  timeGreeting: string | null;
  savingsGoalCents: string | null;
};

/** Trims and collapses inner spaces, and caps the length. */
export function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, NAME_MAX_LENGTH);
}

export function normalizeStatus(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, STATUS_MAX_LENGTH);
}

export function normalizeAvatarColor(raw: unknown): string | null {
  return typeof raw === 'string' && /^#[0-9a-fA-F]{6}$/.test(raw) ? raw : null;
}

export function normalizeAvatarIcon(raw: unknown): AvatarIconKey | null {
  return (AVATAR_ICON_KEYS as readonly string[]).includes(raw as string) ? (raw as AvatarIconKey) : null;
}

/** Stored as an integer string of cents. Anything else (missing, zero, garbage) means no goal. */
export function parseSavingsGoal(raw: string | null): number | null {
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const cents = Number(raw);
  return Number.isSafeInteger(cents) && cents > 0 ? cents : null;
}

/** Flags are stored as "1" or "0". A missing flag counts as off. */
export function parseFlag(raw: string | null): boolean {
  return raw === '1';
}

/**
 * Builds a valid profile from what the store holds. Missing or invalid fields fall back
 * to their defaults, so profiles saved before these fields existed still load.
 */
export function buildProfile(stored: StoredProfile, photoUri: string | null): Profile {
  return {
    name: normalizeName(stored.name ?? ''),
    photoUri,
    avatarColor: normalizeAvatarColor(stored.avatarColor),
    avatarIcon: normalizeAvatarIcon(stored.avatarIcon),
    status: normalizeStatus(stored.status ?? ''),
    timeGreeting: parseFlag(stored.timeGreeting),
    savingsGoalCents: parseSavingsGoal(stored.savingsGoalCents),
  };
}

export const DEFAULT_GREETING = 'Olá,';

/** Greeting for the Home header, by the local hour: 5-11 morning, 12-17 afternoon, otherwise evening. */
export function greetingForHour(hour: number): string {
  if (hour >= 5 && hour <= 11) return 'Bom dia,';
  if (hour >= 12 && hour <= 17) return 'Boa tarde,';
  return 'Boa noite,';
}
