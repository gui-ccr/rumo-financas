import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { CategoryGroup } from '@/features/accounts/domain/category';
import { useAccounts, useCategoriesByUsage } from '@/features/accounts/presentation/hooks';
import { today } from '@/shared/domain/dates';
import { useLastAccountId } from '@/shared/presentation/preferences';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { ErrorNote } from '@/shared/ui/feedback';
import { Input } from '@/shared/ui/input';
import { ModalHeader } from '@/shared/ui/modal-header';
import { Money } from '@/shared/ui/money';
import { Segmented } from '@/shared/ui/segmented';
import { Text } from '@/shared/ui/text';

import type { TransactionType } from '../../domain/transaction';
import { AmountKeypad } from '../components/amount-keypad';
import { CategoryPicker } from '../components/category-picker';
import { AccountPicker, DateStepper, InstallmentStepper } from '../components/pickers';
import { useCreateTransaction } from '../hooks';

const TYPES = [
  { value: 'expense', label: 'Gasto' },
  { value: 'income', label: 'Entrada' },
  { value: 'transfer', label: 'Transferir' },
] satisfies { value: TransactionType; label: string }[];

const SAVE_LABEL: Record<TransactionType, string> = {
  expense: 'Salvar gasto',
  income: 'Salvar entrada',
  transfer: 'Salvar transferência',
};

export function NewTransactionScreen({
  initialType = 'expense',
  focusGroup,
}: {
  initialType?: TransactionType;
  /** Show this group's categories first (the moto panel opens with moto categories). */
  focusGroup?: CategoryGroup;
}) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>(initialType);
  const [amount, setAmount] = useState(0);
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [lastAccountId, setLastAccountId] = useLastAccountId();
  const [pickedAccountId, setAccountId] = useState<number | null>(lastAccountId ?? null);
  const [toAccountId, setToAccountId] = useState<number | null>(null);
  const [date, setDate] = useState(today());
  const [description, setDescription] = useState('');
  const [installments, setInstallments] = useState(1);

  const accounts = useAccounts();
  const categories = useCategoriesByUsage(type === 'income' ? 'income' : 'expense');
  const orderedCategories = useMemo(() => {
    const list = categories.data ?? [];
    if (!focusGroup) return list;
    return [...list.filter((c) => c.group === focusGroup), ...list.filter((c) => c.group !== focusGroup)];
  }, [categories.data, focusGroup]);
  const create = useCreateTransaction();

  // Until the user picks one, use the last used account, or the first one.
  const accountId = pickedAccountId ?? accounts.data?.[0]?.id ?? null;
  const account = accounts.data?.find((a) => a.id === accountId);
  const isCard = type === 'expense' && account?.type === 'credit_card';

  const sourceAccounts = useMemo(
    // Income cannot land on a credit card; transfers leave from real money.
    () => accounts.data?.filter((a) => type === 'expense' || a.type !== 'credit_card') ?? [],
    [accounts.data, type],
  );

  // Pop the amount on each keypress — the one motion on this screen, confirming input.
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const amountStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const onAmount = (cents: number) => {
    setAmount(cents);
    if (reduceMotion) return;
    scale.set(withSequence(withTiming(1.03, { duration: 60 }), withSpring(1, { damping: 18 })));
  };

  const changeType = (t: TransactionType) => {
    setType(t);
    setCategoryId(null);
    setInstallments(1);
    if (t !== 'expense' && account?.type === 'credit_card') {
      setAccountId(accounts.data?.find((a) => a.type !== 'credit_card')?.id ?? null);
    }
  };

  const save = () => {
    if (accountId === null) return;
    create.mutate(
      {
        type,
        amountCents: amount,
        date,
        description,
        categoryId: type === 'transfer' ? null : categoryId,
        accountId,
        toAccountId: type === 'transfer' ? toAccountId : null,
        installments: isCard ? installments : 1,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setLastAccountId(accountId);
          router.back();
        },
      },
    );
  };

  const ready = amount > 0 && accountId !== null && (type === 'transfer' ? toAccountId !== null : categoryId !== null);

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-background">
      <ModalHeader>
        <Segmented options={TYPES} value={type} onChange={changeType} />
      </ModalHeader>

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 pb-4">
        <Animated.View style={amountStyle} className="items-center py-4">
          <Money cents={amount} size="xl" className="text-5xl" tone={amount === 0 ? 'muted' : type === 'income' ? 'income' : 'default'} />
        </Animated.View>

        <View className="gap-2">
          <Text variant="label" className="px-4 text-muted-foreground">
            {type === 'income' ? 'Entrou em' : type === 'transfer' ? 'Sai de' : 'Pago com'}
          </Text>
          <AccountPicker accounts={sourceAccounts} value={accountId} onChange={setAccountId} />
        </View>

        {type === 'transfer' ? (
          <View className="gap-2">
            <Text variant="label" className="px-4 text-muted-foreground">
              Vai para
            </Text>
            <AccountPicker
              accounts={(accounts.data ?? []).filter((a) => a.id !== accountId)}
              value={toAccountId}
              onChange={setToAccountId}
            />
          </View>
        ) : (
          <CategoryPicker categories={orderedCategories} value={categoryId} onChange={setCategoryId} />
        )}

        <View className="flex-row flex-wrap items-center gap-2 px-4">
          <DateStepper value={date} onChange={setDate} />
          {isCard && <InstallmentStepper value={installments} onChange={setInstallments} totalCents={amount} />}
        </View>
        {isCard && (
          <Text variant="caption" className="px-4">
            Parcelas dividem a compra no cartão. Cada parcela cai numa fatura diferente.
          </Text>
        )}

        <View className="px-4">
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Descrição (opcional)"
            returnKeyType="done"
            maxLength={120}
          />
        </View>
      </ScrollView>

      <View className="gap-2 border-t-hairline border-border bg-background px-3 pt-1" style={{ paddingBottom: insets.bottom + 8 }}>
        <AmountKeypad value={amount} onChange={onAmount} />
        <View className="px-1">
          <ErrorNote message={create.error ? errorMessage(create.error) : null} />
        </View>
        <Button size="lg" className="mx-1" disabled={!ready} loading={create.isPending} onPress={save}>
          <Text>{SAVE_LABEL[type]}</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
