import { addDays, today, type ISODate } from '@/shared/domain/dates';

import type { BillRepository } from '../domain/bill-repository';
import type { ReminderScheduler } from '../domain/reminder-scheduler';

/** How far ahead reminders are scheduled. Re-synced on every app start and bill change. */
const WINDOW_DAYS = 45;

export class SyncReminders {
  constructor(
    private readonly bills: BillRepository,
    private readonly scheduler: ReminderScheduler,
  ) {}

  async execute(ref: ISODate = today()): Promise<void> {
    const pending = await this.bills.pendingUntil(addDays(ref, WINDOW_DAYS));
    await this.scheduler.replaceAll(pending.filter((o) => o.dueDate >= ref));
  }
}
