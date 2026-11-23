import { router } from 'expo-router';
import { Pressable, View } from 'react-native';

import { Avatar } from '@/shared/ui/avatar';
import { Text } from '@/shared/ui/text';

import { useProfile } from '../hooks';

/** Home header (kit F04): avatar, then "Olá," above the name. Tapping opens the profile editor. */
export function ProfileHeader() {
  const profile = useProfile();
  const name = profile.data?.name ?? '';
  return (
    <Pressable
      onPress={() => router.push('/perfil')}
      accessibilityRole="button"
      accessibilityLabel="Editar perfil"
      className="flex-1 flex-row items-center gap-3 active:opacity-70">
      <Avatar name={name} photoUri={profile.data?.photoUri} size={40} />
      <View className="flex-1">
        <Text variant="muted">Olá,</Text>
        <Text className="font-sans-semibold text-lg" numberOfLines={1}>
          {name || 'Seu perfil'}
        </Text>
      </View>
    </Pressable>
  );
}
