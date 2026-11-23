import { router, type Href } from 'expo-router';
import { Receipt, StickyNote, Wallet } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { BILL_PRIORITY_LABEL, type BillPriority } from '@/features/bills/domain/bill';
import { IconTile } from '@/shared/ui/category-badge';
import { Money } from '@/shared/ui/money';
import { Pill } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import type { AgendaItem } from '../../domain/agenda';

const PRIORITY_TONE: Record<BillPriority, 'accent' | 'warning' | 'neutral'> = {
  essential: 'accent',
  important: 'warning',
  flexible: 'neutral',
};

/**
 * One line of the day's agenda. Timed items put the hour in Geist Mono on the left;
 * device events carry a thin bar in their calendar's color; bills and incomes get an icon tile.
 */
export function AgendaItemRow({ item }: { item: AgendaItem }) {
  const colors = useThemeColors();
  const tappable = item.href !== null;
  const open = () => item.href && router.push(item.href as Href);

  const leading = (() => {
    if (item.kind === 'bill') {
      return (
        <IconTile>
          <Receipt size={18} color={colors.mutedForeground} strokeWidth={1.9} />
        </IconTile>
      );
    }
    if (item.kind === 'income') {
      return (
        <IconTile>
          <Wallet size={18} color={colors.income} strokeWidth={1.9} />
        </IconTile>
      );
    }
    if (item.time) {
      return (
        <View className="w-12 items-start">
          <Text className="font-mono-medium text-sm" style={{ fontVariant: ['tabular-nums'] }}>
            {item.time}
          </Text>
        </View>
      );
    }
    return null;
  })();

  const bar =
    item.kind === 'event' ? (
      <View className="h-9 w-[3px] rounded-full" style={{ backgroundColor: item.color ?? colors.accent }} />
    ) : null;

  const subtitle =
    item.kind === 'bill' && item.priority ? (
      <Pill label={BILL_PRIORITY_LABEL[item.priority]} tone={PRIORITY_TONE[item.priority]} />
    ) : (
      <Text variant="caption">
        {item.kind === 'event'
          ? item.allDay
            ? 'Dia inteiro'
            : 'Evento do celular'
          : item.kind === 'income'
            ? 'Renda prevista'
            : item.kind === 'note'
              ? 'Lembrete de nota'
              : 'Conta a pagar'}
      </Text>
    );

  const trailing =
    item.kind === 'bill' ? (
      item.amountCents !== undefined ? (
        <Money cents={item.amountCents} />
      ) : (
        <Text variant="caption">Valor variável</Text>
      )
    ) : item.kind === 'income' && item.amountCents !== undefined ? (
      <Money cents={item.amountCents} sign tone="income" />
    ) : item.kind === 'note' ? (
      <StickyNote size={16} color={colors.iconMuted} strokeWidth={1.9} />
    ) : null;

  return (
    <Pressable
      onPress={open}
      disabled={!tappable}
      accessibilityRole={tappable ? 'button' : 'text'}
      accessibilityLabel={`${item.time ? `${item.time}, ` : ''}${item.title}`}
      className="min-h-[64px] flex-row items-center gap-3 py-2.5 active:opacity-70">
      {leading}
      {bar}
      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold" numberOfLines={1}>
          {item.title}
        </Text>
        {subtitle}
      </View>
      {trailing}
    </Pressable>
  );
}
