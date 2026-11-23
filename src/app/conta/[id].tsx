import { useLocalSearchParams } from 'expo-router';

import { BillFormScreen } from '@/features/bills/presentation/screens/bill-form-screen';

/** /conta/nova creates; /conta/<id> edits. */
export default function BillFormRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <BillFormScreen id={id === 'nova' ? undefined : Number(id)} />;
}
