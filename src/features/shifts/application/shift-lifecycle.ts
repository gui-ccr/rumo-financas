import { isCreditCard } from '@/features/accounts/domain/account';
import type { AccountRepository, CategoryRepository } from '@/features/accounts/domain/repositories';
import { parseInput } from '@/shared/application/parse-input';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { DomainError, NotFoundError } from '@/shared/domain/errors';

import { EDITABLE_SHIFT_STATUSES } from '../domain/shift';
import type { CaptureRepository } from '../domain/capture-repository';
import type { ShiftRepository } from '../domain/shift-repository';
import { StartShiftInputSchema, type StartShiftInput } from './schemas';

const ALREADY_ACTIVE = 'Já existe um turno ligado. Encerre-o antes de ligar outro.';

/** Turns the shift on. Only one can be active: the use case checks, and a partial unique index enforces it. */
export class StartShift {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly accounts: AccountRepository,
    private readonly categories: CategoryRepository,
  ) {}

  async execute(input: StartShiftInput): Promise<number> {
    const v = parseInput(StartShiftInputSchema, input);
    if (await this.shifts.findActive()) throw new DomainError(ALREADY_ACTIVE);

    const category = (await this.categories.list()).find((c) => c.id === v.categoryId);
    if (!category) throw new NotFoundError('Categoria');
    if (category.kind !== 'income' || category.group !== 'moto') {
      throw new DomainError('Escolha uma categoria de entrada do grupo Moto');
    }

    const account = await this.accounts.findById(v.accountId);
    if (!account) throw new NotFoundError('Conta');
    if (isCreditCard(account)) throw new DomainError('Uma entrada não pode cair em cartão de crédito');

    try {
      return await this.shifts.insert({
        startedAt: new Date().toISOString(),
        categoryId: v.categoryId,
        accountId: v.accountId,
      });
    } catch (e) {
      // Two starts racing: the partial unique index lets only one row be active.
      if (e instanceof Error && /UNIQUE/i.test(e.message)) throw new DomainError(ALREADY_ACTIVE);
      throw e;
    }
  }
}

/** Ends the shift. Captures stop landing in it; the user reviews it next. */
export class EndShift {
  constructor(private readonly shifts: ShiftRepository) {}

  async execute(id: number): Promise<void> {
    const shift = await this.shifts.findById(id);
    if (!shift) throw new NotFoundError('Turno');
    if (shift.status !== 'active') throw new DomainError('Esse turno já foi encerrado');
    await this.shifts.setStatus(id, 'reviewing', new Date().toISOString());
  }
}

/** Throws the shift away: its captured payments are marked rejected, so nothing from it becomes income. */
export class DiscardShift {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly captures: CaptureRepository,
    private readonly uow: UnitOfWork,
  ) {}

  async execute(id: number): Promise<void> {
    const shift = await this.shifts.findById(id);
    if (!shift) throw new NotFoundError('Turno');
    if (!EDITABLE_SHIFT_STATUSES.includes(shift.status)) {
      throw new DomainError('Esse turno já foi confirmado ou descartado');
    }

    await this.uow.transaction(async () => {
      for (const capture of await this.captures.listByShift(id)) {
        if (capture.status === 'in_shift') await this.captures.update(capture.id, { status: 'rejected' });
      }
      await this.shifts.setStatus(id, 'discarded', new Date().toISOString());
    });
  }
}
