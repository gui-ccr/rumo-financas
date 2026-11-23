import Storage from 'expo-sqlite/kv-store';
import { colorScheme } from 'nativewind';
import { useCallback, useState } from 'react';

export type ThemePreference = 'dark' | 'light' | 'system';

const KEY = 'themePreference';
/** Dark is Rumo's identity; light and system are opt-in from Ajustes. */
const DEFAULT: ThemePreference = 'dark';

export function readThemePreference(): ThemePreference {
  try {
    const raw = Storage.getItemSync(KEY);
    return raw === 'light' || raw === 'system' || raw === 'dark' ? raw : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

/** Apply the stored preference. Call once at startup, before the first render of routes. */
export function applyStoredThemePreference(): void {
  colorScheme.set(readThemePreference());
}

export function useThemePreference(): [ThemePreference, (value: ThemePreference) => void] {
  const [value, setValue] = useState(readThemePreference);
  const set = useCallback((next: ThemePreference) => {
    setValue(next);
    colorScheme.set(next);
    Storage.setItem(KEY, next).catch(() => {});
  }, []);
  return [value, set];
}
