import type { Shift, ShiftStatus } from './shift';

export type NewShift = {
  startedAt: string;
  categoryId: number;
  accountId: number;
};

/** One row of the history, with the included captures already added up. */
export type ShiftSummaryRow = {
  shift: Shift;
  categoryName: string | null;
  accountName: string;
  count: number;
  totalCents: number;
};

export interface ShiftRepository {
  findById(id: number): Promise<Shift | null>;
  /** The one shift in `active` status, or null. */
  findActive(): Promise<Shift | null>;
  insert(data: NewShift): Promise<number>;
  /** endedAt is kept when omitted. */
  setStatus(id: number, status: ShiftStatus, endedAt?: string): Promise<void>;
  setReportedTotal(id: number, cents: number | null): Promise<void>;
  /** Newest first. */
  summaries(): Promise<ShiftSummaryRow[]>;
}
