import { getDefaultCalendarSync } from 'expo-calendar';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, CalendarPlus, StickyNote, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { useCalendarPermission } from '@/features/agenda/presentation/hooks';
import type { CalendarStatus } from '@/features/agenda/infrastructure/device-calendar';
import { ErrorNote } from '@/shared/ui/feedback';
import { Text } from '@/shared/ui/text';
import { useThemeColors, type ThemeColors } from '@/shared/ui/theme';

const NO_PERMISSION = 'Sem acesso à agenda do celular. Libere a permissão de calendário em Ajustes do aparelho para criar eventos.';
const NO_CALENDAR = 'Nenhum calendário padrão no celular. Adicione uma conta de agenda e tente de novo.';
const NO_EDITOR = 'Não foi possível abrir o editor de eventos do celular. Tente de novo.';

/**
 * Opens the device calendar's own event editor, one hour from the next full hour.
 * Asks for calendar permission only here, when the user chooses Evento.
 * Returns the message to show when the editor cannot be opened, or null when it opened.
 */
async function openNewEvent(
  status: CalendarStatus,
  request: () => Promise<CalendarStatus>,
  close: () => void,
): Promise<string | null> {
  const granted = status === 'granted' || (await request()) === 'granted';
  if (!granted) return NO_PERMISSION;

  let calendar: ReturnType<typeof getDefaultCalendarSync>;
  try {
    calendar = getDefaultCalendarSync();
  } catch {
    return NO_CALENDAR;
  }

  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  try {
    await calendar.addEventWithForm({ startDate: start, endDate: end });
  } catch {
    return NO_EDITOR;
  }
  // The editor is done (saved or cancelled): the sheet can go away.
  close();
  return null;
}

type QuickAction = {
  label: string;
  icon: LucideIcon;
  color: keyof Pick<ThemeColors, 'expense' | 'income' | 'foreground'>;
  /** Route to open, or the calendar event flow. */
  target: { route: () => void } | 'event';
};

const ACTIONS: QuickAction[] = [
  {
    label: 'Gasto',
    icon: ArrowUpRight,
    color: 'expense',
    target: { route: () => router.push({ pathname: '/lancamento/novo', params: { type: 'expense' } }) },
  },
  {
    label: 'Entrada',
    icon: ArrowDownLeft,
    color: 'income',
    target: { route: () => router.push({ pathname: '/lancamento/novo', params: { type: 'income' } }) },
  },
  {
    label: 'Nota',
    icon: StickyNote,
    color: 'foreground',
    target: { route: () => router.push({ pathname: '/nota/[id]', params: { id: 'nova' } }) },
  },
  { label: 'Evento', icon: CalendarPlus, color: 'foreground', target: 'event' },
];

/**
 * 2×2 grid of creation actions: round 56pt tile with the icon, and a label under it.
 * Problems with the Evento action are shown under the grid, inside the sheet.
 */
export function QuickCreateGrid({ onPick }: { onPick: () => void }) {
  const colors = useThemeColors();
  const calendar = useCalendarPermission();
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const press = async (action: QuickAction) => {
    if (busy) return;
    Haptics.selectionAsync().catch(() => {});
    setNotice(null);
    if (action.target === 'event') {
      setBusy(true);
      const problem = await openNewEvent(calendar.status, calendar.request, onPick);
      setBusy(false);
      if (problem) setNotice(problem);
      return;
    }
    onPick();
    action.target.route();
  };

  return (
    <View className="gap-2 pb-2">
      <View className="flex-row flex-wrap">
        {ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <View key={action.label} className="w-1/2 items-center pb-6">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={action.label}
                accessibilityState={{ disabled: busy }}
                onPress={() => void press(action)}
                className="items-center gap-2 active:opacity-70">
                <View className="h-14 w-14 items-center justify-center rounded-full bg-muted">
                  <Icon size={24} strokeWidth={1.9} color={colors[action.color]} />
                </View>
                <Text className="font-sans-medium text-sm">{action.label}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <ErrorNote message={notice} />
    </View>
  );
}
