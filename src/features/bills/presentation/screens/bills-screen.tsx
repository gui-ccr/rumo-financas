import { router } from 'expo-router';
import { CalendarPlus, CreditCard, Plus } from 'lucide-react-native';
import { useMemo, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';

import { remaining } from '@/features/cards/domain/invoice';
import { useCardsWithInvoices } from '@/features/cards/presentation/hooks';
import { currentMonth, formatShortDate, today } from '@/shared/domain/dates';
import { formatBRL } from '@/shared/domain/money';
import { Button } from '@/shared/ui/button';
import { IconTile } from '@/shared/ui/category-badge';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { Illustration } from '@/shared/ui/illustration';
import { ListRow, ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { MonthSwitcher } from '@/shared/ui/month-switcher';
import { HeaderIconButton, Screen } from '@/shared/ui/screen';
import type { SheetRef } from '@/shared/ui/sheet';
import { Pill, Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { InvoiceRow, OccurrenceRow } from '../components/occurrence-row';
import { PaymentPlanSheet } from '../components/payment-plan-sheet';
import { useBillsOfMonth, usePaymentPlan } from '../hooks';

export function BillsScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const colors = useThemeColors();
  const [month, setMonth] = useState(currentMonth());
  const bills = useBillsOfMonth(month);
  const cards = useCardsWithInvoices();
  const paymentPlan = usePaymentPlan();
  const ref = today();

  const plan = paymentPlan.data;
  // Items with a known amount are the ones the plan can count; variable bills wait for a value.
  const planAmountCount = plan ? plan.items.filter((i) => i.occurrence.amountCents !== null).length : 0;
  const planSheet = useRef<SheetRef>(null);
  const list = useMemo(() => bills.data?.list ?? [], [bills.data?.list]);

  const planOrderMap = useMemo(() => {
    const map = new Map<number, number>();
    plan?.items.forEach((item, index) => {
      map.set(item.occurrence.id, index);
    });
    return map;
  }, [plan]);

  const overdue = useMemo(() => {
    const items = list.filter((o) => o.status === 'pending' && o.dueDate < ref);
    if (!plan) return items;
    return [...items].sort((a, b) => (planOrderMap.get(a.id) ?? 999) - (planOrderMap.get(b.id) ?? 999));
  }, [list, ref, planOrderMap, plan]);

  const upcoming = useMemo(() => {
    const items = list.filter((o) => o.status === 'pending' && o.dueDate >= ref);
    if (!plan) return items;
    return [...items].sort((a, b) => (planOrderMap.get(a.id) ?? 999) - (planOrderMap.get(b.id) ?? 999));
  }, [list, ref, planOrderMap, plan]);

  const paid = list.filter((o) => o.status === 'paid');
  const invoices = bills.data?.invoices ?? [];
  const totals = bills.data?.totals;
  const newBill = () => router.push({ pathname: '/conta/[id]', params: { id: 'nova' } });

  return (
    <Screen
      title="Contas"
      embedded={embedded}
      // Embedded in Dinheiro there is no title: the month switcher takes the left side, so the row is not half empty.
      header={
        embedded ? (
          <View className="flex-row">
            <MonthSwitcher month={month} onChange={setMonth} />
          </View>
        ) : undefined
      }
      actions={
        <>
          {!embedded && <MonthSwitcher month={month} onChange={setMonth} />}
          <HeaderIconButton label="Nova conta a pagar" onPress={newBill}>
            <Plus size={20} color={colors.foreground} strokeWidth={1.9} />
          </HeaderIconButton>
        </>
      }
      onRefresh={() => {
        bills.refetch();
        cards.refetch();
        paymentPlan.refetch();
      }}
      refreshing={bills.isRefetching || paymentPlan.isRefetching}>
      {totals ? (
        <Pressable
          onPress={() => planSheet.current?.present()}
          accessibilityRole="button"
          accessibilityLabel="Ver a ordem de pagamento das contas deste mês"
          className="active:opacity-80">
        <Surface tone="raised" className="gap-4 p-5">
          <View className="flex-row items-center justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text variant="caption">Contas deste mês</Text>
              <Money cents={totals.pendingCents + invoices.reduce((s, i) => s + remaining(i), 0)} size="xl" />
              {totals.overdueCount > 0 && (
                <View className="flex-row pt-1">
                  <Pill
                    label={`${totals.overdueCount} ${totals.overdueCount === 1 ? 'atrasada' : 'atrasadas'}`}
                    tone="expense"
                  />
                </View>
              )}
            </View>
            <Illustration name="bills" size={80} />
          </View>

          {plan && plan.items.length > 0 ? (
            <View className="gap-1.5">
              <Text className="font-sans-medium text-sm">{`Seu saldo: ${formatBRL(plan.availableCents)}`}</Text>
              {planAmountCount > 0 &&
                (plan.shortfallCents > 0 ? (
                  <Text className="font-sans-semibold text-sm text-expense">
                    {`Faltam ${formatBRL(plan.shortfallCents)} para pagar as contas deste mês`}
                  </Text>
                ) : (
                  <Text className="font-sans-semibold text-sm text-income">
                    Seu saldo cobre todas as contas deste mês
                  </Text>
                ))}
              <Text variant="caption">Toque para ver a ordem: o que cabe e o que não cabe.</Text>
            </View>
          ) : null}

          {plan?.nextIncome && (
            <View className="flex-row items-center justify-between rounded-lg bg-income-soft px-3.5 py-2.5">
              <View className="flex-1 pr-2">
                <Text className="font-sans-medium text-xs text-income" numberOfLines={1}>
                  Próxima renda: {plan.nextIncome.name}
                  {plan.nextIncome.expectedDate ? ` (${formatShortDate(plan.nextIncome.expectedDate)})` : ''}
                </Text>
              </View>
              <Money cents={plan.nextIncome.expectedCents} tone="income" size="sm" />
            </View>
          )}

          <View className="h-px bg-border" />
          <View className="flex-row items-center justify-between">
            <Text variant="muted">Já pago</Text>
            <Money cents={totals.paidCents} size="md" tone="income" />
          </View>
        </Surface>
        </Pressable>
      ) : (
        <Skeleton className="h-44" />
      )}

      {(overdue.length > 0 || invoices.some((i) => i.dueDate < ref)) && (
        <ListSection title="Atrasadas">
          {invoices
            .filter((i) => i.dueDate < ref)
            .map((i) => (
              <InvoiceRow key={`${i.cardId}-${i.month}`} invoice={i} />
            ))}
          {overdue.map((o) => (
            <OccurrenceRow key={o.id} occurrence={o} />
          ))}
        </ListSection>
      )}

      {(upcoming.length > 0 || invoices.some((i) => i.dueDate >= ref)) && (
        <ListSection title="A vencer">
          {invoices
            .filter((i) => i.dueDate >= ref)
            .map((i) => (
              <InvoiceRow key={`${i.cardId}-${i.month}`} invoice={i} />
            ))}
          {upcoming.map((o) => (
            <OccurrenceRow key={o.id} occurrence={o} />
          ))}
        </ListSection>
      )}

      {paid.length > 0 && (
        <ListSection title="Pagas">
          {paid.map((o) => (
            <OccurrenceRow key={o.id} occurrence={o} />
          ))}
        </ListSection>
      )}

      {bills.data && list.length === 0 && invoices.length === 0 && (
        <EmptyState
          icon={CalendarPlus}
          title="Cadastre suas contas"
          description="Aluguel, internet, luz ou aquela conta que apareceu do nada. O app avisa um dia antes e no dia do vencimento."
          action={
            <Button size="lg" onPress={newBill}>
              <Text>Adicionar conta</Text>
            </Button>
          }
        />
      )}

      {cards.data && cards.data.length > 0 && (
        <ListSection title="Cartões">
          {cards.data.map(({ card, invoices: cardInvoices }) => {
            const open = cardInvoices.find((i) => i.status === 'open');
            return (
              <ListRow
                key={card.id}
                onPress={() =>
                  router.push({
                    pathname: '/fatura/[cardId]',
                    params: { cardId: String(card.id), month: open?.month ?? '' },
                  })
                }
                leading={
                  <IconTile>
                    <CreditCard size={17} color={card.color} strokeWidth={1.9} />
                  </IconTile>
                }
                title={card.name}
                subtitle={open ? `Fatura aberta, fecha ${formatShortDate(open.closingDate)}` : undefined}
                trailing={<Money cents={open?.totalCents ?? 0} />}
              />
            );
          })}
        </ListSection>
      )}

      {plan && <PaymentPlanSheet sheetRef={planSheet} plan={plan} />}
    </Screen>
  );
}
