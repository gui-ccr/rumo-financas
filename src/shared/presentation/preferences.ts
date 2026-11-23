import Storage from 'expo-sqlite/kv-store';
import { useCallback, useState } from 'react';

/**
 * Small per-device conveniences. Financial data never goes here — it lives in
 * the SQLite tables. Uses expo-sqlite's key-value store so it runs in Expo Go.
 */
function readNumber(key: string): number | undefined {
  try {
    const raw = Storage.getItemSync(key);
    return raw === null ? undefined : Number(raw);
  } catch {
    return undefined;
  }
}

export function useLastAccountId(): [number | undefined, (id: number) => void] {
  const [value, setValue] = useState(() => readNumber('lastAccountId'));
  const set = useCallback((id: number) => {
    setValue(id);
    Storage.setItem('lastAccountId', String(id)).catch(() => {});
  }, []);
  return [value, set];
}
