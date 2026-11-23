import type { z } from 'zod';

import { parseInput } from '@/shared/application/parse-input';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { DomainError, NotFoundError } from '@/shared/domain/errors';

import type { IncomeData } from '../domain/income';
import type { IncomeRepository } from '../domain/income-repository';
import { IncomeInputSchema, type IncomeInput } from './schemas';
import type { SyncIncomes } from './sync-incomes';

export class SaveIncome {
  constructor(
    private readonly incomes: IncomeRepository,
    private readonly sync: SyncIncomes,
    private readonly uow: UnitOfWork,
  ) {}

  /**
   * Fixed incomes regenerate their open dated occurrences from the new schedule.
   * Waiting (uncertain) occurrences and received history are never touched.
   */
  async execute(input: IncomeInput, id?: number): Promise<number> {
    const v = parseInput(IncomeInputSchema, input);
    const data = toIncomeData(v);

    return this.uow.transaction(async () => {
      let incomeId = id;
      if (id !== undefined) {
        const existing = await this.incomes.findById(id);
        if (!existing) throw new NotFoundError('Renda');
        if (existing.kind !== data.kind) {
          throw new DomainError('O tipo da renda não pode mudar depois de criada');
        }
        await this.incomes.update(id, data);
        await this.incomes.deletePendingScheduled(id);
      } else {
        incomeId = await this.incomes.create(data);
      }
      const income = await this.incomes.findById(incomeId!);
      if (!income) throw new NotFoundError('Renda');
      await this.sync.syncIncome(income);
      return income.id;
    });
  }
}

/** Fixed incomes need a schedule; uncertain ones must not carry one. */
function toIncomeData(v: z.output<typeof IncomeInputSchema>): IncomeData {
  const base = {
    name: v.name,
    kind: v.kind,
    expectedCents: v.expectedCents,
    accountId: v.accountId,
    categoryId: v.categoryId,
    note: v.note,
  };
  if (v.kind === 'uncertain') {
    return { ...base, recurrence: null, dueDay: null, startMonth: null };
  }
  if (!v.recurrence) throw new DomainError('Escolha se a renda é mensal ou só uma vez');
  if (v.dueDay === null) throw new DomainError('Informe o dia em que costuma cair');
  if (!v.startMonth) throw new DomainError('Informe a partir de quando');
  return { ...base, recurrence: v.recurrence, dueDay: v.dueDay, startMonth: v.startMonth };
}

/** Stops an income: open occurrences disappear, received ones stay in history. */
export class ArchiveIncome {
  constructor(
    private readonly incomes: IncomeRepository,
    private readonly uow: UnitOfWork,
  ) {}

  execute(id: number) {
    return this.uow.transaction(async () => {
      await this.incomes.deletePending(id);
      await this.incomes.archive(id);
    });
  }
}
