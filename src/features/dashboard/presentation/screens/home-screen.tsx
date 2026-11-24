import { router } from 'expo-router';
import { ArrowDownLeft, ArrowUpRight, ReceiptText, Settings } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { availableBalance, cardDebt } from '@/features/accounts/domain/account';
import { InvoiceRow, OccurrenceRow } from '@/features/bills/presentation/components/occurrence-row';
import { useBillsOfMonth, useUpcomingBills } from '@/features/bills/presentation/hooks';
import { useExpectedIncome, usePendingIncomes } from '@/features/incomes/presentation/hooks';
import { ShiftCard } from '@/features/shifts/presentation/components/shift-card';
import { ProfileHeader } from '@/features/profile/presentation/components/profile-header';
import { TransactionRow } from '@/features/transactions/presentation/components/transaction-row';
import { useRecentTransactions } from '@/features/transactions/presentation/hooks';
import { currentMonth } from '@/shared/domain/dates';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/ui/cn';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { ListSection } from '@/shared/ui/list';
import { HeaderIconButton, Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { BalanceHero, BillsStatus, IncomeStatus } from '../components/balance-panel';
import { MotoSnapshot } from '../components/moto-snapshot';
import { useMonthOverview } from '../hooks';

type Feed = 'activity' | 'due';

/**
 * Home, after the kit's F04: balance, two glass status cards, three actions,
 * then one feed with tabs — everything else lives one tap away.
 */
export function HomeScreen() {
  const colors = useThemeColors();
  const month = currentMonth();
  const overview = useMonthOverview(month);
  const bills = useBillsOfMonth(month);
  const upcoming = useUpcomingBills();
  const recent = useRecentTransactions(6);
  const expected = useExpectedIncome(month);
  const pendingIncomes = usePendingIncomes();
  const [feed, setFeed] = useState<Feed>('activity');

  const refresh = () => {
    overview.refetch();
    bills.refetch();
    upcoming.refetch();
    recent.refetch();
    expected.refetch();
    pendingIncomes.refetch();
  };

  const data = overview.data;
  const billList = bills.data?.list ?? [];
  const paid = billList.filter((o) => o.status === 'paid').length;
  const invoices = upcoming.data?.invoices ?? [];
  const dueSoon = upcoming.data?.list ?? [];
  const pendingList = pendingIncomes.data ?? [];
  const waitingCount = pendingList.filter((i) => i.expectedDate === null).length;
  // Still to come this month: pending occurrences tagged with this month (received ones are already in totals).
  const stillExpected = pendingList.filter((i) => i.month === month).reduce((sum, i) => sum + i.expectedCents, 0);

  return (
    <Screen
      header={<ProfileHeader />}
      actions={
        <HeaderIconButton label="Ajustes" onPress={() => router.push('/ajustes')}>
          <Settings size={20} color={colors.foreground} strokeWidth={1.9} />
        </HeaderIconButton>
      }
      onRefresh={refresh}
      refreshing={overview.isRefetching}>
      {data ? (
        <BalanceHero
          availableCents={availableBalance(data.balances)}
          cardDebtCents={cardDebt(data.balances)}
          netCents={data.totals.incomeCents - data.totals.expenseCents}
        />
      ) : (
        <Skeleton className="h-[104px]" />
      )}

      <ShiftCard compact />

      <View className="-mt-2 flex-row gap-3">
        <BillsStatus paid={paid} total={billList.length} pendingCents={bills.data?.totals.pendingCents ?? 0} />
        <IncomeStatus
          incomeCents={data?.totals.incomeCents ?? 0}
          expectedCents={stillExpected}
          waitingCount={waitingCount}
          hint="Rendas e bolsas"
        />
      </View>

      <View className="-mt-2 flex-row gap-2">
        <Button
          className="flex-1"
          accessibilityLabel="Registrar gasto"
          onPress={() => router.push({ pathname: '/lancamento/novo', params: { type: 'expense' } })}>
          <ArrowUpRight size={18} color={colors.primaryForeground} strokeWidth={2.2} />
          <Text>Gasto</Text>
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          accessibilityLabel="Registrar entrada"
          onPress={() => router.push({ pathname: '/lancamento/novo', params: { type: 'income' } })}>
          <ArrowDownLeft size={18} color={colors.foreground} strokeWidth={2.2} />
          <Text>Entrada</Text>
        </Button>
        <Button variant="outline" className="flex-1" accessibilityLabel="Pagar uma conta" onPress={() => router.push('/dinheiro?tab=contas')}>
          <ReceiptText size={18} color={colors.foreground} strokeWidth={2} />
          <Text>Pagar</Text>
        </Button>
      </View>

      <View className="gap-3">
        <View className="flex-row items-center gap-5">
          <FeedTab label="Atividade" active={feed === 'activity'} onPress={() => setFeed('activity')} />
          <FeedTab label="A pagar" active={feed === 'due'} onPress={() => setFeed('due')} />
          <View className="flex-1" />
          <Pressable hitSlop={10} accessibilityRole="link" onPress={() => router.push(feed === 'activity' ? '/dinheiro?tab=atividade' : '/dinheiro?tab=contas')}>
            <Text className="font-sans-semibold text-sm text-accent">Ver tudo</Text>
          </Pressable>
        </View>

        {feed === 'activity' ? (
          recent.data && recent.data.length > 0 ? (
            <ListSection variant="plain">
              {recent.data.map((t) => (
                // ListSection "plain" has -mx-4; this px-4 matches ListRow ("A pagar") so both feeds align.
                <View key={t.id} className="px-4">
                  <TransactionRow transaction={t} />
                </View>
              ))}
            </ListSection>
          ) : recent.data ? (
            <EmptyState illustration="empty" title="Nenhum lançamento ainda" description="Toque em Gasto ou Entrada para registrar o primeiro." />
          ) : null
        ) : invoices.length + dueSoon.length > 0 ? (
          <ListSection variant="plain">
            {invoices.map((inv) => (
              <InvoiceRow key={`inv-${inv.cardId}-${inv.month}`} invoice={inv} />
            ))}
            {dueSoon.map((o) => (
              <OccurrenceRow key={o.id} occurrence={o} />
            ))}
          </ListSection>
        ) : upcoming.data ? (
          <EmptyState illustration="bills" title="Nada vence nos próximos 7 dias" description="Aproveite a folga." />
        ) : null}
      </View>

      <MotoSnapshot />
    </Screen>
  );
}

/** Text tab (kit "Activity · Crypto · NFTs"): active = foreground + accent underline. */
function FeedTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" accessibilityState={{ selected: active }} className="gap-1.5 py-1">
      <Text className={cn('font-sans-semibold text-lg', active ? 'text-foreground' : 'text-muted-foreground')}>{label}</Text>
      <View className={cn('h-0.5 rounded-full', active ? 'bg-accent' : 'bg-transparent')} />
    </Pressable>
  );
}
