import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

import { hasActiveReminder, type Note } from '../domain/note';
import type { NoteReminderScheduler } from '../domain/reminder-scheduler';

const CHANNEL_ID = 'notes';

/** Marks the notifications this scheduler owns, so bill reminders never cancel them and vice versa. */
export const NOTE_REMINDER_KIND = 'note';

type NoteReminderData = { kind: typeof NOTE_REMINDER_KIND; noteId: number };

function isNoteReminder(data: unknown, noteId: number): boolean {
  const d = data as Partial<NoteReminderData> | null | undefined;
  return d?.kind === NOTE_REMINDER_KIND && d.noteId === noteId;
}

/** One local notification per note, at the time the user chose. Past times are never scheduled. */
export class ExpoNoteReminderScheduler implements NoteReminderScheduler {
  async schedule(note: Note): Promise<void> {
    if (!hasActiveReminder(note)) return;
    const granted = (await Notifications.getPermissionsAsync()).status === 'granted';
    if (!granted) return; // Permission is asked from the agenda and the note editor, never here.

    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Lembretes de notas',
      description: 'Avisos das notas com horário marcado',
      importance: AndroidImportance.HIGH,
    });
    const data: NoteReminderData = { kind: NOTE_REMINDER_KIND, noteId: note.id };
    await Notifications.scheduleNotificationAsync({
      content: {
        title: note.title || 'Lembrete',
        body: note.body.trim().slice(0, 120) || 'Toque para abrir a nota.',
        data,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(note.remindAt!),
        channelId: CHANNEL_ID,
      },
    });
  }

  async cancel(noteId: number): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => isNoteReminder(n.content.data, noteId))
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
  }
}
