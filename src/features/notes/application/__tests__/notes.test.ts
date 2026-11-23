/**
 * Note use cases against real SQLite (migrations + repository, no mocks of the database).
 * The reminder scheduler is replaced by a recorder, so the tests check what would be scheduled.
 */
import { DomainError, NotFoundError } from '@/shared/domain/errors';
import { migrate } from '@/shared/infrastructure/database/migrations';
import { openTestDb } from '@/shared/infrastructure/database/testing/sqlite-adapter';

import type { Note } from '../../domain/note';
import type { NoteReminderScheduler } from '../../domain/reminder-scheduler';
import { SqliteNoteRepository } from '../../infrastructure/sqlite-note-repository';
import { DeleteNote, SaveNote } from '../save-note';
import { ToggleNoteDone, ToggleNotePin } from '../toggle-note';

/** Clock fixed at 2026-11-19 10:00 local, so "future" and "past" reminders are deterministic. */
beforeAll(() => {
  jest.useFakeTimers({ now: new Date(2026, 10, 19, 10, 0, 0) });
});
afterAll(() => {
  jest.useRealTimers();
});

class RecordingScheduler implements NoteReminderScheduler {
  scheduled: Note[] = [];
  cancelled: number[] = [];
  async schedule(note: Note) {
    this.scheduled.push(note);
  }
  async cancel(noteId: number) {
    this.cancelled.push(noteId);
  }
}

const future = new Date(2026, 10, 20, 9, 30).toISOString();
const past = new Date(2026, 10, 18, 9, 30).toISOString();

async function setup() {
  const { asDb } = openTestDb();
  const adapter = asDb();
  await migrate(adapter);
  const repo = new SqliteNoteRepository(adapter);
  const reminders = new RecordingScheduler();
  return {
    repo,
    reminders,
    save: new SaveNote(repo, reminders),
    remove: new DeleteNote(repo, reminders),
    toggleDone: new ToggleNoteDone(repo, reminders),
    togglePin: new ToggleNotePin(repo),
  };
}

describe('SaveNote', () => {
  it('creates an open, unpinned note without scheduling anything', async () => {
    const s = await setup();
    const id = await s.save.execute({ title: 'Comprar pão', body: 'Na padaria da esquina' });
    const note = await s.repo.findById(id);
    expect(note).toMatchObject({ title: 'Comprar pão', body: 'Na padaria da esquina', pinned: false, done: false, remindAt: null });
    expect(s.reminders.scheduled).toHaveLength(0);
  });

  it('schedules a reminder that is in the future', async () => {
    const s = await setup();
    const id = await s.save.execute({ title: 'Pagar IPVA', remindAt: future });
    expect(s.reminders.scheduled.map((n) => n.id)).toEqual([id]);
    expect(s.reminders.scheduled[0].remindAt).toBe(future);
  });

  it('does not schedule a reminder whose time has passed', async () => {
    const s = await setup();
    await s.save.execute({ title: 'Já passou', remindAt: past });
    expect(s.reminders.scheduled).toHaveLength(0);
  });

  it('replaces the reminder when the time is edited', async () => {
    const s = await setup();
    const id = await s.save.execute({ title: 'Ligar', remindAt: future });
    const later = new Date(2026, 10, 21, 8, 0).toISOString();
    await s.save.execute({ title: 'Ligar', remindAt: later }, id);
    expect(s.reminders.cancelled).toContain(id);
    expect(s.reminders.scheduled.at(-1)).toMatchObject({ id, remindAt: later });
  });

  it('keeps pin and done state when the content is edited', async () => {
    const s = await setup();
    const id = await s.save.execute({ title: 'A' });
    await s.togglePin.execute(id);
    await s.save.execute({ title: 'A editada' }, id);
    expect(await s.repo.findById(id)).toMatchObject({ title: 'A editada', pinned: true });
  });

  it('refuses an empty note and an unknown id', async () => {
    const s = await setup();
    await expect(s.save.execute({ title: '   ', body: '' })).rejects.toBeInstanceOf(DomainError);
    await expect(s.save.execute({ title: 'x' }, 9999)).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('ToggleNoteDone and ToggleNotePin', () => {
  it('cancels the reminder when a note is done and schedules it again when reopened', async () => {
    const s = await setup();
    const id = await s.save.execute({ title: 'Renovar CNH', remindAt: future });
    s.reminders.scheduled = [];

    await s.toggleDone.execute(id, true);
    expect((await s.repo.findById(id))?.done).toBe(true);
    expect(s.reminders.cancelled.at(-1)).toBe(id);
    expect(s.reminders.scheduled).toHaveLength(0);

    await s.toggleDone.execute(id);
    expect((await s.repo.findById(id))?.done).toBe(false);
    expect(s.reminders.scheduled.map((n) => n.id)).toEqual([id]);
  });

  it('flips the pin and puts pinned notes first in the list', async () => {
    const s = await setup();
    const first = await s.save.execute({ title: 'Primeira' });
    await s.save.execute({ title: 'Segunda' });
    await s.togglePin.execute(first);
    expect((await s.repo.list())[0].id).toBe(first);
    await s.togglePin.execute(first);
    expect((await s.repo.findById(first))?.pinned).toBe(false);
  });
});

describe('DeleteNote and queries', () => {
  it('cancels the reminder and removes the note', async () => {
    const s = await setup();
    const id = await s.save.execute({ title: 'Apagar', remindAt: future });
    await s.remove.execute(id);
    expect(s.reminders.cancelled).toContain(id);
    expect(await s.repo.findById(id)).toBeNull();
  });

  it('searches title and body without caring about case', async () => {
    const s = await setup();
    await s.save.execute({ title: 'Lista', body: 'Leite e Mercado' });
    await s.save.execute({ title: 'Outra', body: 'nada a ver' });
    const found = await s.repo.list('mercado');
    expect(found.map((n) => n.title)).toEqual(['Lista']);
  });

  it('lists only open reminders inside the requested window', async () => {
    const s = await setup();
    await s.save.execute({ title: 'Dentro', remindAt: future });
    const doneId = await s.save.execute({ title: 'Feita', remindAt: future });
    await s.toggleDone.execute(doneId, true);
    await s.save.execute({ title: 'Semana que vem', remindAt: new Date(2026, 10, 30, 9).toISOString() });

    const window = await s.repo.listReminders(
      new Date(2026, 10, 20, 0, 0).toISOString(),
      new Date(2026, 10, 21, 0, 0).toISOString(),
    );
    expect(window.map((n) => n.title)).toEqual(['Dentro']);
  });
});
