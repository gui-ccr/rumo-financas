/** A free-text note. `remindAt` is a UTC ISO datetime, or null when the note has no reminder. */
export type Note = {
  id: number;
  title: string;
  body: string;
  pinned: boolean;
  remindAt: string | null;
  done: boolean;
  createdAt: string;
  updatedAt: string;
};

/** What the user edits. Pin and done have their own commands. */
export type NoteContent = {
  title: string;
  body: string;
  remindAt: string | null;
};

/** "19/11 18:00" in local time: the reminder chip, set entirely in numbers. */
export function reminderLabel(remindAt: string): string {
  const d = new Date(remindAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** A reminder is live when it is set, the note is not done, and the moment is still ahead. */
export function hasActiveReminder(note: Pick<Note, 'remindAt' | 'done'>, nowMs: number = Date.now()): boolean {
  if (!note.remindAt || note.done) return false;
  return Date.parse(note.remindAt) > nowMs;
}
