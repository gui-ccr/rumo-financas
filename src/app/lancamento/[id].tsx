import { useLocalSearchParams } from 'expo-router';

import { EditTransactionScreen } from '@/features/transactions/presentation/screens/edit-transaction-screen';

export default function EditTransactionRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <EditTransactionScreen id={Number(id)} />;
}
