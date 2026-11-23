/**
 * How many mounted queries a command refetches. Tabs stay mounted in the app, so
 * every query below is an active observer, the same as on a real device.
 */
import { QueryClient, QueryObserver, type QueryKey } from '@tanstack/react-query';

import { MONEY_KEYS } from '../query-keys';
import { invalidateKeys } from '../use-command';

const MOUNTED: QueryKey[] = [
  ['overview', '2026-11'],
  ['transactions', 'recent', 5],
  ['transactions', 'list', { month: '2026-11' }],
  ['accounts'],
  ['accounts', 'balances'],
  ['categories'],
  ['categories', 'byUsage', 'expense'],
  ['bills', 'month', '2026-11'],
  ['bills', 'upcoming', 7],
  ['plan'],
  ['incomes', 'list'],
  ['incomes', 'pending'],
  ['incomes', 'expected', '2026-11'],
  ['invoices', 'cards'],
  ['moto', 'month'],
];

const idOf = (key: QueryKey) => JSON.stringify(key);

/** Mounts every query as an active observer and returns the counter of its fetches. */
async function mount() {
  const qc = new QueryClient();
  const fetches = new Map<string, number>();
  const unsubscribe: (() => void)[] = [];
  for (const queryKey of MOUNTED) {
    fetches.set(idOf(queryKey), 0);
    const observer = new QueryObserver(qc, {
      queryKey,
      staleTime: 0,
      queryFn: async () => {
        fetches.set(idOf(queryKey), (fetches.get(idOf(queryKey)) ?? 0) + 1);
        return { ok: true };
      },
    });
    unsubscribe.push(observer.subscribe(() => {}));
  }
  await new Promise((resolve) => setTimeout(resolve, 20)); // initial fetches
  fetches.forEach((_, k) => fetches.set(k, 0));
  // clear() also stops the cache's garbage-collection timers, so Jest can exit.
  return {
    qc,
    fetches,
    cleanup: () => {
      unsubscribe.forEach((u) => u());
      qc.clear();
    },
  };
}

/** Keys whose queries were refetched, in MOUNTED order. */
function refetched(fetches: Map<string, number>): QueryKey[] {
  return MOUNTED.filter((k) => (fetches.get(idOf(k)) ?? 0) > 0);
}

describe('refetches after a command', () => {
  it('before: invalidating everything refetches every mounted query', async () => {
    const { qc, fetches, cleanup } = await mount();
    await qc.invalidateQueries();
    expect(refetched(fetches)).toHaveLength(MOUNTED.length);
    cleanup();
  });

  it('after: saving a transaction refetches only the money-related queries', async () => {
    const { qc, fetches, cleanup } = await mount();
    await invalidateKeys(qc, MONEY_KEYS);
    expect(refetched(fetches)).toEqual([
      ['overview', '2026-11'],
      ['transactions', 'recent', 5],
      ['transactions', 'list', { month: '2026-11' }],
      ['accounts'],
      ['accounts', 'balances'],
      ['categories'],
      ['categories', 'byUsage', 'expense'],
      ['plan'],
      ['invoices', 'cards'],
      ['moto', 'month'],
    ]);
    // Bills and incomes do not move with a plain transaction.
    expect(refetched(fetches).some((k) => k[0] === 'bills' || k[0] === 'incomes')).toBe(false);
    cleanup();
  });

  it('a command with no keys refetches nothing', async () => {
    const { qc, fetches, cleanup } = await mount();
    await invalidateKeys(qc, []);
    expect(refetched(fetches)).toEqual([]);
    cleanup();
  });
});
