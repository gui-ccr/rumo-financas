import type { ISODate } from '@/shared/domain/dates';

import type { Bill, BillOccurrenceView } from './bill';

export type BillData = Omit<Bill, 'id' | 'active'>;

export interface BillRepository {
  findById(id: number): Promise<Bill | null>;
  listActive(): Promise<Bill[]>;
  create(data: BillData): Promise<number>;
  update(id: number, data: BillData): Promise<void>;
  deactivate(id: number): Promise<void>;

  findOccurrence(id: number): Promise<BillOccurrenceView | null>;
  occurrenceDates(billId: number): Promise<ISODate[]>;
  addOccurrence(billId: number, dueDate: ISODate, amountCents: number | null): Promise<void>;
  deletePendingOccurrences(billId: number): Promise<void>;
  /** Occurrences due in [from, to] plus pending ones before `from`. */
  occurrencesWithOverdue(from: ISODate, to: ISODate): Promise<BillOccurrenceView[]>;
  pendingUntil(to: ISODate): Promise<BillOccurrenceView[]>;
  /** Every open occurrence, overdue or not. */
  listPending(): Promise<BillOccurrenceView[]>;
  /** Every occurrence of one bill, paid and open, oldest first. */
  occurrencesOfBill(billId: number): Promise<BillOccurrenceView[]>;
  markPaid(id: number, transactionId: number, amountCents: number): Promise<void>;
  /** Reopen occurrences whose payment transactions were removed. */
  reopenByTransactions(transactionIds: number[]): Promise<void>;
}
