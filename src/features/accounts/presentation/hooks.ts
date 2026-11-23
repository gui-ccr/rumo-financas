import { useQuery } from '@tanstack/react-query';

import { useContainer } from '@/core/container-context';
import { today } from '@/shared/domain/dates';
import { QK } from '@/shared/presentation/query-keys';
import { useCommand } from '@/shared/presentation/use-command';

import type { AccountInput, CategoryInput } from '../application/schemas';
import { sortByUsage, type CategoryKind } from '../domain/category';

export function useAccounts() {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['accounts'], queryFn: () => repos.accounts.list() });
}

export function useBalances() {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['accounts', 'balances'], queryFn: () => repos.accounts.balances(today()) });
}

export function useCategories() {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['categories'], queryFn: () => repos.categories.list() });
}

/** Categories of one kind, most used first — the quick-add grid. */
export function useCategoriesByUsage(kind: CategoryKind) {
  const { repos } = useContainer();
  return useQuery({
    queryKey: ['categories', 'byUsage', kind],
    queryFn: async () => {
      const [all, usage] = await Promise.all([repos.categories.list(), repos.categories.usage()]);
      return sortByUsage(
        all.filter((c) => c.kind === kind),
        usage,
      );
    },
  });
}

/** An account's name, type and closing day show up in transactions, invoices and the overview. */
const ACCOUNT_KEYS = [QK.accounts, QK.transactions, QK.invoices, QK.overview];
/** A category's name, icon and color show up almost everywhere a movement is listed. */
const CATEGORY_KEYS = [QK.categories, QK.transactions, QK.bills, QK.incomes, QK.invoices, QK.overview, QK.moto];

export function useSaveAccount() {
  const { useCases } = useContainer();
  return useCommand((a: { input: AccountInput; id?: number }) => useCases.saveAccount.execute(a.input, a.id), {
    keys: ACCOUNT_KEYS,
  });
}

export function useArchiveAccount() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.archiveAccount.execute(id), { keys: ACCOUNT_KEYS });
}

export function useSaveCategory() {
  const { useCases } = useContainer();
  return useCommand((a: { input: CategoryInput; id?: number }) => useCases.saveCategory.execute(a.input, a.id), {
    keys: CATEGORY_KEYS,
  });
}

export function useArchiveCategory() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.archiveCategory.execute(id), { keys: CATEGORY_KEYS });
}
