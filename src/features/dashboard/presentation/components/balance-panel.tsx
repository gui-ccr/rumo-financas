import { router, type Href } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';

import { formatBRL } from '@/shared/domain/money';
import { cn } from '@/shared/ui/cn';
import { Illustration } from '@/shared/ui/illustration';
import { Money } from '@/shared/ui/money';
import { Pill, Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

/**
 * Home hero (kit F04 "Total assets"): the spendable balance set large in mono,
 * straight on the page, with the month's result as a small chip.
 */
export function BalanceHero({
  availableCents,
  cardDebtCents,
  netCents,
}: {
  availableCents: number;
  cardDebtCents: number;
  netCents: number;
}) {
  const sign = netCents > 0 ? '+' : netCents < 0 ? '−' : '';
  return (
    <Surface tone="raised" className="flex-row items-center justify-between p-5">
      <View className="flex-1 gap-2">
        <Text variant="muted">Saldo disponível</Text>
        <Money cents={availableCents} size="xl" tone={availableCents < 0 ? 'expense' : 'default'} />
        <View className="flex-row flex-wrap items-center gap-2">
          <Pill
            tone={netCents > 0 ? 'income' : netCents < 0 ? 'expense' : 'neutral'}
            label={`${sign}${formatBRL(Math.abs(netCents))} este mês`}
          />
          {cardDebtCents < 0 && <Pill tone="warning" label={`Faturas ${formatBRL(-cardDebtCents)}`} />}
        </View>
      </View>
      <Illustration name="empty" size={72} />
    </Surface>
  );
}

/** Small glass status card (kit F04 "Safety"/"Staking" pair). Tappable, opens its area. */
export function StatusCard({
  title,
  href,
  children,
  className,
  leading,
}: {
  title: string;
  href: Href;
  children: ReactNode;
  className?: string;
  /** Small illustration shown left of the title. Header keeps the same height with or without it. */
  leading?: ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push(href)}
      accessibilityRole="button"
      accessibilityLabel={title}
      className={cn('flex-1 active:opacity-80', className)}>
      <Surface tone="raised" className="min-h-[124px] justify-between gap-3 rounded-lg p-4">
        <View className="min-h-[32px] flex-row items-center justify-between gap-2">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            {leading}
            <Text variant="muted" numberOfLines={1} className="shrink">
              {title}
            </Text>
          </View>
          <ChevronRight size={16} color={colors.iconMuted} />
        </View>
        {children}
      </Surface>
    </Pressable>
  );
}

/** Segmented progress (kit "4/5 checks done"): one dash per item, lit when done. */
export function Segments({ done, total }: { done: number; total: number }) {
  const count = Math.min(Math.max(total, 1), 8);
  const lit = total === 0 ? 0 : Math.round((done / total) * count);
  return (
    <View className="flex-row gap-1" accessible accessibilityLabel={`${done} de ${total}`}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} className={cn('h-1.5 flex-1 rounded-full', i < lit ? 'bg-accent' : 'bg-track')} />
      ))}
    </View>
  );
}

export function BillsStatus({ paid, total, pendingCents }: { paid: number; total: number; pendingCents: number }) {
  return (
    <StatusCard title="Contas do mês" href="/dinheiro?tab=contas">
      <Segments done={paid} total={total} />
      <View className="gap-0.5">
        <Text className="font-mono-semibold text-lg">
          {paid}/{total} <Text className="font-sans text-sm text-muted-foreground">pagas</Text>
        </Text>
        <Text variant="caption" numberOfLines={1}>
          {pendingCents > 0 ? `${formatBRL(pendingCents)} pendente` : 'Tudo em dia'}
        </Text>
      </View>
    </StatusCard>
  );
}

export function IncomeStatus({
  incomeCents,
  expectedCents = 0,
  waitingCount,
  hint,
}: {
  /** Already received this month. */
  incomeCents: number;
  /** Still expected this month (fixed incomes + bolsas tagged with this month). */
  expectedCents?: number;
  waitingCount?: number;
  hint?: string;
}) {
  return (
    <StatusCard
      title="Entradas"
      href="/dinheiro?tab=planejar"
      leading={<Illustration name={waitingCount && waitingCount > 0 ? 'waiting' : 'received'} size={36} />}>
      {/* Value on its own line, below the header, so it never shares width with the illustration. */}
      <View className="min-w-0 gap-0.5">
        <Money cents={incomeCents} size="md" tone="income" />
        <Text variant="caption" numberOfLines={1}>
          {expectedCents > 0
            ? `+ ${formatBRL(expectedCents)} previsto`
            : waitingCount && waitingCount > 0
              ? `${waitingCount} ${waitingCount === 1 ? 'bolsa aguardando' : 'bolsas aguardando'}`
              : hint ?? 'Rendas e bolsas'}
        </Text>
      </View>
    </StatusCard>
  );
}
