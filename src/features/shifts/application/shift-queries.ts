import { NotFoundError } from '@/shared/domain/errors';

import type { CaptureRepository } from '../domain/capture-repository';
import type { NotificationCapture } from '../domain/notification-capture';
import {
  INCLUDED_CAPTURE_STATUSES,
  hourlyCents,
  shiftDurationMinutes,
  type ActiveShiftView,
  type ShiftReview,
  type ShiftSummary,
} from '../domain/shift';
import type { ShiftRepository } from '../domain/shift-repository';

const isIncluded = (c: NotificationCapture) => INCLUDED_CAPTURE_STATUSES.includes(c.status);
const sumCents = (list: NotificationCapture[]) => list.reduce((total, c) => total + (c.amountCents ?? 0), 0);

/** The shift on the home screen, with its running totals. Null when none is active. */
export class GetActiveShift {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly captures: CaptureRepository,
  ) {}

  async execute(nowMs: number = Date.now()): Promise<ActiveShiftView | null> {
    const shift = await this.shifts.findActive();
    if (!shift) return null;
    const included = (await this.captures.listByShift(shift.id)).filter(isIncluded);
    return {
      shift,
      count: included.length,
      totalCents: sumCents(included),
      durationMinutes: shiftDurationMinutes(shift.startedAt, null, nowMs),
    };
  }
}

/** Everything the review screen needs: captures, totals, the reported total and the difference. */
export class GetShiftReview {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly captures: CaptureRepository,
  ) {}

  async execute(id: number, nowMs: number = Date.now()): Promise<ShiftReview> {
    const shift = await this.shifts.findById(id);
    if (!shift) throw new NotFoundError('Turno');

    const captures = await this.captures.listByShift(id);
    const included = captures.filter(isIncluded);
    const includedTotalCents = sumCents(included);
    const durationMinutes = shiftDurationMinutes(shift.startedAt, shift.endedAt, nowMs);

    return {
      shift,
      captures,
      includedCount: included.length,
      includedTotalCents,
      reportedTotalCents: shift.reportedTotalCents,
      differenceCents: shift.reportedTotalCents === null ? null : shift.reportedTotalCents - includedTotalCents,
      durationMinutes,
      hourlyCents: hourlyCents(includedTotalCents, durationMinutes),
    };
  }
}

/** Shifts history, newest first, with the earnings per hour of each. */
export class ListShifts {
  constructor(private readonly shifts: ShiftRepository) {}

  async execute(nowMs: number = Date.now()): Promise<ShiftSummary[]> {
    return (await this.shifts.summaries()).map((row) => {
      const durationMinutes = shiftDurationMinutes(row.shift.startedAt, row.shift.endedAt, nowMs);
      return { ...row, durationMinutes, hourlyCents: hourlyCents(row.totalCents, durationMinutes) };
    });
  }
}

/** Captures the user may want to look at: unmatched notifications and payments outside any shift. */
export class ListLearningCaptures {
  constructor(private readonly captures: CaptureRepository) {}

  execute(limit = 100): Promise<NotificationCapture[]> {
    return this.captures.listLearning(limit);
  }
}
