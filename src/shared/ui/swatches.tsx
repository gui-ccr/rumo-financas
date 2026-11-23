import * as Haptics from 'expo-haptics';
import { Check } from 'lucide-react-native';
import { Pressable, View } from 'react-native';

/**
 * Category and account colors: a muted set built around the brand's indigo,
 * distinguishable from each other without turning the UI into a rainbow.
 */
export const SWATCHES = [
  '#2B3A8C',
  '#4F5BD5',
  '#7C83FD',
  '#3E7CB1',
  '#2E8C88',
  '#3F8F63',
  '#9A8A3A',
  '#B7862B',
  '#C07A3D',
  '#B4505E',
  '#8A5DB0',
  '#5E6A85',
] as const;

export function SwatchPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <View className="flex-row flex-wrap gap-2.5">
      {SWATCHES.map((c) => {
        const selected = c.toLowerCase() === value.toLowerCase();
        return (
          <Pressable
            key={c}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(c);
            }}
            accessibilityRole="button"
            accessibilityLabel={`Cor ${c}`}
            accessibilityState={{ selected }}
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: c }}>
            {selected && <Check size={16} color="#FFFFFF" strokeWidth={2.6} />}
          </Pressable>
        );
      })}
    </View>
  );
}
