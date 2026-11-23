import { router } from 'expo-router';
import { Alert, Pressable, View } from 'react-native';

import { formatMonth, formatShortDate } from '@/shared/domain/dates';
import { Button } from '@/shared/ui/button';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { ListRow, ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { Screen } from '@/shared/ui/screen';
import { Pill, Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';

import { BILL_PRIORITY_LABEL, type BillPriority } from '../../domain/bill';
import { useBillDetail, useDeleteBill } from '../hooks';

/** One line on what each priority means, so the word is not a guess. */
const PRIORITY_HELP: Record<BillPriority, string> = {
  essential: 'Não pode atrasar: aluguel, luz, água.',
  important: 'Importante, mas dá para adiar um pouco.',
  flexible: 'Pode esperar se o dinheiro faltar.',
};

const PRIORITY_TONE: Record<BillPriority, 'accent' | 'warning' | 'neutral'> = {
  essential: 'accent',
  important: 'warning',
  flexible: 'neutral',
};

/** Details of one bill: what it is, what is due next, what was paid, and the three actions. */
export function BillDetailScreen({ id }: { id: number }) {
  const detail = useBillDetail(id);
  const archive = useDeleteBill();

  if (detail.isPending) {
    return (
      <Screen back title="Conta">
        <Skeleton className="h-48" />
      </Screen>
    );
  }

  const data = detail.data;
  if (!data) {
    return (
      <Screen back title="Conta">
        <EmptyState title="Esta conta não existe mais" description="Ela pode ter sido arquivada." />
      </Screen>
    );
  }

  const { bill, open, paid, accountName, categoryName } = data;
  const next = open[0];

  const confirmArchive = () =>
    Alert.alert(
      'Arquivar conta',
      `${bill.name} para de aparecer nas contas a pagar. O histórico de pagamentos fica guardado.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Arquivar',
          style: 'destructive',
          onPress: () => archive.mutate(bill.id, { onSuccess: () => router.back() }),
        },
      ],
    );

  const recurrence =
    bill.recurrence === 'monthly' ? `Todo dia ${bill.dueDay}` : `Dia ${bill.dueDay} de ${formatMonth(bill.startMonth).toLowerCase()}`;

  return (
    <Screen back title={bill.name}>
      <Surface tone="plain" className="gap-4 p-5">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="caption">Valor</Text>
            {bill.amountCents !== null ? (
              <Money cents={bill.amountCents} size="lg" />
            ) : (
              <Text variant="muted">Valor variável: você digita ao pagar</Text>
            )}
          </View>
          <Pill label={BILL_PRIORITY_LABEL[bill.priority]} tone={PRIORITY_TONE[bill.priority]} />
        </View>
        <Text variant="muted" className="text-xs">
          {PRIORITY_HELP[bill.priority]}
        </Text>
        <View className="h-px bg-border" />
        <Row label="Vencimento" value={recurrence} />
        <Row label="Recorrência" value={bill.recurrence === 'monthly' ? 'Mensal' : 'Uma vez'} />
        <Row label="Conta de pagamento" value={accountName ?? 'Não definida'} />
        <Row label="Categoria" value={categoryName ?? 'Sem categoria'} />
      </Surface>

      <View className="flex-row gap-2">
        {next ? (
          <Button className="flex-1" onPress={() => router.push({ pathname: '/conta/pagar/[id]', params: { id: String(next.id) } })}>
            <Text>Pagar</Text>
          </Button>
        ) : null}
        <Button
          variant="outline"
          className="flex-1"
          onPress={() => router.push({ pathname: '/conta/[id]', params: { id: String(bill.id) } })}>
          <Text>Editar</Text>
        </Button>
      </View>

      {open.length > 0 ? (
        <ListSection title="Próximos vencimentos">
          {open.map((o) => (
            <ListRow
              key={o.id}
              title={`Vence em ${formatShortDate(o.dueDate)}`}
              subtitle={o.amountCents !== null ? undefined : 'Valor variável'}
              trailing={
                <View className="flex-row items-center gap-3">
                  {o.amountCents !== null && <Money cents={o.amountCents} />}
                  <Pressable
                    onPress={() => router.push({ pathname: '/conta/pagar/[id]', params: { id: String(o.id) } })}
                    accessibilityRole="button"
                    accessibilityLabel={`Pagar vencimento de ${formatShortDate(o.dueDate)}`}
                    className="h-8 items-center justify-center rounded-full bg-secondary px-3 active:opacity-70">
                    <Text className="font-sans-semibold text-xs text-secondary-foreground">Pagar</Text>
                  </Pressable>
                </View>
              }
            />
          ))}
        </ListSection>
      ) : (
        <EmptyState title="Nada aberto" description="Os próximos vencimentos aparecem aqui quando forem gerados." />
      )}

      <ListSection title="Pagamentos">
        {paid.length > 0 ? (
          paid.map((o) => (
            <ListRow
              key={o.id}
              title={`Vencia em ${formatShortDate(o.dueDate)}`}
              subtitle="Paga"
              trailing={
                o.amountCents !== null ? <Money cents={o.amountCents} tone="income" /> : <Text variant="caption">—</Text>
              }
            />
          ))
        ) : (
          <View className="px-1 py-2">
            <Text variant="muted">Nenhum pagamento ainda. Cada pagamento aparece aqui, com o valor pago.</Text>
          </View>
        )}
      </ListSection>

      <Button variant="ghost" onPress={confirmArchive} accessibilityLabel="Arquivar conta">
        <Text className="text-expense">Arquivar conta</Text>
      </Button>
    </Screen>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text variant="muted">{label}</Text>
      <Text className="flex-1 text-right font-sans-medium text-sm">{value}</Text>
    </View>
  );
}
