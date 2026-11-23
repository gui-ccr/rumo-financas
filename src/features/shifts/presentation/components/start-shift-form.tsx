import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { View } from 'react-native';

import { useAccounts, useCategories } from '@/features/accounts/presentation/hooks';
import { CategoryPicker } from '@/features/transactions/presentation/components/category-picker';
import { AccountPicker } from '@/features/transactions/presentation/components/pickers';
import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { ErrorNote, Skeleton } from '@/shared/ui/feedback';
import { Field } from '@/shared/ui/form';
import { Text } from '@/shared/ui/text';

import { useShiftDefaults, useStartShift } from '../hooks';

/** Pick the racing app (income category of the Moto group) and the account, then start the shift. */
export function StartShiftForm({ onStarted }: { onStarted: () => void }) {
  const categories = useCategories();
  const accounts = useAccounts();
  const defaults = useShiftDefaults();
  const start = useStartShift();

  // Null means "the user has not picked": the pre-selected default from useShiftDefaults applies.
  const [pickedCategory, setPickedCategory] = useState<number | null>(null);
  const [pickedAccount, setPickedAccount] = useState<number | null>(null);

  if (!categories.data || !accounts.data || !defaults.data) return <Skeleton className="h-56" />;

  const racingApps = categories.data.filter((c) => c.kind === 'income' && c.group === 'moto' && !c.archived);
  // A shift cannot land on a credit card (see StartShift use case).
  const receivingAccounts = accounts.data.filter((a) => !a.archived && a.type !== 'credit_card');
  const categoryId = pickedCategory ?? defaults.data.categoryId;
  const accountId = pickedAccount ?? defaults.data.accountId;

  const submit = () => {
    if (categoryId === null || accountId === null) return;
    start.mutate(
      { categoryId, accountId },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          onStarted();
        },
      },
    );
  };

  return (
    <View className="gap-5">
      <Text variant="muted">
        Escolha o app de corrida e a conta que vai receber. Depois disso, os Pix que caírem no Nubank entram sozinhos.
      </Text>

      <Field label="App de corrida" hint="Os Pix entram como ganho deste app.">
        <View className="-mx-4">
          <CategoryPicker categories={racingApps} value={categoryId} onChange={setPickedCategory} />
        </View>
      </Field>

      <Field label="Conta que recebe" hint="Conta onde os Pix vão cair.">
        <View className="-mx-4">
          <AccountPicker accounts={receivingAccounts} value={accountId} onChange={setPickedAccount} />
        </View>
      </Field>

      <ErrorNote message={start.error ? errorMessage(start.error) : null} />

      <Button size="lg" disabled={categoryId === null || accountId === null} loading={start.isPending} onPress={submit}>
        <Text>Iniciar turno</Text>
      </Button>
    </View>
  );
}
