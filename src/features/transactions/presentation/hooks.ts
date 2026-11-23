import { useQuery } from '@tanstack/react-query';

import { useReminderSync } from '@/features/bills/presentation/hooks';
import { useContainer } from '@/core/container-context';
import { MONEY_KEYS, QK } from '@/shared/presentation/query-keys';
import { useCommand } from '@/shared/presentation/use-command';

import type { EditTransactionInput, NewTransactionInput } from '../application/schemas';
import type { TransactionFilters } from '../domain/transaction';

export function useTransactions(filters: TransactionFilters) {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['transactions', 'list', filters], queryFn: () => repos.transactions.list(filters) });
}

export function useRecentTransactions(limit = 5) {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['transactions', 'recent', limit], queryFn: () => repos.transactions.recent(limit) });
}

export function useTransaction(id: number) {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['transactions', 'one', id], queryFn: () => repos.transactions.findById(id) });
}

export function useCreateTransaction() {
  const { useCases } = useContainer();
  return useCommand((input: NewTransactionInput) => useCases.createTransaction.execute(input), { keys: MONEY_KEYS });
}

export function useEditTransaction() {
  const { useCases } = useContainer();
  return useCommand((a: { id: number; input: EditTransactionInput }) => useCases.editTransaction.execute(a.id, a.input), {
    keys: MONEY_KEYS,
  });
}

/** Deleting a payment or a receipt also reopens the bill or income it settled. */
export function useDeleteTransaction() {
  const { useCases } = useContainer();
  return useCommand((a: { id: number; wholePurchase?: boolean }) => useCases.deleteTransaction.execute(a.id, a.wholePurchase), {
    keys: [...MONEY_KEYS, QK.bills, QK.incomes],
    after: useReminderSync(),
  });
}
