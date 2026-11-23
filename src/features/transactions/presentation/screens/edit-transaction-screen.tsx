import { router } from 'expo-router';
import { Trash } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useAccounts, useCategoriesByUsage } from '@/features/accounts/presentation/hooks';
import { formatBRL } from '@/shared/domain/money';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { ErrorNote, Skeleton } from '@/shared/ui/feedback';
import { Input } from '@/shared/ui/input';
import { ModalHeader } from '@/shared/ui/modal-header';
import { Money } from '@/shared/ui/money';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { TRANSACTION_TYPE_LABEL, type TransactionView } from '../../domain/transaction';
import { AmountKeypad } from '../components/amount-keypad';
import { CategoryPicker } from '../components/category-picker';
import { AccountPicker, DateStepper } from '../components/pickers';
import { useDeleteTransaction, useEditTransaction, useTransaction } from '../hooks';

export function EditTransactionScreen({ id }: { id: number }) {
  const { data: tx, isLoading } = useTransaction(id);
  if (isLoading) {
    return (
      <View className="flex-1 gap-4 bg-background p-4">
        <ModalHeader title="Lançamento" />
        <Skeleton className="h-16" />
        <Skeleton className="h-40" />
      </View>
    );
  }
  if (!tx) {
    return (
      <View className="flex-1 bg-background">
        <ModalHeader title="Lançamento" />
        <Text variant="muted" className="px-5">
          Esse lançamento foi excluído.
        </Text>
      </View>
    );
  }
  return <EditForm tx={tx} />;
}

function EditForm({ tx }: { tx: TransactionView }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [amount, setAmount] = useState(tx.amountCents);
  const [categoryId, setCategoryId] = useState(tx.categoryId);
  const [accountId, setAccountId] = useState(tx.accountId);
  const [date, setDate] = useState(tx.date);
  const [description, setDescription] = useState(tx.description);

  const accounts = useAccounts();
  const categories = useCategoriesByUsage(tx.type === 'income' ? 'income' : 'expense');
  const edit = useEditTransaction();
  const remove = useDeleteTransaction();

  useEffect(() => {
    if (remove.isSuccess) router.back();
  }, [remove.isSuccess]);

  const confirmDelete = () => {
    const label = `${tx.description || tx.category?.name || 'Lançamento'} de ${formatBRL(tx.amountCents)}`;
    if (tx.installment) {
      Alert.alert('Excluir parcela', `${label} é a parcela ${tx.installment.number} de ${tx.installment.total}.`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Só esta', onPress: () => remove.mutate({ id: tx.id }) },
        { text: 'Todas as parcelas', style: 'destructive', onPress: () => remove.mutate({ id: tx.id, wholePurchase: true }) },
      ]);
      return;
    }
    Alert.alert('Excluir lançamento', `${label} vai sair do histórico e dos saldos.`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => remove.mutate({ id: tx.id }) },
    ]);
  };

  const save = () =>
    edit.mutate(
      { id: tx.id, input: { amountCents: amount, date, description, categoryId, accountId } },
      { onSuccess: () => router.back() },
    );

  const sourceAccounts = (accounts.data ?? []).filter((a) => tx.type === 'expense' || a.type !== 'credit_card');
  const error = edit.error ?? remove.error;

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-background">
      <ModalHeader
        title={TRANSACTION_TYPE_LABEL[tx.type]}
        right={
          <Pressable
            onPress={confirmDelete}
            accessibilityRole="button"
            accessibilityLabel="Excluir lançamento"
            className="h-10 w-10 items-center justify-center rounded-full active:bg-muted">
            <Trash size={19} color={colors.expense} strokeWidth={1.9} />
          </Pressable>
        }
      />

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 pb-4">
        <View className="items-center gap-1 py-3">
          <Money cents={amount} size="xl" className="text-5xl" tone={tx.type === 'income' ? 'income' : 'default'} />
          {tx.installment && (
            <Text variant="caption">
              Parcela {tx.installment.number} de {tx.installment.total}
            </Text>
          )}
        </View>

        {tx.type !== 'transfer' && (
          <>
            <AccountPicker accounts={sourceAccounts} value={accountId} onChange={setAccountId} />
            <CategoryPicker categories={categories.data ?? []} value={categoryId} onChange={setCategoryId} />
          </>
        )}

        <View className="flex-row px-4">
          <DateStepper value={date} onChange={setDate} />
        </View>
        <View className="px-4">
          <Input value={description} onChangeText={setDescription} placeholder="Descrição (opcional)" maxLength={120} />
        </View>
      </ScrollView>

      <View className="gap-2 border-t-hairline border-border px-3 pt-1" style={{ paddingBottom: insets.bottom + 8 }}>
        <AmountKeypad value={amount} onChange={setAmount} />
        <ErrorNote message={error ? errorMessage(error) : null} />
        <Button size="lg" className="mx-1" disabled={amount <= 0} loading={edit.isPending} onPress={save}>
          <Text>Salvar alterações</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
