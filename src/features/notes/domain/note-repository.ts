import type { Note, NoteContent } from './note';

export interface NoteRepository {
  /** Pinned first, then most recently edited. An empty search returns everything. */
  list(search?: string): Promise<Note[]>;
  findById(id: number): Promise<Note | null>;
  create(content: NoteContent): Promise<number>;
  update(id: number, content: NoteContent): Promise<void>;
  setPinned(id: number, pinned: boolean): Promise<void>;
  setDone(id: number, done: boolean): Promise<void>;
  delete(id: number): Promise<void>;
  /** Open notes whose reminder falls in [fromIso, toIso). Used by the agenda. */
  listReminders(fromIso: string, toIso: string): Promise<Note[]>;
}
