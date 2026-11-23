import { router } from 'expo-router';
import { Bike, ChevronRight } from 'lucide-react-native';
import { useRef } from 'react';
import { Pressable, View } from 'react-native';

import { Button } from '@/shared/ui/button';
import { IconTile } from '@/shared/ui/category-badge';
import { Illustration } from '@/shared/ui/illustration';
import { Money } from '@/shared/ui/money';
import { Sheet, type SheetRef } from '@/shared/ui/sheet';
import { Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';
import { errorMessage } from '@/shared/presentation/use-command';
import { ErrorNote } from '@/shared/ui/feedback';

import { shiftDurationMinutes } from '../../domain/shift';
import { useActiveShift, useCaptureAccess, useEndShift } from '../hooks';
import { formatDuration, pluralPix } from '../format';
import { useNow } from '../use-now';
import { StartShiftForm } from './start-shift-form';

/**
 * Racing mode on Home and Moto. Without a shift: an invitation to start one (compact row on Home).
 * With a shift on: running time, Pix count and total, and a button to end it. Tapping the card opens
 * the live review of the shift.
 */
export function ShiftCard({ compact = false }: { compact?: boolean }) {
  const colors = useThemeColors();
  const active = useActiveShift();
  const access = useCaptureAccess();
  const endShift = useEndShift();
  const now = useNow();
  const sheet = useRef<SheetRef>(null);

  const data = active.data;

  if (data) {
    const minutes = shiftDurationMinutes(data.shift.startedAt, null, now);
    return (
      <>
        <Pressable
          onPress={() => router.push(`/turno/${data.shift.id}`)}
          accessibilityRole="button"
          accessibilityLabel="Abrir conferência do turno ligado"
          className="active:opacity-80">
          <Surface tone="raised" className="gap-4 p-5">
            <View className="flex-row items-center justify-between gap-3">
              <View className="flex-1 gap-1">
                <View className="flex-row items-center gap-2">
                  <View className="h-2 w-2 rounded-full bg-income" />
                  <Text variant="muted">
                    Turno ativo · {formatDuration(minutes)} · {pluralPix(data.count)}
                  </Text>
                </View>
                <Money cents={data.totalCents} size="xl" />
              </View>
              <Illustration name="moto" size={72} />
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Text variant="caption" className="flex-1">
                Toque para ver os Pix ao vivo
              </Text>
              <Button
                variant="secondary"
                size="sm"
                loading={endShift.isPending}
                onPress={() => endShift.mutate(data.shift.id, { onSuccess: () => router.push(`/turno/${data.shift.id}`) })}>
                <Text className="text-sm">Encerrar turno</Text>
              </Button>
            </View>
            <ErrorNote message={endShift.error ? errorMessage(endShift.error) : null} />
          </Surface>
        </Pressable>
      </>
    );
  }

  const noAccess = access.available && !access.granted;
  const start = () => sheet.current?.present();

  return (
    <>
      {compact ? (
        <Surface tone="plain" className="flex-row items-center gap-3 p-4">
          <IconTile>
            <Bike size={19} color={colors.accent} strokeWidth={2} />
          </IconTile>
          <View className="flex-1 gap-0.5">
            <Text className="font-sans-semibold">Modo corrida</Text>
            <Text variant="muted" numberOfLines={2}>
              {noAccess ? 'Permita a leitura das notificações para captar os Pix.' : 'Ligue ao começar a rodar.'}
            </Text>
          </View>
          {noAccess ? (
            <Pressable onPress={() => router.push('/modo-corrida')} accessibilityRole="link" hitSlop={8}>
              <ChevronRight size={20} color={colors.iconMuted} />
            </Pressable>
          ) : (
            <Button size="sm" onPress={start}>
              <Text className="text-sm">Iniciar</Text>
            </Button>
          )}
        </Surface>
      ) : (
        <Surface tone="raised" className="gap-4 p-5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text variant="heading">Modo corrida</Text>
              <Text variant="muted">Ligue ao começar a rodar. Os Pix que caírem no Nubank entram sozinhos.</Text>
            </View>
            <Illustration name="moto" size={64} />
          </View>

          {!access.available && (
            <Text variant="caption">
              Para captar os Pix sozinho, instale o Rumo pelo APK de desenvolvimento. No Expo Go isso não funciona.
            </Text>
          )}

          {noAccess && (
            <View className="gap-3">
              <Text className="text-sm text-warning">Ainda não consigo ler as notificações do Nubank.</Text>
              <Button variant="secondary" onPress={() => router.push('/modo-corrida')}>
                <Text>Permitir leitura das notificações</Text>
              </Button>
            </View>
          )}

          <Button size="lg" onPress={start}>
            <Text>Iniciar turno</Text>
          </Button>
        </Surface>
      )}

      <Sheet ref={sheet} title="Iniciar turno">
        <StartShiftForm onStarted={() => sheet.current?.dismiss()} />
      </Sheet>
    </>
  );
}
