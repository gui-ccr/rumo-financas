import { parseInput } from '@/shared/application/parse-input';
import type { UnitOfWork } from '@/shared/application/unit-of-work';
import { NotFoundError } from '@/shared/domain/errors';

import type { BillRepository } from '../domain/bill-repository';
import { BillInputSchema, type BillInput } from './schemas';
import type { SyncOccurrences } from './sync-occurrences';

export class SaveBill {
  constructor(
    private readonly bills: BillRepository,
    private readonly sync: SyncOccurrences,
    private readonly uow: UnitOfWork,
  ) {}

  /** Editing rebuilds the open due dates; paid history is never touched. */
  async execute(input: BillInput, id?: number): Promise<number> {
    const data = parseInput(BillInputSchema, input);
    return this.uow.transaction(async () => {
      let billId = id;
      if (id) {
        await this.bills.update(id, data);
        await this.bills.deletePendingOccurrences(id);
      } else {
        billId = await this.bills.create(data);
      }
      const bill = await this.bills.findById(billId!);
      if (!bill) throw new NotFoundError('Conta');
      await this.sync.syncBill(bill);
      return bill.id;
    });
  }
}

/** Stops a bill: open due dates disappear, paid ones stay in history. */
export class DeleteBill {
  constructor(
    private readonly bills: BillRepository,
    private readonly uow: UnitOfWork,
  ) {}

  execute(id: number) {
    return this.uow.transaction(async () => {
      await this.bills.deletePendingOccurrences(id);
      await this.bills.deactivate(id);
    });
  }
}
