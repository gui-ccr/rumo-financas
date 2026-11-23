import type { NotificationCapture } from './notification-capture';

/**
 * active: the driver is working and captures land in it.
 * reviewing: the shift ended; the user checks the captures before confirming.
 * confirmed: captures became income transactions. Final.
 * discarded: nothing from it is recorded. Final.
 */
export type ShiftStatus = 'active' | 'reviewing' | 'confirmed' | 'discarded';

/** Statuses in which captures and the reported total can still be edited. */
export const EDITABLE_SHIFT_STATUSES: readonly ShiftStatus[] = ['active', 'reviewing'];

/** Capture statuses that count as money earned in a shift (what a review adds up). */
export const INCLUDED_CAPTURE_STATUSES: readonly NotificationCapture['status'][] = ['in_shift', 'confirmed'];

export type Shift = {
  id: number;
  /** UTC ISO datetime. */
  startedAt: string;
  endedAt: string | null;
  status: ShiftStatus;
  categoryId: number;
  accountId: number;
  /** What the racing app says it paid in total. Null when the user did not inform it. */
  reportedTotalCents: number | null;
  createdAt: string;
};

/** Minutes from start to end (or to `nowMs` while the shift is still open). Never negative. */
export function shiftDurationMinutes(startedAt: string, endedAt: string | null, nowMs: number = Date.now()): number {
  const end = endedAt ? Date.parse(endedAt) : nowMs;
  return Math.max(0, Math.floor((end - Date.parse(startedAt)) / 60_000));
}

/** Earnings per hour in cents. Null under one minute, where the rate means nothing. */
export function hourlyCents(totalCents: number, durationMinutes: number): number | null {
  if (durationMinutes < 1) return null;
  return Math.round((totalCents * 60) / durationMinutes);
}

/** Read model: the active shift on the home screen. Totals count only the included captures. */
export type ActiveShiftView = {
  shift: Shift;
  count: number;
  totalCents: number;
  durationMinutes: number;
};

/** Read model: one row of the shifts history. */
export type ShiftSummary = {
  shift: Shift;
  categoryName: string | null;
  accountName: string;
  count: number;
  totalCents: number;
  durationMinutes: number;
  hourlyCents: number | null;
};

/**
 * Read model: the review screen. `differenceCents` is reported minus captured (null when the user
 * gave no reported total). A positive value means the racing app says it paid more than was captured.
 */
export type ShiftReview = {
  shift: Shift;
  captures: NotificationCapture[];
  includedCount: number;
  includedTotalCents: number;
  reportedTotalCents: number | null;
  differenceCents: number | null;
  durationMinutes: number;
  hourlyCents: number | null;
};
