import type { CaptureStatus, NewCapture, NotificationCapture } from './notification-capture';

export type CaptureChanges = Partial<{
  amountCents: number | null;
  status: CaptureStatus;
  shiftId: number | null;
  transactionId: number | null;
}>;

export interface CaptureRepository {
  findById(id: number): Promise<NotificationCapture | null>;
  /** Idempotent on captureKey. Returns true when a new row was stored. */
  insertIfNew(data: NewCapture): Promise<boolean>;
  update(id: number, changes: CaptureChanges): Promise<void>;
  /** Oldest first. */
  listByShift(shiftId: number): Promise<NotificationCapture[]>;
  /** Unmatched and outside-shift captures, newest first. */
  listLearning(limit: number): Promise<NotificationCapture[]>;
}
