import { router } from 'expo-router';
import { CircleCheck, CreditCard, Receipt } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { INVOICE_STATUS_LABEL, remaining, type Invoice } from '@/features/cards/domain/invoice';
import { invoiceTone } from '@/features/cards/presentation/invoice-tone';
import { formatDue, formatMonth, formatShortDate, today } from '@/shared/domain/dates';
import { CategoryBadge, IconTile } from '@/shared/ui/category-badge';
import { ListRow } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { Pill } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { urgencyOf, type BillOccurrenceView, type Urgency } from '../../domain/bill';

const URGENCY_TONE: Record<Urgency, 'expense' | 'warning' | 'neutral' | 'income'> = {
  overdue: 'expense',
  today: 'warning',
  soon: 'warning',
  later: 'neutral',
  paid: 'income',
};

function OccurrenceRowView({ occurrence: o }: { occurrence: BillOccurrenceView }) {
  const colors = useThemeColors();
  const urgency = urgencyOf(o, today());
  const paid = o.status === 'paid';
  return (
    <ListRow
      // Tapping the line opens the bill; the Pagar button pays this due date.
      onPress={() => router.push({ pathname: '/conta/detalhe/[id]', params: { id: String(o.billId) } })}
      accessibilityLabel={`${o.billName}, ${paid ? 'paga' : formatDue(o.dueDate)}`}
      leading={
        paid ? (
          <IconTile>
            <CircleCheck size={18} color={colors.income} strokeWidth={1.9} />
          </IconTile>
        ) : o.category ? (
          <CategoryBadge icon={o.category.icon} color={o.category.color} />
        ) : (
          <IconTile>
            <Receipt size={17} color={colors.mutedForeground} strokeWidth={1.9} />
          </IconTile>
        )
      }
      title={o.billName}
      subtitle={
        <Pill
          label={paid ? `Paga, vencia em ${formatShortDate(o.dueDate)}` : formatDue(o.dueDate)}
          tone={URGENCY_TONE[urgency]}
        />
      }
      trailing={
        <View className="flex-row items-center gap-3">
          {o.amountCents ? (
            <Money cents={o.amountCents} tone={paid ? 'muted' : 'default'} />
          ) : (
            <Text variant="caption">Valor variável</Text>
          )}
          {!paid && (
            <Pressable
              onPress={() => router.push({ pathname: '/conta/pagar/[id]', params: { id: String(o.id) } })}
              accessibilityRole="button"
              accessibilityLabel={`Pagar ${o.billName}`}
              className="h-8 items-center justify-center rounded-full bg-secondary px-3 active:opacity-70">
              <Text className="font-sans-semibold text-xs text-secondary-foreground">Pagar</Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}

function InvoiceRowView({ invoice: inv }: { invoice: Invoice }) {
  const ref = today();
  return (
    <ListRow
      onPress={() =>
        router.push({ pathname: '/fatura/[cardId]', params: { cardId: String(inv.cardId), month: inv.month } })
      }
      accessibilityLabel={`Fatura ${inv.cardName} de ${formatMonth(inv.month)}`}
      leading={
        <IconTile>
          <CreditCard size={17} color={inv.cardColor} strokeWidth={1.9} />
        </IconTile>
      }
      title={`Fatura ${inv.cardName}`}
      subtitle={
        <Pill
          label={`${INVOICE_STATUS_LABEL[inv.status]}, ${formatDue(inv.dueDate).toLowerCase()}`}
          tone={invoiceTone(inv, ref)}
        />
      }
      trailing={<Money cents={remaining(inv)} />}
    />
  );
}

/** Memoized rows: see TransactionRow. */
export const OccurrenceRow = memo(OccurrenceRowView);
export const InvoiceRow = memo(InvoiceRowView);
