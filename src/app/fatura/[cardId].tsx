import { useLocalSearchParams } from 'expo-router';

import { InvoiceScreen } from '@/features/cards/presentation/screens/invoice-screen';

export default function InvoiceRoute() {
  const { cardId, month } = useLocalSearchParams<{ cardId: string; month?: string }>();
  return <InvoiceScreen cardId={Number(cardId)} initialMonth={month} />;
}
