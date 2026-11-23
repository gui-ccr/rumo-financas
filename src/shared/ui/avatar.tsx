import { Image } from 'expo-image';
import { User } from 'lucide-react-native';
import { View } from 'react-native';

import { initialsOf } from '../domain/initials';
import { cn } from './cn';
import { Text } from './text';
import { useThemeColors } from './theme';

export type AvatarSize = 32 | 40 | 72;

const INITIALS_CLASS: Record<AvatarSize, string> = {
  32: 'text-xs',
  40: 'text-sm',
  72: 'text-2xl',
};

/** Round photo, or the initials on a tonal circle (a person glyph when there is no name). */
export function Avatar({
  name,
  photoUri,
  size = 40,
  className,
}: {
  name: string;
  photoUri?: string | null;
  size?: AvatarSize;
  className?: string;
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

  const initials = initialsOf(trimmed);
  return (
    <View
      accessible
      accessibilityLabel={label}
      className={cn('items-center justify-center bg-secondary', className)}
      style={box}>
      {initials ? (
        <Text className={cn('font-sans-semibold text-secondary-foreground', INITIALS_CLASS[size])}>{initials}</Text>
      ) : (
        <User size={Math.round(size * 0.45)} color={colors.accent} strokeWidth={1.9} />
      )}
    </View>
  );
}
