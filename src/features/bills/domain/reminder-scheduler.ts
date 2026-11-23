import type { BillOccurrenceView } from './bill';

/** Port for device reminders; the Expo implementation lives in infrastructure. */
export interface ReminderScheduler {
  /** Replace every scheduled reminder with these. */
  replaceAll(occurrences: BillOccurrenceView[]): Promise<void>;
}
