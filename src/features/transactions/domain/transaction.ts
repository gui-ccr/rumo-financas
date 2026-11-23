import type { AccountType } from '@/features/accounts/domain/account';
import type { CategoryGroup } from '@/features/accounts/domain/category';
import type { ISODate, MonthKey } from '@/shared/domain/dates';

export type TransactionType = 'expense' | 'income' | 'transfer';

/** Where a transaction came from. "notification" is reserved for the bank-notification reader. */
export type TransactionSource = 'manual' | 'notification';

export type Installment = { groupId: string; number: number; total: number };

export type Transaction = {
  id: number;
  type: TransactionType;
  amountCents: number;
  date: ISODate;
  description: string;
  categoryId: number | null;
  accountId: number;
  toAccountId: number | null;
  billOccurrenceId: number | null;
  /** Card invoice this row belongs to (card purchases and invoice payments). */
  invoiceMonth: MonthKey | null;
  installment: Installment | null;
  source: TransactionSource;
  rawText: string | null;
};

/** Read model: a transaction with what the UI needs to render it. */
export type TransactionView = Transaction & {
  category: { name: string; icon: string; color: string; group: CategoryGroup } | null;
  account: { name: string; type: AccountType };
  toAccountName: string | null;
};

export type NewTransaction = Omit<Transaction, 'id'>;

export type TransactionFilters = {
  month: MonthKey;
  type?: TransactionType;
  categoryId?: number;
  accountId?: number;
  search?: string;
};

export const TRANSACTION_TYPE_LABEL: Record<TransactionType, string> = {
  expense: 'Gasto',
  income: 'Entrada',
  transfer: 'Transferência',
};

/** Signed effect of a transaction from the user's point of view. */
export function signedAmount(t: Pick<Transaction, 'type' | 'amountCents'>): number {
  if (t.type === 'income') return t.amountCents;
  if (t.type === 'expense') return -t.amountCents;
  return 0;
}

/** Group a date-sorted list into days, keeping order. */
export function groupByDay<T extends { date: ISODate }>(items: T[]): { date: ISODate; items: T[] }[] {
  const groups: { date: ISODate; items: T[] }[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    if (last?.date === item.date) last.items.push(item);
    else groups.push({ date: item.date, items: [item] });
  }
  return groups;
}
