import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View } from 'react-native';

import { useAccounts } from '@/features/accounts/presentation/hooks';
import type { IncomeOccurrenceView } from '@/features/incomes/domain/income';
import { useReceiveIncome } from '@/features/incomes/presentation/hooks';
import { AccountPicker, DateStepper } from '@/features/transactions/presentation/components/pickers';
import { today, type ISODate } from '@/shared/domain/dates';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { CategoryBadge } from '@/shared/ui/category-badge';
import { ErrorNote } from '@/shared/ui/feedback';
import { Field } from '@/shared/ui/form';
import { Illustration } from '@/shared/ui/illustration';
import { MoneyInput } from '@/shared/ui/money-input';
import { Text } from '@/shared/ui/text';

export function ReceiveIncomeSheet({
  occurrence,
  onDone,
}: {
  occurrence: IncomeOccurrenceView | null;
  onDone: () => void;
}) {
  if (!occurrence) return null;
  return <ReceiveIncomeForm key={occurrence.id} occurrence={occurrence} onDone={onDone} />;
}

function ReceiveIncomeForm({
  occurrence,
  onDone,
}: {
  occurrence: IncomeOccurrenceView;
  onDone: () => void;
}) {
  const accounts = useAccounts();
  const receive = useReceiveIncome();

  const [amount, setAmount] = useState<number | null>(occurrence.expectedCents);
  const [date, setDate] = useState<ISODate>(today());
  const [accountId, setAccountId] = useState<number>(occurrence.accountId);
  const [success, setSuccess] = useState(false);

  const submit = () => {
    if (!amount || amount <= 0 || !accountId) return;
    receive.mutate(
      {
        occurrenceId: occurrence.id,
        input: {
          amountCents: amount,
          date,
          accountId,
        },
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setSuccess(true);
        },
      },
    );
  };

  if (success) {
    return (
      <View className="items-center gap-3 py-4">
        <Illustration name="received" size={140} />
        <Text className="font-sans-semibold text-xl text-foreground">Renda recebida!</Text>
        <Text variant="muted" className="text-center">
          O lançamento de entrada foi criado na sua conta.
        </Text>
        <Button className="mt-4 w-full" size="lg" onPress={onDone}>
          <Text>Concluir</Text>
        </Button>
      </View>
    );
  }

  const valid = (amount ?? 0) > 0 && accountId > 0;

  return (
    <View className="gap-5 pt-1">
      <View className="flex-row items-center gap-3">
        {occurrence.category && (
          <CategoryBadge icon={occurrence.category.icon} color={occurrence.category.color} size="lg" />
        )}
        <View className="flex-1">
          <Text variant="heading">{occurrence.incomeName}</Text>
          <Text variant="muted">Marcar recebimento da bolsa / renda</Text>
        </View>
      </View>

      <Field label="Quanto entrou?" hint="Já vem com o valor previsto. Se for diferente, ajuste aqui.">
        <MoneyInput value={amount} onChange={setAmount} />
      </Field>

      <Field label="Data do recebimento" hint="Dia em que o dinheiro caiu na conta.">
        <DateStepper value={date} onChange={setDate} />
      </Field>

      <Field label="Entrou em qual conta?" hint="Conta que recebeu o dinheiro.">
        <View className="-mx-4">
          <AccountPicker accounts={accounts.data ?? []} value={accountId} onChange={setAccountId} />
        </View>
      </Field>

      <ErrorNote message={receive.error ? errorMessage(receive.error) : null} />

      <Button size="lg" disabled={!valid} loading={receive.isPending} onPress={submit} className="mt-2">
        <Text>Confirmar recebimento</Text>
      </Button>
    </View>
  );
}
