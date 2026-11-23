import * as Haptics from 'expo-haptics';
import { Delete } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

import { appendDigit, removeDigit } from '@/shared/domain/money';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'back'] as const;

/** Cash-register keypad: digits shift in from the right, so "4590" is R$ 45,90. */
export function AmountKeypad({ value, onChange }: { value: number; onChange: (cents: number) => void }) {
  const colors = useThemeColors();

  const press = (key: (typeof KEYS)[number]) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (key === 'back') onChange(removeDigit(value));
    else if (key === '00') onChange(appendDigit(appendDigit(value, '0'), '0'));
    else onChange(appendDigit(value, key));
  };

  return (
    <View className="flex-row flex-wrap">
      {KEYS.map((key) => (
        <View key={key} className="w-1/3 p-1">
          <Pressable
            onPress={() => press(key)}
            onLongPress={key === 'back' ? () => onChange(0) : undefined}
            accessibilityRole="button"
            accessibilityLabel={key === 'back' ? 'Apagar (segure para limpar)' : key}
            className="h-16 items-center justify-center rounded-full active:bg-muted">
            {key === 'back' ? (
              <Delete size={24} color={colors.foreground} strokeWidth={1.8} />
            ) : (
              <Text className="font-mono-medium text-3xl" style={{ fontVariant: ['tabular-nums'] }}>
                {key}
              </Text>
            )}
          </Pressable>
        </View>
      ))}
    </View>
  );
}
