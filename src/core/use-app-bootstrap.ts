import { useQueryClient } from '@tanstack/react-query';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

import { requestReminderPermission, setupReminderChannel } from '@/features/bills/infrastructure/expo-reminder-scheduler';
import { QK } from '@/shared/presentation/query-keys';
import { invalidateKeys } from '@/shared/presentation/use-command';

import { useContainer } from './container-context';

if (Platform.OS !== 'web') Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function openOccurrence(response: Notifications.NotificationResponse | null) {
  const id = response?.notification.request.content.data?.occurrenceId;
  if (typeof id === 'number') router.push({ pathname: '/conta/pagar/[id]', params: { id: String(id) } });
}

/**
 * App start: materialize fixed schedules, schedule reminders, and route reminder taps.
 * Schedules are materialized here and on every return to the foreground (a new month
 * may have begun), not on every query. Queries are refreshed only when rows were created.
 */
export function useAppBootstrap() {
  const { useCases } = useContainer();
  const qc = useQueryClient();

  useEffect(() => {
    const isPhone = Platform.OS !== 'web'; // reminders are a phone feature

    const materialize = () => {
      Promise.all([useCases.syncOccurrences.execute(), useCases.syncIncomes.execute()])
        .then(([bills, incomes]) => {
          if (bills + incomes === 0) return;
          void invalidateKeys(qc, [QK.bills, QK.incomes, QK.plan]);
          if (isPhone) useCases.syncReminders.execute().catch(() => {});
        })
        .catch(() => {});
    };
    materialize();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') materialize();
    });

    if (!isPhone) return () => appState.remove();

    (async () => {
      await setupReminderChannel(); // the channel must exist before asking on Android 13+
      await requestReminderPermission();
      await useCases.syncReminders.execute();
    })().catch(() => {});

    try {
      openOccurrence(Notifications.getLastNotificationResponse());
    } catch {
      // not available in this runtime
    }
    const sub = Notifications.addNotificationResponseReceivedListener(openOccurrence);
    return () => {
      sub.remove();
      appState.remove();
    };
  }, [useCases, qc]);
}
