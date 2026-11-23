import { useQuery } from '@tanstack/react-query';

import { useContainer } from '@/core/container-context';
import type { MonthKey } from '@/shared/domain/dates';
import { MONEY_KEYS } from '@/shared/presentation/query-keys';
import { useCommand } from '@/shared/presentation/use-command';

import type { PayInvoiceInput } from '../application/pay-invoice';

export function useCardsWithInvoices() {
  const { useCases } = useContainer();
  return useQuery({ queryKey: ['invoices', 'cards'], queryFn: () => useCases.getInvoices.forAllCards() });
}

export function useInvoiceTransactions(cardId: number, month: MonthKey) {
  const { repos } = useContainer();
  return useQuery({
    queryKey: ['invoices', cardId, month],
    queryFn: () => repos.invoices.transactions(cardId, month),
  });
}

export function usePayInvoice() {
  const { useCases } = useContainer();
  return useCommand((input: PayInvoiceInput) => useCases.payInvoice.execute(input), { keys: MONEY_KEYS });
}
