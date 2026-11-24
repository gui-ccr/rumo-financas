import { Pressable, View } from 'react-native';

import { AVATAR_ICON_KEYS, type AvatarIconKey } from '@/features/profile/domain/profile';
import { Button } from '@/shared/ui/button';
import { SwatchPicker } from '@/shared/ui/swatches';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { AVATAR_ICONS } from '../avatar-icons';

/**
 * Color and glyph for the avatar when there is no photo. `null` means the default tone
 * for color and initials for the glyph.
 */
export function AvatarStyleFields({
  color,
  icon,
  onColorChange,
  onIconChange,
}: {
  color: string | null;
  icon: AvatarIconKey | null;
  onColorChange: (color: string | null) => void;
  onIconChange: (icon: AvatarIconKey | null) => void;
}) {
  const colors = useThemeColors();
  const chipBase = 'items-center justify-center rounded-full border-2 bg-card';
  const chipSelected = (selected: boolean) => (selected ? 'border-accent' : 'border-transparent');

  return (
    <View className="gap-6">
      <View className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text variant="label">Cor do avatar</Text>
          {color && (
            <Button variant="ghost" size="sm" onPress={() => onColorChange(null)} accessibilityLabel="Usar cor padrão">
              <Text className="text-sm text-muted-foreground">Cor padrão</Text>
            </Button>
          )}
        </View>
        <SwatchPicker value={color ?? ''} onChange={onColorChange} />
        <Text variant="caption">Usada quando você não tem foto.</Text>
      </View>

      <View className="gap-3">
        <Text variant="label">Ícone do avatar</Text>
        <View className="flex-row flex-wrap gap-2.5">
          <Pressable
            onPress={() => onIconChange(null)}
            accessibilityRole="button"
            accessibilityLabel="Mostrar iniciais"
            accessibilityState={{ selected: icon === null }}
            className={`h-11 justify-center px-4 ${chipBase} ${chipSelected(icon === null)}`}>
            <Text className="font-sans-medium text-sm">Iniciais</Text>
          </Pressable>
          {AVATAR_ICON_KEYS.map((key) => {
            const Glyph = AVATAR_ICONS[key];
            const selected = icon === key;
            return (
              <Pressable
                key={key}
                onPress={() => onIconChange(key)}
                accessibilityRole="button"
                accessibilityLabel={`Ícone ${key}`}
                accessibilityState={{ selected }}
                className={`h-11 w-11 ${chipBase} ${chipSelected(selected)}`}>
                <Glyph size={20} color={selected ? colors.accent : colors.mutedForeground} strokeWidth={1.9} />
              </Pressable>
            );
          })}
        </View>
      </View>
    </View>
  );
}
