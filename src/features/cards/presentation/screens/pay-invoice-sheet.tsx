import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CreditCard } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccounts } from '@/features/accounts/presentation/hooks';
import { AccountPicker, DateStepper } from '@/features/transactions/presentation/components/pickers';
import { formatMonth, today, type MonthKey } from '@/shared/domain/dates';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { IconTile } from '@/shared/ui/category-badge';
import { ErrorNote, Skeleton } from '@/shared/ui/feedback';
import { Field } from '@/shared/ui/form';
import { Money } from '@/shared/ui/money';
import { MoneyInput } from '@/shared/ui/money-input';
import { Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';

import { remaining, type Invoice } from '../../domain/invoice';
import { useCardsWithInvoices, usePayInvoice } from '../hooks';

export function PayInvoiceSheet({ cardId, month }: { cardId: number; month: MonthKey }) {
  const cards = useCardsWithInvoices();
  const invoice = cards.data?.find((c) => c.card.id === cardId)?.invoices.find((i) => i.month === month);
  if (!invoice) return <Skeleton className="m-6 h-64" />;
  return <PayInvoiceForm invoice={invoice} />;
}

function PayInvoiceForm({ invoice }: { invoice: Invoice }) {
  const insets = useSafeAreaInsets();
  const accounts = useAccounts();
  const payers = (accounts.data ?? []).filter((a) => a.type !== 'credit_card');
  const [amount, setAmount] = useState<number | null>(remaining(invoice));
  const [fromAccountId, setFromAccountId] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const pay = usePayInvoice();
  const from = fromAccountId ?? payers[0]?.id ?? null;

  const submit = () => {
    if (!amount || from === null) return;
    pay.mutate(
      { cardId: invoice.cardId, month: invoice.month, fromAccountId: from, amountCents: amount, date },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          router.back();
        },
      },
    );
  };

  return (
    <View className="gap-5 bg-background px-5 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
      <View className="flex-row items-center gap-3">
        <IconTile size="lg">
          <CreditCard size={20} color={invoice.cardColor} strokeWidth={1.9} />
        </IconTile>
        <View className="flex-1">
          <Text variant="heading">Fatura {invoice.cardName}</Text>
          <Text variant="muted">{formatMonth(invoice.month)}</Text>
        </View>
      </View>
      <Surface className="flex-row items-center justify-between p-4">
        <View className="gap-0.5">
          <Text variant="caption">Total da fatura</Text>
          <Money cents={invoice.totalCents} size="md" />
        </View>
        <View className="items-end gap-0.5">
          <Text variant="caption">Em aberto</Text>
          <Money cents={remaining(invoice)} size="md" />
        </View>
      </Surface>
      <Field label="Valor do pagamento" hint="Pode pagar só uma parte. O restante continua em aberto.">
        <MoneyInput value={amount} onChange={setAmount} />
      </Field>
      <Field label="Sai de" hint="Conta que vai pagar a fatura. Cartão de crédito não aparece aqui.">

        <View className="-mx-4">
          <AccountPicker accounts={payers} value={from} onChange={setFromAccountId} />
        </View>
      </Field>
      <View className="flex-row">
        <DateStepper value={date} onChange={setDate} />
      </View>
      <ErrorNote message={pay.error ? errorMessage(pay.error) : null} />
      <Button size="lg" disabled={!amount || from === null} loading={pay.isPending} onPress={submit}>
        <Text>Pagar fatura</Text>
      </Button>
    </View>
  );
}
