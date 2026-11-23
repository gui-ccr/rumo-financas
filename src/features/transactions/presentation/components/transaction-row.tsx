import { router } from 'expo-router';
import { ArrowDownLeft, ArrowLeftRight, ArrowUpRight } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { CategoryBadge, IconTile } from '@/shared/ui/category-badge';
import { Money } from '@/shared/ui/money';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { signedAmount, type TransactionView } from '../../domain/transaction';

function subtitleOf(t: TransactionView): string {
  if (t.type === 'transfer') return `De ${t.account.name} para ${t.toAccountName ?? ''}`;
  const parts = [t.category?.name && t.description ? t.category.name : null, t.account.name];
  if (t.installment) parts.push(`parcela ${t.installment.number}/${t.installment.total}`);
  return parts.filter(Boolean).join(' · ');
}

/** "2026-11-14" -> "14/11", set in Geist Mono under the amount. */
function shortDay(s: string): string {
  const [, m, d] = s.split('-');
  return `${d}/${m}`;
}

/**
 * One movement (kit "Transaction Row"): 40pt category mark with a direction
 * badge (green in, red out), title and "Categoria · conta", and the amount with
 * its date on the right. Flat on the screen background, no card around it.
 */
function TransactionRowView({ transaction: t }: { transaction: TransactionView }) {
  const colors = useThemeColors();
  const title = t.description || t.category?.name || (t.type === 'transfer' ? 'Transferência' : 'Sem categoria');
  const isIncome = t.type === 'income';
  const isTransfer = t.type === 'transfer';
  const Direction = isIncome ? ArrowDownLeft : ArrowUpRight;

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/lancamento/[id]', params: { id: String(t.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${title}, editar`}
      className="min-h-[64px] flex-row items-center gap-3 py-2.5 active:opacity-70">
      <View>
        {isTransfer || !t.category ? (
          <IconTile>
            <ArrowLeftRight size={17} color={colors.mutedForeground} strokeWidth={1.9} />
          </IconTile>
        ) : (
          <CategoryBadge icon={t.category.icon} color={t.category.color} />
        )}
        {!isTransfer && (
          <View className="absolute -bottom-0.5 -right-0.5 h-[18px] w-[18px] items-center justify-center rounded-full bg-background">
            <Direction size={11} strokeWidth={2.4} color={isIncome ? colors.income : colors.expense} />
          </View>
        )}
      </View>

      <View className="flex-1 gap-0.5">
        <Text className="font-sans-semibold" numberOfLines={1}>
          {title}
        </Text>
        <Text variant="muted" numberOfLines={1}>
          {subtitleOf(t)}
        </Text>
      </View>

      <View className="items-end gap-0.5">
        {isTransfer ? (
          <Money cents={t.amountCents} tone="muted" />
        ) : (
          <Money cents={signedAmount(t)} sign tone={isIncome ? 'income' : 'default'} />
        )}
        <Text className="font-mono-medium text-xs text-muted-foreground" style={{ fontVariant: ['tabular-nums'] }}>
          {shortDay(t.date)}
        </Text>
      </View>
    </Pressable>
  );
}

/** Memoized: query data keeps object identity for unchanged rows, so a refetch re-renders only what changed. */
export const TransactionRow = memo(TransactionRowView);
