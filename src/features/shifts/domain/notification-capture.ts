/**
 * unmatched: a notification of a watched app that is not a payment received (kept to calibrate the rules).
 * in_shift: a payment received during an active shift. Counts toward it unless the user rejects it.
 * outside_shift: a payment received while no shift covered it. The user can pull it into a shift.
 * rejected: the user excluded it from its shift.
 * confirmed: became an income transaction (transactionId is set).
 */
export type CaptureStatus = 'unmatched' | 'in_shift' | 'outside_shift' | 'rejected' | 'confirmed';

export type NotificationCapture = {
  id: number;
  captureKey: string;
  packageName: string;
  title: string | null;
  text: string | null;
  /** UTC ISO datetime. */
  postedAt: string;
  ruleId: number | null;
  amountCents: number | null;
  payer: string | null;
  status: CaptureStatus;
  shiftId: number | null;
  transactionId: number | null;
  createdAt: string;
};

export type NewCapture = Omit<NotificationCapture, 'id' | 'createdAt' | 'transactionId'>;
