import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { DEFAULT_GREETING, greetingForHour } from '@/features/profile/domain/profile';
import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';

import { avatarIconFor } from '../avatar-icons';
import { useProfile } from '../hooks';

/**
 * Home header (kit F04): avatar, then the greeting above the name, and the status line under it when set.
 * Tapping opens the profile editor.
 */
export function ProfileHeader() {
  const profile = useProfile();
  const data = profile.data;
  const name = data?.name ?? '';
  const greeting = data?.timeGreeting ? greetingForHour(new Date().getHours()) : DEFAULT_GREETING;
  return (
    <Pressable
      onPress={() => router.push('/perfil')}
      accessibilityRole="button"
      accessibilityLabel="Editar perfil"
      className="flex-1 flex-row items-center gap-3 active:opacity-70">
      <Avatar
        name={name}
        photoUri={data?.photoUri}
        color={data?.avatarColor}
        icon={avatarIconFor(data?.avatarIcon ?? null)}
        size={40}
      />
      <View className="flex-1">
        <Text variant="muted">{greeting}</Text>
        <Text className="font-sans-semibold text-lg" numberOfLines={1}>
          {name || 'Seu perfil'}
        </Text>
        {data?.status ? (
          <Text variant="caption" numberOfLines={1}>
            {data.status}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
