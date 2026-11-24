import { Image } from 'expo-image';
import { User, type LucideIcon } from 'lucide-react-native';
import { View } from 'react-native';

import { initialsOf } from '../domain/initials';
import { cn } from './cn';
import { Text } from './text';
import { palette, useThemeColors } from './theme';

export type AvatarSize = 32 | 40 | 72;

const INITIALS_CLASS: Record<AvatarSize, string> = {
  32: 'text-xs',
  40: 'text-sm',
  72: 'text-2xl',
};

/**
 * Round photo, or on a tonal circle: the chosen glyph, else the initials, else a person glyph
 * when there is no name. `color` (a swatch hex) replaces the tonal fill when there is no photo.
 */
export function Avatar({
  name,
  photoUri,
  size = 40,
  className,
  color,
  icon: Icon,
}: {
  name: string;
  photoUri?: string | null;
  size?: AvatarSize;
  className?: string;
  color?: string | null;
  icon?: LucideIcon | null;
}) {
  const colors = useThemeColors();
  const box = { width: size, height: size, borderRadius: size / 2 };
  const trimmed = name.trim();
  const label = trimmed ? `Foto de ${trimmed}` : 'Foto do perfil';

  if (photoUri) {
    return (
      <Image
        source={{ uri: photoUri }}
        style={box}
        contentFit="cover"
        transition={150}
        accessibilityLabel={label}
        className={className}
      />
    );
  }

  // Colored fills take a light foreground, the same way the swatch check mark does.
  const fill = color ? { backgroundColor: color } : undefined;
  const glyphColor = color ? palette.snow : colors.accent;
  const initials = initialsOf(trimmed);

  let content;
  if (Icon) {
    content = <Icon size={Math.round(size * 0.5)} color={glyphColor} strokeWidth={1.9} />;
  } else if (initials) {
    content = (
      <Text
        className={cn('font-sans-semibold', INITIALS_CLASS[size], !color && 'text-secondary-foreground')}
        style={color ? { color: palette.snow } : undefined}>
        {initials}
      </Text>
    );
  } else {
    content = <User size={Math.round(size * 0.45)} color={glyphColor} strokeWidth={1.9} />;
  }

  return (
    <View
      accessible
      accessibilityLabel={label}
      className={cn('items-center justify-center', !color && 'bg-secondary', className)}
      style={[box, fill]}>
      {content}
    </View>
  );
}
