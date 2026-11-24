import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { useContainer } from '@/core/container-context';
import { MONEY_KEYS, QK } from '@/shared/presentation/query-keys';
import { invalidateKeys, useCommand } from '@/shared/presentation/use-command';

import type {
  CaptureChangesInput,
  NotificationRuleInput,
  StartShiftInput,
} from '../application/schemas';
import type { RawCapture } from '../domain/notification-source';

/** Every shift change refetches the shift queries (active, history, review, learning, rules). */
const SHIFT_KEYS = [QK.shifts];

// ---------- Queries ----------

/** The shift on, with its running count, total and duration. Null when none is on. */
export function useActiveShift() {
  const { useCases } = useContainer();
  return useQuery({ queryKey: ['shifts', 'active'], queryFn: () => useCases.getActiveShift.execute() });
}

/** Shifts history, newest first, with totals and earnings per hour. */
export function useShifts() {
  const { useCases } = useContainer();
  return useQuery({ queryKey: ['shifts', 'list'], queryFn: () => useCases.listShifts.execute() });
}

/** The review of one shift (captures, totals, reported difference, hourly rate). Disabled while id is undefined. */
export function useShiftReview(id: number | undefined) {
  const { useCases } = useContainer();
  return useQuery({
    queryKey: ['shifts', 'review', id],
    queryFn: () => useCases.getShiftReview.execute(id!),
    enabled: id !== undefined,
  });
}

/** Unmatched notifications and payments outside any shift, newest first (to calibrate the rules). */
export function useLearningCaptures() {
  const { useCases } = useContainer();
  return useQuery({ queryKey: ['shifts', 'learning'], queryFn: () => useCases.listLearningCaptures.execute() });
}

/** The notification rules, by name (active and inactive). */
export function useNotificationRules() {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['shifts', 'rules'], queryFn: () => repos.notificationRules.list() });
}

/**
 * Pre-selected account and category for a new shift: the Nubank account and the iFood category from the seed,
 * otherwise the first option available. Both null when the user has none of them.
 */
export function useShiftDefaults() {
  const { repos } = useContainer();
  return useQuery({
    queryKey: ['shifts', 'defaults'],
    queryFn: async () => {
      const [accounts, categories] = await Promise.all([repos.accounts.list(), repos.categories.list()]);
      const account =
        accounts.find((a) => a.name === 'Nubank' && !a.archived) ??
        accounts.find((a) => a.type === 'checking' && !a.archived);
      const incomes = categories.filter((c) => c.kind === 'income' && c.group === 'moto' && !c.archived);
      const category = incomes.find((c) => c.name === 'iFood') ?? incomes[0];
      return { accountId: account?.id ?? null, categoryId: category?.id ?? null };
    },
  });
}

// ---------- Commands ----------

/** Turns the shift on. Resolves to the new shift id. */
export function useStartShift() {
  const { useCases } = useContainer();
  return useCommand((input: StartShiftInput) => useCases.startShift.execute(input), { keys: SHIFT_KEYS });
}

/** Ends the active shift; it moves to review. */
export function useEndShift() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.endShift.execute(id), { keys: SHIFT_KEYS });
}

/** Discards a shift that is not confirmed yet. Its captures are rejected. */
export function useDiscardShift() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.discardShift.execute(id), { keys: SHIFT_KEYS });
}

/**
 * Confirms a reviewed shift: each included capture becomes an income transaction.
 * Resolves to how many were created (0 if the shift was already confirmed).
 */
export function useConfirmShift() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.confirmShift.execute(id), { keys: [...MONEY_KEYS, ...SHIFT_KEYS] });
}

/** Edits a capture of a shift: amount, and included (true) or rejected (false). */
export function useUpdateShiftCapture() {
  const { useCases } = useContainer();
  return useCommand(
    (a: { captureId: number; changes: CaptureChangesInput }) =>
      useCases.updateShiftCapture.execute(a.captureId, a.changes),
    { keys: SHIFT_KEYS },
  );
}

/** Pulls a capture that landed outside any shift into the given shift. */
export function useAssignCapture() {
  const { useCases } = useContainer();
  return useCommand(
    (a: { captureId: number; shiftId: number }) => useCases.assignCaptureToShift.execute(a.captureId, a.shiftId),
    { keys: SHIFT_KEYS },
  );
}

/** The total the racing app says it paid, in cents. Null clears it. */
export function useSetReportedTotal() {
  const { useCases } = useContainer();
  return useCommand(
    (a: { shiftId: number; cents: number | null }) => useCases.setReportedTotal.execute(a.shiftId, a.cents),
    { keys: SHIFT_KEYS },
  );
}

/** Creates a notification rule, or edits one when `id` is given. Resolves to the rule id. */
export function useSaveNotificationRule() {
  const { useCases } = useContainer();
  return useCommand(
    (a: { input: NotificationRuleInput; id?: number }) => useCases.saveNotificationRule.execute(a.input, a.id),
    { keys: SHIFT_KEYS },
  );
}

export function useDeleteNotificationRule() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.deleteNotificationRule.execute(id), { keys: SHIFT_KEYS });
}

/** Turns a rule on or off. Without `active`, flips it. */
export function useToggleNotificationRule() {
  const { useCases } = useContainer();
  return useCommand(
    (a: { id: number; active?: boolean }) => useCases.toggleNotificationRule.execute(a.id, a.active),
    { keys: SHIFT_KEYS },
  );
}

// ---------- Capture and permission ----------

/**
 * Keeps notifications flowing into the app. Mounted once at startup: it hands the watched apps to the
 * native reader, drains what was queued (at mount and every time the app returns to the foreground), and
 * ingests live captures as they arrive. Ingestion runs one batch at a time. Does nothing where the native
 * reader is not available.
 */
export function useNotificationSync() {
  const { useCases, notificationSource } = useContainer();
  const qc = useQueryClient();

  useEffect(() => {
    if (!notificationSource.isAvailable()) return;

    let queue: Promise<void> = Promise.resolve();
    const ingest = (raw: RawCapture[]) => {
      if (raw.length === 0) return;
      queue = queue
        .then(() => useCases.ingestCaptures.execute(raw))
        .then((added) => (added > 0 ? invalidateKeys(qc, SHIFT_KEYS).then(() => undefined) : undefined))
        .catch(() => {});
    };
    const drain = () => {
      try {
        ingest(notificationSource.drainCaptures());
      } catch {
        // the reader can refuse while the phone is locked; the next foreground drains it
      }
    };

    useCases.syncWatchedPackages.execute().catch(() => {});
    drain();
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') drain();
    });
    const live = notificationSource.addCaptureListener((capture) => ingest([capture]));

    return () => {
      appState.remove();
      live.remove();
    };
  }, [useCases, notificationSource, qc]);
}

/**
 * Whether the app can read notifications: the native reader exists, and the user granted access.
 * `refresh` re-reads it; the state also refreshes when the app returns to the foreground (the user
 * usually comes back from the system settings screen). `settingsFailed` is true when no settings
 * screen could be opened from the last `openSettings` call.
 */
export function useCaptureAccess() {
  const { notificationSource } = useContainer();

  const read = useCallback(() => {
    const available = notificationSource.isAvailable();
    return { available, granted: available && notificationSource.hasPermission() };
  }, [notificationSource]);

  const [access, setAccess] = useState(read);
  const [settingsFailed, setSettingsFailed] = useState(false);
  const refresh = useCallback(() => setAccess(read()), [read]);

  useEffect(() => {
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => appState.remove();
  }, [refresh]);

  const openSettings = useCallback(async () => {
    const opened = await notificationSource.openPermissionSettings();
    setSettingsFailed(!opened);
  }, [notificationSource]);

  return { available: access.available, granted: access.granted, openSettings, settingsFailed, refresh };
}
