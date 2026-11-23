import { useLocalSearchParams } from 'expo-router';

import { NewTransactionScreen } from '@/features/transactions/presentation/screens/new-transaction-screen';

/** Optional params: ?type=income|expense|transfer&group=moto */
export default function NewTransactionRoute() {
  const { type, group } = useLocalSearchParams<{ type?: string; group?: string }>();
  return (
    <NewTransactionScreen
      initialType={type === 'income' || type === 'transfer' ? type : 'expense'}
      focusGroup={group === 'moto' || group === 'dev' || group === 'casa' || group === 'pessoal' ? group : undefined}
    />
  );
}
