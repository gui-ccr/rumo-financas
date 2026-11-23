import type { ISODate, MonthKey } from '@/shared/domain/dates';

import type { Income, IncomeData, IncomeOccurrenceView } from './income';

export interface IncomeRepository {
  findById(id: number): Promise<Income | null>;
  listActive(): Promise<Income[]>;
  create(data: IncomeData): Promise<number>;
  update(id: number, data: IncomeData): Promise<void>;
  archive(id: number): Promise<void>;

  /** Dates already materialized for a fixed income (dated occurrences only). */
  occurrenceDates(incomeId: number): Promise<ISODate[]>;
  /** Idempotent: an existing occurrence on the same date is kept. */
  addScheduled(incomeId: number, expectedDate: ISODate, month: MonthKey, expectedCents: number): Promise<void>;
  /** Adds a waiting occurrence with no date. Returns its id. */
  addExpected(incomeId: number, month: MonthKey | null, expectedCents: number): Promise<number>;
  /** Drops the open dated occurrences so a fixed income can be regenerated. */
  deletePendingScheduled(incomeId: number): Promise<void>;
  /** Drops every open occurrence of an income. Received ones stay in history. */
  deletePending(incomeId: number): Promise<void>;

  findOccurrence(id: number): Promise<IncomeOccurrenceView | null>;
  listPending(): Promise<IncomeOccurrenceView[]>;
  /** Sum of the expected amounts of every occurrence whose month is `month`, received included. */
  sumExpected(month: MonthKey): Promise<number>;
  markReceived(id: number, transactionId: number): Promise<void>;
  /** Reopen occurrences whose receipt transactions were removed. Also satisfies the transactions PaymentLinks port. */
  releaseByTransactions(transactionIds: number[]): Promise<void>;
}
