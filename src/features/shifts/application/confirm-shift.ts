import type { CreateTransaction } from '@/features/transactions/application/create-transaction';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { DomainError, NotFoundError } from '@/shared/domain/errors';
import { toISODate } from '@/shared/domain/dates';

import type { CaptureRepository } from '../domain/capture-repository';
import type { NotificationCapture } from '../domain/notification-capture';
import type { ShiftRepository } from '../domain/shift-repository';

/** "Pix · Maria S" when the payer is known, otherwise "Pix recebido". */
const describe = (c: NotificationCapture) => (c.payer ? `Pix · ${c.payer}` : 'Pix recebido');

/**
 * Turns the included captures of a reviewed shift into income transactions, all or nothing.
 * Each capture becomes one income on the shift's category and account, marked confirmed.
 * Idempotent: a shift already confirmed returns 0 and creates nothing.
 * Returns how many transactions were created.
 */
export class ConfirmShift {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly captures: CaptureRepository,
    private readonly createTransaction: CreateTransaction,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(id: number): Promise<number> {
    const shift = await this.shifts.findById(id);
    if (!shift) throw new NotFoundError('Turno');
    if (shift.status === 'confirmed') return 0;
    if (shift.status === 'active') throw new DomainError('Encerre o turno antes de confirmar');
    if (shift.status === 'discarded') throw new DomainError('Esse turno foi descartado');

    const included = (await this.captures.listByShift(id)).filter((c) => c.status === 'in_shift');

    return this.uow.transaction(async () => {
      for (const c of included) {
        if (c.amountCents === null) throw new DomainError('Uma entrada não tem valor. Informe o valor antes de confirmar.');
        const transactionId = await this.createTransaction.execute({
          type: 'income',
          amountCents: c.amountCents,
          date: toISODate(new Date(c.postedAt)),
          description: describe(c),
          categoryId: shift.categoryId,
          accountId: shift.accountId,
          billOccurrenceId: null,
          source: 'notification',
          rawText: [c.title, c.text].filter(Boolean).join('\n') || null,
        });
        await this.captures.update(c.id, { status: 'confirmed', transactionId });
      }
      await this.shifts.setStatus(id, 'confirmed');
      return included.length;
    });
  }
}
