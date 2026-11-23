import { NotFoundError } from '@/shared/domain/errors';

import { hasActiveReminder } from '../domain/note';
import type { NoteRepository } from '../domain/note-repository';
import type { NoteReminderScheduler } from '../domain/reminder-scheduler';

/** Marks a note done or open. Done notes stop reminding; reopened ones remind again if the time is still ahead. */
export class ToggleNoteDone {
  constructor(
    private readonly notes: NoteRepository,
    private readonly reminders: NoteReminderScheduler,
  ) {}

  async execute(id: number, done?: boolean): Promise<void> {
    const note = await this.notes.findById(id);
    if (!note) throw new NotFoundError('Nota');
    const next = done ?? !note.done;
    await this.notes.setDone(id, next);

    await this.reminders.cancel(id);
    const updated = { ...note, done: next };
    if (hasActiveReminder(updated)) await this.reminders.schedule(updated);
  }
}

/** Pins or unpins a note. Pinned notes stay on top of the list. */
export class ToggleNotePin {
  constructor(private readonly notes: NoteRepository) {}

  async execute(id: number): Promise<void> {
    const note = await this.notes.findById(id);
    if (!note) throw new NotFoundError('Nota');
    await this.notes.setPinned(id, !note.pinned);
  }
}
