import { useLocalSearchParams } from 'expo-router';

import { PayInvoiceSheet } from '@/features/cards/presentation/screens/pay-invoice-sheet';

export default function PayInvoiceRoute() {
  const { cardId, month } = useLocalSearchParams<{ cardId: string; month: string }>();
  return <PayInvoiceSheet cardId={Number(cardId)} month={month} />;
}
