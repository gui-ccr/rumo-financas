import { parseInput } from '@/shared/application/parse-input';
import { DomainError, NotFoundError } from '@/shared/domain/errors';

import type { IncomeRepository } from '../domain/income-repository';
import { ExpectedIncomeInputSchema, type ExpectedIncomeInput } from './schemas';

/** Adds a waiting receipt to an uncertain income. Several can be pending at once. */
export class AddExpectedIncome {
  constructor(private readonly incomes: IncomeRepository) {}

  async execute(input: ExpectedIncomeInput): Promise<number> {
    const v = parseInput(ExpectedIncomeInputSchema, input);
    const income = await this.incomes.findById(v.incomeId);
    if (!income) throw new NotFoundError('Renda');
    if (income.kind !== 'uncertain') {
      throw new DomainError('Rendas fixas seguem a recorrência. Só rendas sem data certa aceitam entradas avulsas');
    }
    return this.incomes.addExpected(income.id, v.month, v.expectedCents ?? income.expectedCents);
  }
}
