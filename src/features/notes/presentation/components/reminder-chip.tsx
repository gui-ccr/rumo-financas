import { Bell } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { reminderLabel } from '../../domain/note';

/** A reminder's date and time, in Geist Mono, on a tonal pill. */
export function ReminderChip({ remindAt }: { remindAt: string }) {
  const colors = useThemeColors();
  return (
    <View className="h-6 flex-row items-center gap-1.5 self-start rounded-full bg-secondary px-2.5">
      <Bell size={12} color={colors.accent} strokeWidth={2} />
      <Text className="font-mono-medium text-xs text-secondary-foreground">{reminderLabel(remindAt)}</Text>
    </View>
  );
}
