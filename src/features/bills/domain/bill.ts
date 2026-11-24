import { diffDays, type ISODate, type MonthKey } from '@/shared/domain/dates';

/** "monthly" = fixed bill (rent, internet); "once" = the one that showed up out of nowhere. */
export type Recurrence = 'monthly' | 'once';

/** How much the bill matters when money is short. Drives the payment plan order. */
export type BillPriority = 'essential' | 'important' | 'flexible';

export const BILL_PRIORITY_LABEL: Record<BillPriority, string> = {
  essential: 'Essencial',
  important: 'Importante',
  flexible: 'Pode esperar',
};

export type Bill = {
  id: number;
  name: string;
  /** null = variable amount, the user types it when paying (power, water). */
  amountCents: number | null;
  categoryId: number | null;
  accountId: number | null;
  dueDay: number;
  recurrence: Recurrence;
  startMonth: MonthKey;
  priority: BillPriority;
  /** Monthly bills only: how many months it lasts, from startMonth. null = every month, no end. */
  repeatCount: number | null;
  /** Free text shown on the bill detail. */
  notes: string | null;
  active: boolean;
};

export type OccurrenceStatus = 'pending' | 'paid';

/** One concrete due date of a bill. */
export type BillOccurrence = {
  id: number;
  billId: number;
  dueDate: ISODate;
  amountCents: number | null;
  status: OccurrenceStatus;
  transactionId: number | null;
};

/** Read model for lists. */
export type BillOccurrenceView = BillOccurrence & {
  billName: string;
  recurrence: Recurrence;
  priority: BillPriority;
  categoryId: number | null;
  accountId: number | null;
  category: { icon: string; color: string } | null;
};

export type Urgency = 'overdue' | 'today' | 'soon' | 'later' | 'paid';

export function urgencyOf(o: Pick<BillOccurrence, 'status' | 'dueDate'>, ref: ISODate): Urgency {
  if (o.status === 'paid') return 'paid';
  const days = diffDays(o.dueDate, ref);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 5) return 'soon';
  return 'later';
}

export type BillTotals = { pendingCents: number; paidCents: number; overdueCount: number };

export function totalsOf(list: BillOccurrenceView[], ref: ISODate): BillTotals {
  return list.reduce<BillTotals>(
    (acc, o) => {
      if (o.status === 'paid') acc.paidCents += o.amountCents ?? 0;
      else {
        acc.pendingCents += o.amountCents ?? 0;
        if (o.dueDate < ref) acc.overdueCount += 1;
      }
      return acc;
    },
    { pendingCents: 0, paidCents: 0, overdueCount: 0 },
  );
}
