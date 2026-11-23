import { router, Stack } from 'expo-router';
import { Receipt } from 'lucide-react-native';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';

import { TransactionRow } from '@/features/transactions/presentation/components/transaction-row';
import { formatMonth, formatShortDate, today, type MonthKey } from '@/shared/domain/dates';
import { Button } from '@/shared/ui/button';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { Chip } from '@/shared/ui/form';
import { ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { Pill, Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';

import { INVOICE_STATUS_LABEL, remaining, type Invoice } from '../../domain/invoice';
import { useCardsWithInvoices, useInvoiceTransactions } from '../hooks';
import { invoiceTone } from '../invoice-tone';

export function InvoiceScreen({ cardId, initialMonth }: { cardId: number; initialMonth?: MonthKey }) {
  const cards = useCardsWithInvoices();
  const entry = cards.data?.find((c) => c.card.id === cardId);
  const invoices = entry?.invoices ?? [];
  const [month, setMonth] = useState<MonthKey | undefined>(initialMonth || undefined);
  const selected = invoices.find((i) => i.month === month) ?? invoices.find((i) => i.status === 'open') ?? invoices[0];

  if (cards.isLoading) return <Skeleton className="m-5 h-56" />;
  if (!entry || !selected) {
    return <EmptyState className="m-5" icon={Receipt} title="Cartão não encontrado" />;
  }

  // Oldest on the left, like a timeline.
  const ordered = [...invoices].reverse();

  return (
    <>
      <Stack.Screen options={{ title: entry.card.name }} />
      <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-5 pb-10 pt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5">
          {ordered.map((i) => (
            <Chip key={i.month} label={formatMonth(i.month)} selected={i.month === selected.month} onPress={() => setMonth(i.month)} />
          ))}
        </ScrollView>
        <View className="px-5">
          <InvoiceSummary invoice={selected} />
        </View>
        <View className="px-5">
          <InvoiceTransactions cardId={cardId} month={selected.month} />
        </View>
      </ScrollView>
    </>
  );
}

function InvoiceSummary({ invoice: inv }: { invoice: Invoice }) {
  const left = remaining(inv);
  return (
    <Surface tone="raised" className="gap-4 p-5">
      <View className="flex-row items-center justify-between">
        <Text variant="label">Fatura de {formatMonth(inv.month).toLowerCase()}</Text>
        <Pill label={INVOICE_STATUS_LABEL[inv.status]} tone={invoiceTone(inv, today())} />
      </View>
      <Money cents={inv.totalCents} size="xl" />
      <View className="flex-row gap-6">
        <View className="gap-0.5">
          <Text variant="caption">Fecha em</Text>
          <Text className="font-mono-medium">{formatShortDate(inv.closingDate)}</Text>
        </View>
        <View className="gap-0.5">
          <Text variant="caption">Vence em</Text>
          <Text className="font-mono-medium">{formatShortDate(inv.dueDate)}</Text>
        </View>
        {inv.paidCents > 0 && (
          <View className="gap-0.5">
            <Text variant="caption">Pago</Text>
            <Money cents={inv.paidCents} tone="income" />
          </View>
        )}
      </View>
      {left > 0 && inv.status !== 'future' && (
        <Button
          size="lg"
          onPress={() =>
            router.push({ pathname: '/fatura/pagar', params: { cardId: String(inv.cardId), month: inv.month } })
          }>
          <Text>Pagar fatura</Text>
        </Button>
      )}
    </Surface>
  );
}

function InvoiceTransactions({ cardId, month }: { cardId: number; month: MonthKey }) {
  const { data } = useInvoiceTransactions(cardId, month);
  if (!data) return <Skeleton className="h-40 rounded-xl" />;
  if (data.length === 0) {
    return (
      <EmptyState
        icon={Receipt}
        title="Nenhuma compra nesta fatura"
        description="Compras feitas com este cartão aparecem aqui conforme o dia de fechamento."
      />
    );
  }
  return (
    <ListSection title="Compras e pagamentos">
      {data.map((t) => (
        <TransactionRow key={t.id} transaction={t} />
      ))}
    </ListSection>
  );
}
