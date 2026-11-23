import type { Note } from './note';

/**
 * Port for note reminders. The Expo implementation lives in infrastructure.
 * Reminders are identified by their note, so one note never has two alarms.
 */
export interface NoteReminderScheduler {
  /** Schedules the note's reminder if it is live (see hasActiveReminder). Replaces an earlier one. */
  schedule(note: Note): Promise<void>;
  /** Removes the note's reminder, if any. */
  cancel(noteId: number): Promise<void>;
}
