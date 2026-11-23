import { router } from 'expo-router';
import { Bike, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { useMotoSummary } from '@/features/moto/presentation/hooks';
import { IconTile } from '@/shared/ui/category-badge';
import { Money } from '@/shared/ui/money';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

/** This week's riding at a glance; opens the Moto tab. */
export function MotoSnapshot() {
  const colors = useThemeColors();
  const { data } = useMotoSummary('week');
  if (!data) return null;
  const empty = data.earnedCents + data.costCents === 0;

  return (
    <Pressable
      onPress={() => router.push('/moto')}
      accessibilityRole="button"
      accessibilityLabel="Abrir painel da moto"
      className="min-h-[72px] flex-row items-center gap-3 rounded-xl bg-card px-4 py-3 active:opacity-70">
      <IconTile>
        <Bike size={18} color={colors.foreground} strokeWidth={1.9} />
      </IconTile>
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold">Moto nesta semana</Text>
        {empty ? (
          <Text variant="muted">Nenhuma corrida registrada</Text>
        ) : (
          <Text variant="muted">
            Lucro em {data.workedDays} {data.workedDays === 1 ? 'dia rodado' : 'dias rodados'}
          </Text>
        )}
      </View>
      {!empty && <Money cents={data.profitCents} tone={data.profitCents < 0 ? 'expense' : 'income'} sign />}
      <ChevronRight size={18} color={colors.iconMuted} />
    </Pressable>
  );
}
