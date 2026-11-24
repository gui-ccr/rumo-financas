import { CalendarDays, ChevronLeft, ChevronRight, CreditCard, Minus, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, View } from 'react-native';

import type { Account } from '@/features/accounts/domain/account';
import { addDays, formatDayHeader, today, type ISODate } from '@/shared/domain/dates';
import { formatBRL } from '@/shared/domain/money';
import { cn } from '@/shared/ui/cn';
import { Chip } from '@/shared/ui/form';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

export function AccountPicker({
  accounts,
  value,
  onChange,
}: {
  accounts: Account[];
  value: number | null;
  onChange: (id: number) => void;
}) {
  const colors = useThemeColors();
  // Remount when the list of options changes (e.g. transfer hides the source account), so the
  // scroll offset from the previous list does not leave the selection off screen.
  const listKey = accounts.map((a) => a.id).join(',');
  return (
    <ScrollView
      key={listKey}
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerClassName="gap-2 px-4">
      {accounts.map((a) => (
        <Chip
          key={a.id}
          label={a.name}
          selected={a.id === value}
          onPress={() => onChange(a.id)}
          color={a.type === 'credit_card' ? undefined : a.color}
          leading={
            a.type === 'credit_card' ? (
              <CreditCard size={14} color={a.id === value ? colors.primaryForeground : colors.mutedForeground} />
            ) : undefined
          }
        />
      ))}
    </ScrollView>
  );
}

/** Day stepper: most entries are today or yesterday, so no calendar is needed. */
export function DateStepper({ value, onChange }: { value: ISODate; onChange: (d: ISODate) => void }) {
  const colors = useThemeColors();
  const isToday = value >= today();
  return (
    <View className="h-10 flex-row items-center self-start rounded-full bg-muted px-1">
      <Pressable
        onPress={() => onChange(addDays(value, -1))}
        hitSlop={6}
        accessibilityLabel="Dia anterior"
        className="h-10 w-10 items-center justify-center rounded-full">
        <ChevronLeft size={18} color={colors.mutedForeground} />
      </Pressable>
      <View className="flex-row items-center gap-1.5">
        <CalendarDays size={15} color={colors.accent} strokeWidth={1.9} />
        <Text className="font-sans-medium text-sm">{formatDayHeader(value)}</Text>
      </View>
      <Pressable
        onPress={() => !isToday && onChange(addDays(value, 1))}
        disabled={isToday}
        hitSlop={6}
        accessibilityLabel="Próximo dia"
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{ opacity: isToday ? 0.3 : 1 }}>
        <ChevronRight size={18} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}

export function InstallmentStepper({
  value,
  onChange,
  totalCents,
}: {
  value: number;
  onChange: (n: number) => void;
  totalCents: number;
}) {
  const colors = useThemeColors();
  const each = value > 1 && totalCents > 0 ? ` de ${formatBRL(Math.floor(totalCents / value))}` : '';
  return (
    <View className="h-10 flex-row items-center self-start rounded-full bg-muted px-1">
      <Pressable
        onPress={() => onChange(Math.max(1, value - 1))}
        accessibilityLabel="Menos parcelas"
        className="h-10 w-10 items-center justify-center rounded-full">
        <Minus size={16} color={colors.mutedForeground} />
      </Pressable>
      <Text className={cn('text-sm', value === 1 ? 'font-sans-medium' : 'font-mono-medium')}>
        {value === 1 ? 'À vista' : `${value}x${each}`}
      </Text>
      <Pressable
        onPress={() => onChange(Math.min(24, value + 1))}
        accessibilityLabel="Mais parcelas"
        className="h-10 w-10 items-center justify-center rounded-full">
        <Plus size={16} color={colors.mutedForeground} />
      </Pressable>
    </View>
  );
}
