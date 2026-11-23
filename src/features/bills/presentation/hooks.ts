import { useQuery } from '@tanstack/react-query';

import { useContainer } from '@/core/container-context';
import { addDays, monthKey, monthRange, today, type MonthKey } from '@/shared/domain/dates';
import { MONEY_KEYS, QK } from '@/shared/presentation/query-keys';
import { useCommand } from '@/shared/presentation/use-command';

import type { BillInput, PayBillInput } from '../application/schemas';
import { totalsOf } from '../domain/bill';

/** Re-schedules device reminders after anything that changes what is due. */
export function useReminderSync() {
  const { useCases } = useContainer();
  return () => {
    useCases.syncReminders.execute().catch(() => {});
  };
}

// Occurrences are materialized by the bootstrap and after each save (see use-app-bootstrap
// and the save use cases), so these reads are plain queries.

export function useBillsOfMonth(month: MonthKey) {
  const { repos, useCases } = useContainer();
  return useQuery({
    queryKey: ['bills', 'month', month],
    queryFn: async () => {
      const { start, end } = monthRange(month);
      const [list, invoices] = await Promise.all([
        repos.bills.occurrencesWithOverdue(start, end),
        useCases.getInvoices.payable(),
      ]);
      return { list, invoices, totals: totalsOf(list, today()) };
    },
  });
}

/** What is due in the next days, for the home screen. */
export function useUpcomingBills(days = 7) {
  const { repos, useCases } = useContainer();
  return useQuery({
    queryKey: ['bills', 'upcoming', days],
    queryFn: async () => {
      const [list, invoices] = await Promise.all([
        repos.bills.pendingUntil(addDays(today(), days)),
        useCases.getInvoices.payable(),
      ]);
      return { list, invoices };
    },
  });
}

/**
 * What to pay first with the current balance, in priority order, for this month and the overdue.
 * The month is part of the key: the data is cached forever otherwise, and after the month
 * changes the old month's plan would stay on screen. Invalidating QK.plan still refreshes it.
 */
export function usePaymentPlan() {
  const { useCases } = useContainer();
  const ref = today();
  return useQuery({
    queryKey: [...QK.plan, monthKey(ref)],
    queryFn: () => useCases.getPaymentPlan.execute(ref),
  });
}

export function useOccurrence(id: number) {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['bills', 'occurrence', id], queryFn: () => repos.bills.findOccurrence(id) });
}

export function useBill(id: number | undefined) {
  const { repos } = useContainer();
  return useQuery({
    queryKey: ['bills', 'bill', id],
    queryFn: () => repos.bills.findById(id!),
    enabled: id !== undefined,
  });
}

/** One bill with its open dues, payment history and the names of its account and category. */
export function useBillDetail(billId: number | undefined) {
  const { useCases } = useContainer();
  return useQuery({
    queryKey: ['bills', 'detail', billId],
    queryFn: () => useCases.getBillDetail.execute(billId!),
    enabled: billId !== undefined,
  });
}

/** Bill definitions and their occurrences. The payment plan reads both, so it is refreshed too. */
const BILL_KEYS = [QK.bills, QK.plan];

export function useSaveBill() {
  const { useCases } = useContainer();
  return useCommand((a: { input: BillInput; id?: number }) => useCases.saveBill.execute(a.input, a.id), {
    keys: BILL_KEYS,
    after: useReminderSync(),
  });
}

export function useDeleteBill() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.deleteBill.execute(id), { keys: BILL_KEYS, after: useReminderSync() });
}

export function usePayBill() {
  const { useCases } = useContainer();
  return useCommand(
    (a: { occurrenceId: number; input: PayBillInput }) => useCases.payBill.execute(a.occurrenceId, a.input),
    { keys: [...MONEY_KEYS, QK.bills], after: useReminderSync() },
  );
}

export function useUnpayBill() {
  const { useCases } = useContainer();
  return useCommand((occurrenceId: number) => useCases.unpayBill.execute(occurrenceId), {
    keys: [...MONEY_KEYS, QK.bills],
    after: useReminderSync(),
  });
}
