import { useLocalSearchParams } from 'expo-router';

import { CategoryFormScreen } from '@/features/accounts/presentation/screens/category-form-screen';

export default function CategoryFormRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CategoryFormScreen id={id === 'nova' ? undefined : Number(id)} />;
}
