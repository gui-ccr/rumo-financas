import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';

import { formatBRL } from '@/shared/domain/money';
import { addDays, parseISODate } from '@/shared/domain/dates';

import type { BillOccurrenceView } from '../domain/bill';
import type { ReminderScheduler } from '../domain/reminder-scheduler';

const CHANNEL_ID = 'bills';
const REMINDER_HOUR = 9;

/** Must run before asking for permission: Android 13+ only prompts once a channel exists. */
export async function setupReminderChannel() {
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: 'Contas a pagar',
    description: 'Lembretes de vencimento',
    importance: AndroidImportance.HIGH,
  });
}

export async function requestReminderPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.status === 'granted';
}

function at(date: string, hour: number): Date {
  const d = parseISODate(date);
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** One reminder the day before and one on the due day, at 9h. Past moments are skipped. */
export class ExpoReminderScheduler implements ReminderScheduler {
  async replaceAll(occurrences: BillOccurrenceView[]) {
    // Only bill reminders: note reminders share the device's scheduled list and must survive.
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    await Promise.all(
      scheduled
        .filter((n) => n.content.data?.kind === 'bill' || n.content.data?.occurrenceId !== undefined)
        .map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)),
    );
    const granted = (await Notifications.getPermissionsAsync()).status === 'granted';
    if (!granted) return;

    const now = Date.now();
    for (const o of occurrences) {
      const amount = o.amountCents ? ` de ${formatBRL(o.amountCents)}` : '';
      const reminders = [
        { when: at(addDays(o.dueDate, -1), REMINDER_HOUR), title: `${o.billName} vence amanhã` },
        { when: at(o.dueDate, REMINDER_HOUR), title: `${o.billName} vence hoje` },
      ];
      for (const r of reminders) {
        if (r.when.getTime() <= now) continue;
        await Notifications.scheduleNotificationAsync({
          content: {
            title: r.title,
            body: `Conta${amount}. Toque para marcar como paga.`,
            data: { kind: 'bill', occurrenceId: o.id },
          },
          trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: r.when, channelId: CHANNEL_ID },
        });
      }
    }
  }
}
