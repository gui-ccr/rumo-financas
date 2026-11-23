import { useLocalSearchParams } from 'expo-router';

import { ShiftReviewScreen } from '@/features/shifts/presentation/screens/shift-review-screen';

/** /turno/<id>: live review and confirmation of one shift. */
export default function ShiftRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ShiftReviewScreen shiftId={Number(id)} />;
}
