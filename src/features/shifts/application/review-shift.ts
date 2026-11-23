import { parseInput } from '@/shared/application/parse-input';
import { DomainError, NotFoundError } from '@/shared/domain/errors';

import type { CaptureChanges, CaptureRepository } from '../domain/capture-repository';
import { EDITABLE_SHIFT_STATUSES } from '../domain/shift';
import type { ShiftRepository } from '../domain/shift-repository';
import {
  CaptureChangesInputSchema,
  ReportedTotalInputSchema,
  type CaptureChangesInput,
} from './schemas';

/** Loads a shift that can still be edited (active or reviewing). */
async function editableShift(shifts: ShiftRepository, id: number) {
  const shift = await shifts.findById(id);
  if (!shift) throw new NotFoundError('Turno');
  if (!EDITABLE_SHIFT_STATUSES.includes(shift.status)) {
    throw new DomainError('Esse turno já foi confirmado ou descartado');
  }
  return shift;
}

/**
 * Edits one capture of a shift: its amount, and whether it is included (in_shift) or rejected.
 * A confirmed capture is final.
 */
export class UpdateShiftCapture {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly captures: CaptureRepository,
  ) {}

  async execute(captureId: number, input: CaptureChangesInput): Promise<void> {
    const v = parseInput(CaptureChangesInputSchema, input);
    const capture = await this.captures.findById(captureId);
    if (!capture) throw new NotFoundError('Notificação');
    if (capture.shiftId === null) throw new DomainError('Essa notificação não está em um turno');
    await editableShift(this.shifts, capture.shiftId);
    if (capture.status === 'confirmed') throw new DomainError('Essa entrada já foi confirmada');

    const changes: CaptureChanges = {};
    if (v.amountCents !== undefined) changes.amountCents = v.amountCents;
    if (v.included !== undefined) {
      const status = v.included ? 'in_shift' : 'rejected';
      if (status !== capture.status) changes.status = status;
    }
    if (Object.keys(changes).length > 0) await this.captures.update(captureId, changes);
  }
}

/** Pulls a payment that landed outside any shift into this shift (it counts from now on). */
export class AssignCaptureToShift {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly captures: CaptureRepository,
  ) {}

  async execute(captureId: number, shiftId: number): Promise<void> {
    const capture = await this.captures.findById(captureId);
    if (!capture) throw new NotFoundError('Notificação');
    if (capture.status !== 'outside_shift') {
      throw new DomainError('Só dá para puxar para um turno uma entrada que caiu fora dele');
    }
    await editableShift(this.shifts, shiftId);
    await this.captures.update(captureId, { status: 'in_shift', shiftId });
  }
}

/** The total the racing app says it paid. Null clears it. */
export class SetReportedTotal {
  constructor(private readonly shifts: ShiftRepository) {}

  async execute(shiftId: number, cents: number | null): Promise<void> {
    const value = parseInput(ReportedTotalInputSchema, cents);
    await editableShift(this.shifts, shiftId);
    await this.shifts.setReportedTotal(shiftId, value);
  }
}
