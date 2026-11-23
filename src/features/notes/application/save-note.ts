import { parseInput } from '@/shared/application/parse-input';
import { NotFoundError } from '@/shared/domain/errors';

import { hasActiveReminder, type NoteContent } from '../domain/note';
import type { NoteRepository } from '../domain/note-repository';
import type { NoteReminderScheduler } from '../domain/reminder-scheduler';
import { NoteInputSchema, type NoteInput } from './schemas';

/** Creates or edits a note, then keeps its reminder in step with the new content. */
export class SaveNote {
  constructor(
    private readonly notes: NoteRepository,
    private readonly reminders: NoteReminderScheduler,
  ) {}

  async execute(input: NoteInput, id?: number): Promise<number> {
    const data = parseInput(NoteInputSchema, input);
    const content: NoteContent = { title: data.title, body: data.body, remindAt: data.remindAt };

    let noteId: number;
    if (id !== undefined) {
      if (!(await this.notes.findById(id))) throw new NotFoundError('Nota');
      await this.notes.update(id, content);
      noteId = id;
    } else {
      noteId = await this.notes.create(content);
    }

    await this.reminders.cancel(noteId);
    const saved = await this.notes.findById(noteId);
    if (saved && hasActiveReminder(saved)) await this.reminders.schedule(saved);
    return noteId;
  }
}

/** Removes the note and its reminder. */
export class DeleteNote {
  constructor(
    private readonly notes: NoteRepository,
    private readonly reminders: NoteReminderScheduler,
  ) {}

  async execute(id: number): Promise<void> {
    await this.reminders.cancel(id);
    await this.notes.delete(id);
  }
}
