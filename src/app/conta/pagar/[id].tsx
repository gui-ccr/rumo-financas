import { useLocalSearchParams } from 'expo-router';

import { PayBillSheet } from '@/features/bills/presentation/screens/pay-bill-sheet';

export default function PayBillRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <PayBillSheet id={Number(id)} />;
}
