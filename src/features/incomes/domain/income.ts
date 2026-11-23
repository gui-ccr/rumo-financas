import type { Recurrence } from '@/features/bills/domain/bill';
import type { ISODate, MonthKey } from '@/shared/domain/dates';

/**
 * "fixed" = pays on a schedule (salary): occurrences are generated from the recurrence.
 * "uncertain" = no date to count on (a grant, a scholarship): the user adds expected
 * occurrences by hand, each one waiting with no date until it lands.
 */
export type IncomeKind = 'fixed' | 'uncertain';

export const INCOME_KIND_LABEL: Record<IncomeKind, string> = {
  fixed: 'Fixa',
  uncertain: 'Sem data certa',
};

export type Income = {
  id: number;
  name: string;
  kind: IncomeKind;
  /** Default amount: used for every fixed occurrence, and for new uncertain ones unless overridden. */
  expectedCents: number;
  /** Account that usually receives it. Passed again when receiving, so it can change. */
  accountId: number;
  /** Category of kind 'income'. */
  categoryId: number;
  /** Fixed incomes only. */
  recurrence: Recurrence | null;
  /** Fixed incomes only: day of the month it lands. */
  dueDay: number | null;
  /** Fixed incomes only: first month the schedule applies. */
  startMonth: MonthKey | null;
  note: string | null;
  archived: boolean;
};

export type IncomeData = Omit<Income, 'id' | 'archived'>;

export type IncomeOccurrenceStatus = 'pending' | 'received';

/** One expected receipt. Uncertain ones have no date (expectedDate null); month is optional for them. */
export type IncomeOccurrence = {
  id: number;
  incomeId: number;
  expectedDate: ISODate | null;
  month: MonthKey | null;
  expectedCents: number;
  status: IncomeOccurrenceStatus;
  receivedTransactionId: number | null;
};

/** Read model for lists. */
export type IncomeOccurrenceView = IncomeOccurrence & {
  incomeName: string;
  kind: IncomeKind;
  accountId: number;
  categoryId: number;
  category: { icon: string; color: string } | null;
};
