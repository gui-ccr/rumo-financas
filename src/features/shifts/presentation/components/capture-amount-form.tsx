import { useState } from 'react';
import { View } from 'react-native';

import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { ErrorNote } from '@/shared/ui/feedback';
import { Field } from '@/shared/ui/form';
import { MoneyInput } from '@/shared/ui/money-input';
import { Text } from '@/shared/ui/text';

import type { NotificationCapture } from '../../domain/notification-capture';
import { useUpdateShiftCapture } from '../hooks';

/** Edits the amount of one Pix of a shift. Closes itself once saved. */
export function CaptureAmountForm({ capture, onDone }: { capture: NotificationCapture; onDone: () => void }) {
  const [amount, setAmount] = useState<number | null>(capture.amountCents);
  const update = useUpdateShiftCapture();

  const submit = () => {
    if (amount === null) return;
    update.mutate({ captureId: capture.id, changes: { amountCents: amount } }, { onSuccess: onDone });
  };

  return (
    <View className="gap-5">
      <Text variant="muted">
        Use quando a notificação veio com um valor diferente do que caiu. O total do turno muda na hora.
      </Text>
      <Field label="Valor do Pix" hint="Quanto caiu nesta transferência.">
        <MoneyInput value={amount} onChange={setAmount} autoFocus />
      </Field>
      <ErrorNote message={update.error ? errorMessage(update.error) : null} />
      <Button size="lg" disabled={amount === null} loading={update.isPending} onPress={submit}>
        <Text>Salvar valor</Text>
      </Button>
    </View>
  );
}
