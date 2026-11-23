import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CircleCheck } from 'lucide-react-native';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccounts, useCategories } from '@/features/accounts/presentation/hooks';
import { CategoryPicker } from '@/features/transactions/presentation/components/category-picker';
import { AccountPicker, DateStepper } from '@/features/transactions/presentation/components/pickers';
import { formatDue, formatShortDate, today } from '@/shared/domain/dates';
import { useLastAccountId } from '@/shared/presentation/preferences';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { CategoryBadge } from '@/shared/ui/category-badge';
import { ErrorNote, Skeleton } from '@/shared/ui/feedback';
import { Field } from '@/shared/ui/form';
import { Illustration } from '@/shared/ui/illustration';
import { Money } from '@/shared/ui/money';
import { MoneyInput } from '@/shared/ui/money-input';
import { Pill, Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import type { BillOccurrenceView } from '../../domain/bill';
import { useOccurrence, usePayBill, useUnpayBill } from '../hooks';

export function PayBillSheet({ id }: { id: number }) {
  const { data, isLoading } = useOccurrence(id);
  if (isLoading) return <Skeleton className="m-6 h-64" />;
  if (!data) {
    return (
      <View className="p-6">
        <Text variant="muted">Essa conta foi removida.</Text>
      </View>
    );
  }
  return data.status === 'paid' ? <PaidView occurrence={data} /> : <PayForm occurrence={data} />;
}

function Header({ o }: { o: BillOccurrenceView }) {
  return (
    <View className="flex-row items-center gap-3">
      {o.category && <CategoryBadge icon={o.category.icon} color={o.category.color} size="lg" />}
      <View className="flex-1">
        <Text variant="heading">{o.billName}</Text>
        <Text variant="muted">{o.status === 'paid' ? `Vencia em ${formatShortDate(o.dueDate)}` : formatDue(o.dueDate)}</Text>
      </View>
    </View>
  );
}

type PayStep = 'form' | 'confirm' | 'success';

function PayForm({ occurrence: o }: { occurrence: BillOccurrenceView }) {
  const insets = useSafeAreaInsets();
  const accounts = useAccounts();
  const categories = useCategories();
  const [lastAccountId] = useLastAccountId();
  const [amount, setAmount] = useState<number | null>(o.amountCents);
  const [accountId, setAccountId] = useState<number | null>(o.accountId ?? lastAccountId ?? null);
  const [date, setDate] = useState(today());
  // A bill registered without a category pays with the one chosen here: the expense needs one.
  const [categoryId, setCategoryId] = useState<number | null>(o.categoryId);
  const [step, setStep] = useState<PayStep>('form');
  const pay = usePayBill();

  const selectedAccount = accounts.data?.find((a) => a.id === accountId);
  const category = categories.data?.find((c) => c.id === categoryId);

  const submit = () => {
    if (!amount || accountId === null || categoryId === null) return;
    pay.mutate(
      { occurrenceId: o.id, input: { amountCents: amount, accountId, date, categoryId } },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setStep('success');
        },
      },
    );
  };

  if (step === 'success') {
    return (
      <View className="gap-5 bg-background px-5 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="items-center justify-center gap-3 py-4">
          <Illustration name="paid" size={160} />
          <Text variant="title" className="text-center font-sans-bold">
            Conta paga com sucesso!
          </Text>
          <Text variant="muted" className="text-center text-sm">
            {o.billName} foi marcada como paga.
          </Text>
          {amount !== null && (
            <View className="mt-1">
              <Money cents={amount} size="xl" tone="income" />
            </View>
          )}
        </View>
        <Button size="lg" onPress={() => router.back()}>
          <Text>Concluir</Text>
        </Button>
      </View>
    );
  }

  if (step === 'confirm') {
    return (
      <View className="gap-5 bg-background px-5 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
        <View className="flex-row items-center gap-3">
          {o.category && <CategoryBadge icon={o.category.icon} color={o.category.color} size="lg" />}
          <View className="flex-1">
            <Text variant="heading">Confirmar pagamento</Text>
            <Text variant="muted">{o.billName}</Text>
          </View>
        </View>

        <Surface className="gap-3 p-4">
          <View className="flex-row items-center justify-between">
            <Text variant="caption">Valor</Text>
            {amount !== null && <Money cents={amount} size="lg" />}
          </View>
          <View className="h-px bg-border" />
          <View className="flex-row items-center justify-between">
            <Text variant="caption">Conta de pagamento</Text>
            <Text className="font-sans-medium text-sm text-foreground">
              {selectedAccount?.name ?? 'Conta selecionada'}
            </Text>
          </View>
          <View className="h-px bg-border" />
          <View className="flex-row items-center justify-between">
            <Text variant="caption">Categoria</Text>
            <View className="flex-row items-center gap-2">
              {category && <CategoryBadge icon={category.icon} color={category.color} size="sm" />}
              <Text className="font-sans-medium text-sm text-foreground">
                {category?.name ?? (o.category ? o.billName : 'Sem categoria')}
              </Text>
            </View>
          </View>
          <View className="h-px bg-border" />
          <View className="flex-row items-center justify-between">
            <Text variant="caption">Data</Text>
            <Text className="font-mono-medium text-sm text-foreground">{formatShortDate(date)}</Text>
          </View>
        </Surface>

        <ErrorNote message={pay.error ? errorMessage(pay.error) : null} />

        <View className="gap-2">
          <Button size="lg" loading={pay.isPending} onPress={submit}>
            <Text>Confirmar pagamento</Text>
          </Button>
          <Button variant="ghost" disabled={pay.isPending} onPress={() => setStep('form')}>
            <Text>Voltar e alterar</Text>
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View className="gap-5 bg-background px-5 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
      <Header o={o} />
      <Surface className="flex-row items-center justify-between p-4">
        <View className="gap-0.5">
          <Text variant="caption">Previsto</Text>
          {o.amountCents !== null ? (
            <Money cents={o.amountCents} size="md" />
          ) : (
            <Text variant="muted">Valor variável</Text>
          )}
        </View>
        <View className="items-end gap-0.5">
          <Text variant="caption">Vencimento</Text>
          <Text className="font-mono-medium">{formatShortDate(o.dueDate)}</Text>
        </View>
      </Surface>
      <Field label="Valor pago" hint="Já vem com o valor previsto. Se a conta veio diferente, ajuste aqui.">
        <MoneyInput value={amount} onChange={setAmount} autoFocus={o.amountCents === null} />
      </Field>
      <Field label="Pago com" hint="Conta de onde saiu o dinheiro. Pode trocar se pagou por outra.">

        <View className="-mx-4">
          <AccountPicker accounts={accounts.data ?? []} value={accountId} onChange={setAccountId} />
        </View>
      </Field>
      {o.categoryId === null && (
        <Field label="Categoria" hint="Esta conta não tem categoria. Escolha uma para o lançamento do pagamento.">
          <View className="-mx-4">
            <CategoryPicker
              categories={(categories.data ?? []).filter((c) => c.kind === 'expense')}
              value={categoryId}
              onChange={setCategoryId}
            />
          </View>
        </Field>
      )}
      <View className="flex-row">
        <DateStepper value={date} onChange={setDate} />
      </View>
      <ErrorNote message={pay.error ? errorMessage(pay.error) : null} />
      <View className="gap-1">
        <Button
          size="lg"
          disabled={!amount || accountId === null || categoryId === null}
          onPress={() => setStep('confirm')}>
          <Text>Revisar pagamento</Text>
        </Button>
        <Button
          variant="ghost"
          onPress={() => {
            router.back();
            router.push({ pathname: '/conta/[id]', params: { id: String(o.billId) } });
          }}>
          <Text>Editar conta</Text>
        </Button>
      </View>
    </View>
  );
}

function PaidView({ occurrence: o }: { occurrence: BillOccurrenceView }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const unpay = useUnpayBill();
  return (
    <View className="gap-5 bg-background px-5 pt-5" style={{ paddingBottom: insets.bottom + 12 }}>
      <Header o={o} />
      <Surface className="flex-row items-center gap-3 px-4 py-3">
        <CircleCheck size={18} color={colors.income} strokeWidth={1.9} />
        <View className="flex-1 flex-row">
          <Pill label="Paga" tone="income" />
        </View>
        {o.amountCents !== null && <Money cents={o.amountCents} size="md" tone="income" />}
      </Surface>
      <ErrorNote message={unpay.error ? errorMessage(unpay.error) : null} />
      <Button
        variant="outline"
        size="lg"
        loading={unpay.isPending}
        onPress={() => unpay.mutate(o.id, { onSuccess: () => router.back() })}>
        <Text>Desfazer pagamento</Text>
      </Button>
      <Text variant="caption" className="text-center">
        O lançamento do pagamento será excluído e a conta volta a ficar pendente.
      </Text>
    </View>
  );
}
