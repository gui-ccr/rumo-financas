import { CalendarDays } from 'lucide-react-native';
import { View } from 'react-native';

import { Button } from '@/shared/ui/button';
import { Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import type { CalendarStatus } from '../../infrastructure/device-calendar';

/**
 * Shown while the device calendar is not allowed. It asks only when tapped; the
 * bills, incomes and note reminders below keep showing either way.
 */
export function ConnectCalendarCard({ status, onConnect }: { status: CalendarStatus; onConnect: () => void }) {
  const colors = useThemeColors();
  const denied = status === 'denied';
  return (
    <Surface tone="raised" className="gap-4 p-5">
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
          <CalendarDays size={20} color={colors.accent} strokeWidth={1.9} />
        </View>
        <Text variant="heading" className="flex-1">
          Veja também seus eventos
        </Text>
      </View>
      <Text variant="muted">
        {denied
          ? 'O acesso à agenda foi negado. Para mostrar seus eventos aqui, libere a agenda nas configurações do celular.'
          : 'Mostre os eventos do Google Calendar e das outras agendas deste celular. O Rumo só lê; não altera nada.'}
      </Text>
      <Button size="lg" onPress={onConnect} accessibilityLabel="Conectar agenda do Google">
        <Text>Conectar agenda do Google</Text>
      </Button>
    </Surface>
  );
}
