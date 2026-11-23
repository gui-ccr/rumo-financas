import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View } from 'react-native';

import { useAccounts, useCategoriesByUsage } from '@/features/accounts/presentation/hooks';
import type { IncomeKind } from '@/features/incomes/domain/income';
import { useAddExpectedIncome, useSaveIncome } from '@/features/incomes/presentation/hooks';
import { CategoryPicker } from '@/features/transactions/presentation/components/category-picker';
import { AccountPicker } from '@/features/transactions/presentation/components/pickers';
import { addMonths, currentMonth } from '@/shared/domain/dates';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { ErrorNote } from '@/shared/ui/feedback';
import { Field, NumberStepper } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { MoneyInput } from '@/shared/ui/money-input';
import { Segmented } from '@/shared/ui/segmented';
import { Text } from '@/shared/ui/text';

const KIND_OPTIONS: { value: IncomeKind; label: string }[] = [
  { value: 'uncertain', label: 'Bolsa / Sem data certa' },
  { value: 'fixed', label: 'Salário / Data fixa' },
];

export function IncomeFormSheet({ onDone }: { onDone: () => void }) {
  const accounts = useAccounts();
  const categories = useCategoriesByUsage('income');
  const save = useSaveIncome();

  const [kind, setKind] = useState<IncomeKind>('uncertain');
  const [name, setName] = useState('');
  const [expectedCents, setExpectedCents] = useState<number | null>(null);
  const [accountId, setAccountId] = useState<number | null>(accounts.data?.[0]?.id ?? null);
  const [categoryId, setCategoryId] = useState<number | null>(categories.data?.[0]?.id ?? null);
  const [dueDay, setDueDay] = useState<number>(5);
  /** Uncertain income (bolsa): which month it should land in; null = no idea yet. */
  const [when, setWhen] = useState<'this' | 'next' | 'unknown'>('this');
  const addExpected = useAddExpectedIncome();

  const submit = () => {
    if (!name.trim() || !expectedCents || expectedCents <= 0 || !accountId || !categoryId) return;
    save.mutate(
      {
        input: {
          name: name.trim(),
          kind,
          expectedCents,
          accountId,
          categoryId,
          recurrence: kind === 'fixed' ? 'monthly' : null,
          dueDay: kind === 'fixed' ? dueDay : null,
          startMonth: kind === 'fixed' ? currentMonth() : null,
          note: null,
        },
      },
      {
        onSuccess: (incomeId) => {
          const finish = () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            onDone();
          };
          if (kind !== 'uncertain') return finish();
          // A bolsa is only useful once it is "aguardando": create that occurrence now.
          const month = when === 'this' ? currentMonth() : when === 'next' ? addMonths(currentMonth(), 1) : null;
          addExpected.mutate({ incomeId, month, expectedCents }, { onSuccess: finish });
        },
      },
    );
  };

  const valid =
    name.trim().length > 0 &&
    (expectedCents ?? 0) > 0 &&
    accountId !== null &&
    categoryId !== null;

  return (
    <View className="gap-5 pt-1">
      <Segmented options={KIND_OPTIONS} value={kind} onChange={setKind} />

      <Field
        label="Nome da renda ou bolsa"
        hint={
          kind === 'uncertain'
            ? 'Renda sem data certa: fica aguardando até você marcar Recebi.'
            : 'Renda que cai todo mês, na mesma data. Ex.: salário.'
        }>
        <Input
          value={name}
          onChangeText={setName}
          placeholder={kind === 'uncertain' ? 'Ex.: Bolsa de Pesquisa, Freela' : 'Ex.: Salário, Pró-labore'}
          maxLength={60}
        />
      </Field>

      <Field label="Valor esperado" hint="Quanto você espera receber de cada vez. Dá para mudar depois.">
        <MoneyInput value={expectedCents} onChange={setExpectedCents} />
      </Field>

      {kind === 'uncertain' && (
        <Field label="Quando deve cair?" hint="Não sei: a entrada fica aguardando até você marcar que recebeu.">
          <Segmented
            options={[
              { value: 'this', label: 'Este mês' },
              { value: 'next', label: 'Próximo' },
              { value: 'unknown', label: 'Não sei' },
            ]}
            value={when}
            onChange={setWhen}
          />
        </Field>
      )}

      {kind === 'fixed' && (
        <Field label="Dia do pagamento" hint="Dia do mês em que costuma cair.">
          <NumberStepper value={dueDay} onChange={setDueDay} min={1} max={31} label="dia do mês" />
        </Field>
      )}

      <Field label="Conta de destino" hint="Onde esse dinheiro costuma entrar. Dá para trocar na hora de marcar Recebi.">
        <View className="-mx-4">
          <AccountPicker
            accounts={accounts.data ?? []}
            value={accountId}
            onChange={(id) => setAccountId(id)}
          />
        </View>
      </Field>

      <Field label="Categoria de entrada">
        <View className="-mx-4">
          <CategoryPicker
            categories={categories.data ?? []}
            value={categoryId}
            onChange={(id) => setCategoryId(id)}
          />
        </View>
      </Field>

      <ErrorNote message={save.error ? errorMessage(save.error) : addExpected.error ? errorMessage(addExpected.error) : null} />

      <Button size="lg" disabled={!valid} loading={save.isPending || addExpected.isPending} onPress={submit} className="mt-2">
        <Text>Salvar renda</Text>
      </Button>
    </View>
  );
}
