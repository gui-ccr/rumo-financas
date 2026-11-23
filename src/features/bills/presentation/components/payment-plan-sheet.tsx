import { useMemo, type RefObject } from 'react';
import { View } from 'react-native';

import { formatShortDate } from '@/shared/domain/dates';
import { formatBRL } from '@/shared/domain/money';
import { ListRow, ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { Sheet, type SheetRef } from '@/shared/ui/sheet';
import { Pill } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';

import type { PaymentPlan, PlanOccurrence } from '../../domain/payment-plan';

type PlanView = PaymentPlan<PlanOccurrence & { billName: string }>;

/**
 * The plan in payment order, each bill marked "Cabe" (the balance covers it) or "Não cabe".
 * The explanation sits at the top so the two words are never a guess.
 */
export function PaymentPlanSheet({ sheetRef, plan }: { sheetRef: RefObject<SheetRef | null>; plan: PlanView }) {
  const sections = useMemo(() => {
    const withAmount = plan.items.filter((i) => i.occurrence.amountCents !== null);
    const variable = plan.items.filter((i) => i.occurrence.amountCents === null);
    return { withAmount, variable };
  }, [plan]);

  return (
    <Sheet ref={sheetRef} title="Ordem de pagamento">
      <View className="gap-5 px-5 pb-8 pt-2">
        <Text variant="muted">
          Pagamos primeiro as contas mais importantes e as atrasadas. <Text className="font-sans-medium text-foreground">Cabe</Text>{' '}
          quer dizer que o seu saldo cobre a conta. <Text className="font-sans-medium text-foreground">Não cabe</Text> quer
          dizer que falta dinheiro para ela e para as seguintes.
        </Text>

        <ListSection variant="plain">
          {sections.withAmount.map((item) => (
            <ListRow
              key={item.occurrence.id}
              leading={
                <Text className="w-6 font-mono-medium text-sm text-muted-foreground">{item.order}</Text>
              }
              title={item.occurrence.billName}
              subtitle={
                <Text variant="caption">
                  {item.occurrence.overdue ? 'Atrasada' : `Vence em ${formatShortDate(item.occurrence.dueDate)}`}
                </Text>
              }
              trailing={
                <View className="items-end gap-1">
                  <Pill label={item.coveredByBalance ? 'Cabe' : 'Não cabe'} tone={item.coveredByBalance ? 'income' : 'expense'} />
                  <Money cents={item.occurrence.amountCents ?? 0} size="sm" />
                </View>
              }
            />
          ))}
          {sections.variable.map((item) => (
            <ListRow
              key={item.occurrence.id}
              leading={<Text className="w-6 font-mono-medium text-sm text-muted-foreground">{item.order}</Text>}
              title={item.occurrence.billName}
              subtitle={<Text variant="caption">Valor variável: não entra na conta até você digitar o valor</Text>}
              trailing={<Pill label="Sem valor" tone="neutral" />}
            />
          ))}
        </ListSection>

        {plan.shortfallCents > 0 ? (
          <Text variant="muted">
            Faltam <Text className="font-mono-medium text-foreground">{formatBRL(plan.shortfallCents)}</Text> para pagar todas.
          </Text>
        ) : (
          <Text variant="muted">O saldo cobre todas as contas deste mês.</Text>
        )}
      </View>
    </Sheet>
  );
}
