import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { ErrorNote } from '@/shared/ui/feedback';
import { Field, NumberStepper } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { ModalHeader } from '@/shared/ui/modal-header';
import { MoneyInput } from '@/shared/ui/money-input';
import { Segmented } from '@/shared/ui/segmented';
import { SWATCHES, SwatchPicker } from '@/shared/ui/swatches';
import { Text } from '@/shared/ui/text';

import type { Account, AccountType } from '../../domain/account';
import { useAccounts, useArchiveAccount, useSaveAccount } from '../hooks';

export function AccountFormScreen({ id }: { id?: number }) {
  const accounts = useAccounts();
  if (id !== undefined && !accounts.data) return <View className="flex-1 bg-background" />;
  return <AccountForm account={accounts.data?.find((a) => a.id === id) ?? null} />;
}

function AccountForm({ account }: { account: Account | null }) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'checking');
  const [initial, setInitial] = useState<number | null>(account?.initialBalanceCents ?? null);
  const [closingDay, setClosingDay] = useState(account?.closingDay ?? 3);
  const [dueDay, setDueDay] = useState(account?.dueDay ?? 10);
  const [color, setColor] = useState(account?.color ?? SWATCHES[2]);
  const save = useSaveAccount();
  const archive = useArchiveAccount();

  const submit = () =>
    save.mutate(
      {
        id: account?.id,
        input: { name, type, initialBalanceCents: initial ?? 0, closingDay, dueDay, color },
      },
      { onSuccess: () => router.back() },
    );

  const confirmArchive = () =>
    Alert.alert('Arquivar', `${account?.name} some das listas, mas os lançamentos antigos continuam no histórico.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Arquivar',
        style: 'destructive',
        onPress: () => account && archive.mutate(account.id, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-background">
      <ModalHeader title={account ? 'Editar conta' : 'Nova conta'} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-7 px-5 pb-8 pt-2">
        <Segmented
          options={[
            { value: 'checking', label: 'Banco' },
            { value: 'credit_card', label: 'Cartão' },
            { value: 'cash', label: 'Dinheiro' },
          ]}
          value={type}
          onChange={setType}
        />
        <Field label="Nome" hint="Como a conta aparece nas listas. Ex.: Nubank, Carteira.">
          <Input value={name} onChangeText={setName} placeholder="Ex.: Nubank, Santander" maxLength={40} />
        </Field>

        {type === 'credit_card' ? (
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Field label="Fecha no dia" hint="Compras a partir deste dia entram na fatura do mês seguinte.">
                <NumberStepper value={closingDay} onChange={setClosingDay} min={1} max={31} label="dia de fechamento" />
              </Field>
            </View>
            <View className="flex-1">
              <Field label="Vence no dia" hint="Dia em que você paga a fatura.">

                <NumberStepper value={dueDay} onChange={setDueDay} min={1} max={31} label="dia de vencimento" />
              </Field>
            </View>
          </View>
        ) : (
          <Field label="Saldo inicial" hint="Quanto havia na conta quando você começou a usar o app.">
            <MoneyInput value={initial} onChange={setInitial} />
          </Field>
        )}

        <Field label="Cor">
          <SwatchPicker value={color} onChange={setColor} />
        </Field>

        {account && (
          <Button variant="ghost" onPress={confirmArchive}>
            <Text className="text-destructive">Arquivar</Text>
          </Button>
        )}
      </ScrollView>
      <View className="gap-2 border-t-hairline border-border px-5 pt-3" style={{ paddingBottom: insets.bottom + 10 }}>
        <ErrorNote message={save.error ? errorMessage(save.error) : null} />
        <Button size="lg" disabled={!name.trim()} loading={save.isPending} onPress={submit}>
          <Text>{account ? 'Salvar alterações' : 'Adicionar'}</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
