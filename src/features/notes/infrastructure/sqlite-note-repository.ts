import type { SQLiteDatabase } from 'expo-sqlite';

import { toBool } from '@/shared/infrastructure/database/sql';

import type { Note, NoteContent } from '../domain/note';
import type { NoteRepository } from '../domain/note-repository';

type NoteRow = {
  id: number;
  title: string;
  body: string;
  pinned: number;
  remind_at: string | null;
  done: number;
  created_at: string;
  updated_at: string;
};

const toNote = (r: NoteRow): Note => ({
  id: r.id,
  title: r.title,
  body: r.body,
  pinned: toBool(r.pinned),
  remindAt: r.remind_at,
  done: toBool(r.done),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});

/** Escapes LIKE wildcards so a search for "100%" matches the text, not everything. */
const likeTerm = (term: string) => `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

export class SqliteNoteRepository implements NoteRepository {
  constructor(private readonly db: SQLiteDatabase) {}

  async list(search = '') {
    const term = search.trim();
    const rows = term
      ? await this.db.getAllAsync<NoteRow>(
          `SELECT * FROM notes
           WHERE title LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\'
           ORDER BY pinned DESC, updated_at DESC, id DESC`,
          [likeTerm(term), likeTerm(term)],
        )
      : await this.db.getAllAsync<NoteRow>('SELECT * FROM notes ORDER BY pinned DESC, updated_at DESC, id DESC');
    return rows.map(toNote);
  }

  async findById(id: number) {
    const row = await this.db.getFirstAsync<NoteRow>('SELECT * FROM notes WHERE id = ?', [id]);
    return row ? toNote(row) : null;
  }

  async create(c: NoteContent) {
    const res = await this.db.runAsync('INSERT INTO notes (title, body, remind_at) VALUES (?, ?, ?)', [
      c.title,
      c.body,
      c.remindAt,
    ]);
    return res.lastInsertRowId;
  }

  async update(id: number, c: NoteContent) {
    await this.db.runAsync(
      `UPDATE notes SET title = ?, body = ?, remind_at = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now') WHERE id = ?`,
      [c.title, c.body, c.remindAt, id],
    );
  }

  async setPinned(id: number, pinned: boolean) {
    await this.db.runAsync('UPDATE notes SET pinned = ? WHERE id = ?', [pinned ? 1 : 0, id]);
  }

  async setDone(id: number, done: boolean) {
    await this.db.runAsync('UPDATE notes SET done = ? WHERE id = ?', [done ? 1 : 0, id]);
  }

  async delete(id: number) {
    await this.db.runAsync('DELETE FROM notes WHERE id = ?', [id]);
  }

  async listReminders(fromIso: string, toIso: string) {
    const rows = await this.db.getAllAsync<NoteRow>(
      `SELECT * FROM notes
       WHERE remind_at IS NOT NULL AND done = 0 AND remind_at >= ? AND remind_at < ?
       ORDER BY remind_at`,
      [fromIso, toIso],
    );
    return rows.map(toNote);
  }
}
