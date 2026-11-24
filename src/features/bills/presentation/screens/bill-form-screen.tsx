import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccounts, useCategoriesByUsage } from '@/features/accounts/presentation/hooks';
import { CategoryPicker } from '@/features/transactions/presentation/components/category-picker';
import { AccountPicker } from '@/features/transactions/presentation/components/pickers';
import { currentMonth, formatMonth } from '@/shared/domain/dates';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { DayPicker } from '@/shared/ui/day-picker';
import { ErrorNote, Skeleton } from '@/shared/ui/feedback';
import { Chip, Field, NumberStepper } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { ModalHeader } from '@/shared/ui/modal-header';
import { MoneyInput } from '@/shared/ui/money-input';
import { MonthSwitcher } from '@/shared/ui/month-switcher';
import { Segmented } from '@/shared/ui/segmented';
import { Text } from '@/shared/ui/text';

import { BILL_PRIORITY_LABEL, type Bill, type BillPriority, type Recurrence } from '../../domain/bill';
import { repeatEndMonth } from '../../domain/recurrence';
import { useBill, useDeleteBill, useSaveBill } from '../hooks';

const PRIORITIES: { value: BillPriority; label: string }[] = [
  { value: 'essential', label: BILL_PRIORITY_LABEL.essential },
  { value: 'important', label: BILL_PRIORITY_LABEL.important },
  { value: 'flexible', label: BILL_PRIORITY_LABEL.flexible },
];

/**
 * How often the bill comes. "forever" and "times" are both monthly bills; the difference is
 * whether they stop after a set number of months. "once" is a single due date.
 */
type Scope = 'forever' | 'times' | 'once';

const DEFAULT_TIMES = 3;

function scopeOf(bill: Bill | null): Scope {
  if (bill?.recurrence === 'once') return 'once';
  return bill?.repeatCount ? 'times' : 'forever';
}

export function BillFormScreen({ id }: { id?: number }) {
  const bill = useBill(id);
  if (id !== undefined && bill.isLoading) {
    return (
      <View className="flex-1 gap-4 bg-background px-5">
        <ModalHeader title="Conta" />
        <Skeleton className="h-14" />
        <Skeleton className="h-40" />
      </View>
    );
  }
  return <BillForm bill={bill.data ?? null} />;
}

function BillForm({ bill }: { bill: Bill | null }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(bill?.name ?? '');
  const [variable, setVariable] = useState(bill ? bill.amountCents === null : false);
  const [amount, setAmount] = useState<number | null>(bill?.amountCents ?? null);
  const [dueDay, setDueDay] = useState(bill?.dueDay ?? 10);
  const [scope, setScope] = useState<Scope>(scopeOf(bill));
  const [repeatCount, setRepeatCount] = useState(bill?.repeatCount ?? DEFAULT_TIMES);
  const [startMonth, setStartMonth] = useState(bill?.startMonth ?? currentMonth());
  const [priority, setPriority] = useState<BillPriority>(bill?.priority ?? 'important');
  const [categoryId, setCategoryId] = useState<number | null>(bill?.categoryId ?? null);
  const [accountId, setAccountId] = useState<number | null>(bill?.accountId ?? null);
  const [notes, setNotes] = useState(bill?.notes ?? '');

  const recurrence: Recurrence = scope === 'once' ? 'once' : 'monthly';
  const endMonth = scope === 'times' ? repeatEndMonth(startMonth, repeatCount) : null;

  const categories = useCategoriesByUsage('expense');
  const accounts = useAccounts();
  const save = useSaveBill();
  const remove = useDeleteBill();

  const submit = () =>
    save.mutate(
      {
        id: bill?.id,
        input: {
          name,
          amountCents: variable ? null : amount,
          categoryId,
          accountId,
          dueDay,
          recurrence,
          repeatCount: scope === 'times' ? repeatCount : null,
          startMonth,
          priority,
          notes,
        },
      },
      { onSuccess: () => router.back() },
    );

  const confirmDelete = () =>
    Alert.alert(
      'Remover conta',
      `${bill?.name} deixa de aparecer nos próximos meses. Os pagamentos já feitos continuam no histórico.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => bill && remove.mutate(bill.id, { onSuccess: () => router.back() }),
        },
      ],
    );

  const valid = name.trim().length > 0 && (variable || (amount ?? 0) > 0);

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-background">
      <ModalHeader title={bill ? 'Editar conta' : 'Nova conta'} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-5 pb-8 pt-2">
        <Segmented
          options={[
            { value: 'forever', label: 'Todo mês' },
            { value: 'times', label: 'Algumas vezes' },
            { value: 'once', label: 'Só uma vez' },
          ]}
          value={scope}
          onChange={setScope}
        />

        <Field label="Nome" hint="Como a conta aparece na lista. Ex.: Aluguel, Internet, Luz.">
          <Input
            value={name}
            onChangeText={setName}
            placeholder={recurrence === 'monthly' ? 'Ex.: Aluguel, Internet' : 'Ex.: Conserto da moto'}
            maxLength={60}
          />
        </Field>

        <Field
          label="Valor"
          hint={variable ? 'Você informa o valor na hora de pagar.' : undefined}>
          {!variable && <MoneyInput value={amount} onChange={setAmount} />}
          <View className="flex-row">
            <Chip label="Valor muda todo mês" selected={variable} onPress={() => setVariable((v) => !v)} />
          </View>
        </Field>

        <Field label="Vence no dia" hint="Se o mês não tiver esse dia, vence no último dia.">
          <DayPicker value={dueDay} onChange={setDueDay} label="Dia de vencimento" />
        </Field>

        <Field
          label={recurrence === 'monthly' ? 'A partir de' : 'No mês de'}
          hint={recurrence === 'monthly' ? 'Primeiro mês em que a conta aparece.' : 'Mês em que a conta vence, uma única vez.'}>
          <View className="flex-row">
            <MonthSwitcher month={startMonth} onChange={setStartMonth} />
          </View>
        </Field>

        {scope === 'times' && (
          <Field
            label="Quantas vezes"
            hint={endMonth ? `Termina em ${formatMonth(endMonth).toLowerCase()}.` : undefined}>
            <NumberStepper
              value={repeatCount}
              onChange={setRepeatCount}
              min={2}
              max={120}
              format={(n) => `${n} vezes`}
              label="quantidade de vezes"
            />
          </Field>
        )}

        <Field label="Descrição" hint="Opcional. Aparece nos detalhes da conta.">
          <Input
            value={notes}
            onChangeText={setNotes}
            placeholder="Ex.: Plano anual, desconto até o dia 5"
            multiline
            maxLength={500}
            textAlignVertical="top"
            className="h-auto min-h-[96px] py-3"
          />
        </Field>

        <Field
          label="Prioridade"
          hint="Essencial = não pode atrasar (aluguel, luz). Importante = pague em dia se sobrar. Pode esperar = fica por último.">
          <Segmented options={PRIORITIES} value={priority} onChange={setPriority} />
        </Field>

        <Field label="Categoria">
          <View className="-mx-4">
            <CategoryPicker categories={categories.data ?? []} value={categoryId} onChange={setCategoryId} />
          </View>
        </Field>

        <Field label="Costuma pagar com" hint="Opcional. Vem selecionada quando for pagar.">
          <View className="-mx-4">
            <AccountPicker accounts={accounts.data ?? []} value={accountId} onChange={setAccountId} />
          </View>
        </Field>

        {bill && (
          <Button variant="ghost" onPress={confirmDelete}>
            <Text className="text-destructive">Remover conta</Text>
          </Button>
        )}
      </ScrollView>

      <View className="gap-2 border-t-hairline border-border px-5 pt-3" style={{ paddingBottom: insets.bottom + 10 }}>
        <ErrorNote message={save.error ? errorMessage(save.error) : null} />
        <Button size="lg" disabled={!valid} loading={save.isPending} onPress={submit}>
          <Text>{bill ? 'Salvar alterações' : 'Adicionar conta'}</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
