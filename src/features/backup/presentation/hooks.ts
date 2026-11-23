import { useContainer } from '@/core/container-context';
import { useReminderSync } from '@/features/bills/presentation/hooks';
import { ALL_KEYS } from '@/shared/presentation/query-keys';
import { useCommand } from '@/shared/presentation/use-command';

/** Export only reads data, so nothing is invalidated. */
export function useExportBackup() {
  const { useCases } = useContainer();
  return useCommand(() => useCases.exportBackup.execute(), { keys: [] });
}

/** Restoring replaces every table, so every query is refreshed. */
export function useImportBackup() {
  const { useCases } = useContainer();
  return useCommand(() => useCases.importBackup.execute(), { keys: ALL_KEYS, after: useReminderSync() });
}
