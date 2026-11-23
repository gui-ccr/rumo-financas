import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { addMonths, currentMonth, formatMonth, type MonthKey } from '@/shared/domain/dates';

import { Text } from './text';
import { useThemeColors } from './theme';

/** Compact month stepper; tapping the label jumps back to the current month. */
export function MonthSwitcher({ month, onChange }: { month: MonthKey; onChange: (m: MonthKey) => void }) {
  const colors = useThemeColors();
  const isCurrent = month === currentMonth();
  return (
    <View className="h-10 flex-row items-center rounded-full bg-muted">
      <Pressable
        onPress={() => onChange(addMonths(month, -1))}
        hitSlop={6}
        accessibilityLabel="Mês anterior"
        className="h-10 w-10 items-center justify-center rounded-full active:opacity-60">
        <ChevronLeft size={18} color={colors.mutedForeground} />
      </Pressable>
      <Pressable onPress={() => onChange(currentMonth())} disabled={isCurrent} accessibilityLabel="Voltar para o mês atual">
        <Text className="min-w-[84px] text-center font-sans-semibold text-sm">{formatMonth(month)}</Text>
      </Pressable>
      <Pressable
        onPress={() => onChange(addMonths(month, 1))}
        hitSlop={6}
        accessibilityLabel="Próximo mês"
        className="h-10 w-10 items-center justify-center rounded-full active:opacity-60">
        <ChevronRight size={18} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}
