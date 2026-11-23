import { router } from 'expo-router';
import { X } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from './text';
import { useThemeColors } from './theme';

/** Header for screens presented as modals: close, title (or custom content), optional action. */
export function ModalHeader({ title, right, children }: { title?: string; right?: ReactNode; children?: ReactNode }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  return (
    <View
      className="flex-row items-center gap-2 px-3 pb-3"
      style={{ paddingTop: insets.top + 6 }}>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Fechar"
        className="h-10 w-10 items-center justify-center rounded-full bg-muted active:opacity-70">
        <X size={20} color={colors.foreground} />
      </Pressable>
      <View className="flex-1 items-center">{children ?? (title ? <Text variant="heading">{title}</Text> : null)}</View>
      {right ?? <View className="w-10" />}
    </View>
  );
}
