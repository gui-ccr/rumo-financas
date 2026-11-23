import { useQuery } from '@tanstack/react-query';

import { useContainer } from '@/core/container-context';
import type { MonthKey } from '@/shared/domain/dates';
import { MONEY_KEYS, QK } from '@/shared/presentation/query-keys';
import { useCommand } from '@/shared/presentation/use-command';

import type { ExpectedIncomeInput, IncomeInput, ReceiveIncomeInput } from '../application/schemas';

// Fixed schedules are materialized by the bootstrap and when an income is saved (see use-app-bootstrap),
// so these reads are plain queries.

/** Every active income. */
export function useIncomes() {
  const { useCases } = useContainer();
  return useQuery({ queryKey: ['incomes', 'list'], queryFn: () => useCases.getIncomes.list() });
}

/** Open receipts: dated first, then the ones waiting with no date. */
export function usePendingIncomes() {
  const { useCases } = useContainer();
  return useQuery({ queryKey: ['incomes', 'pending'], queryFn: () => useCases.getIncomes.pending() });
}

/** Expected income of a month (fixed plus uncertain tagged with that month). */
export function useExpectedIncome(month: MonthKey) {
  const { useCases } = useContainer();
  return useQuery({
    queryKey: ['incomes', 'expected', month],
    queryFn: () => useCases.getIncomes.expectedCents(month),
  });
}

/** Income definitions and their receipts. The payment plan lists pending receipts too. */
const INCOME_KEYS = [QK.incomes, QK.plan];

export function useSaveIncome() {
  const { useCases } = useContainer();
  return useCommand((a: { input: IncomeInput; id?: number }) => useCases.saveIncome.execute(a.input, a.id), {
    keys: INCOME_KEYS,
  });
}

export function useArchiveIncome() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.archiveIncome.execute(id), { keys: INCOME_KEYS });
}

export function useAddExpectedIncome() {
  const { useCases } = useContainer();
  return useCommand((input: ExpectedIncomeInput) => useCases.addExpectedIncome.execute(input), { keys: INCOME_KEYS });
}

/** Records the receipt as an income transaction and closes the occurrence. */
export function useReceiveIncome() {
  const { useCases } = useContainer();
  return useCommand(
    (a: { occurrenceId: number; input: ReceiveIncomeInput }) => useCases.receiveIncome.execute(a.occurrenceId, a.input),
    { keys: [...MONEY_KEYS, QK.incomes] },
  );
}
