import { useLocalSearchParams } from 'expo-router';

import { BillDetailScreen } from '@/features/bills/presentation/screens/bill-detail-screen';

/** /conta/detalhe/<id>: one bill (the id is the bill's, not one of its due dates). */
export default function BillDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BillDetailScreen id={Number(id)} />;
}
