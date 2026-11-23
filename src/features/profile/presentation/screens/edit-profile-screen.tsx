import { router } from 'expo-router';
import { Camera, Trash2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NAME_MAX_LENGTH, normalizeName, type Profile } from '@/features/profile/domain/profile';
import { errorMessage } from '@/shared/presentation/use-command';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { ErrorNote } from '@/shared/ui/feedback';
import { Field } from '@/shared/ui/form';
import { Input } from '@/shared/ui/input';
import { ModalHeader } from '@/shared/ui/modal-header';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { pickProfilePhoto } from '../../infrastructure/photo-picker';
import { useProfile, useSaveProfile, type PhotoChange } from '../hooks';

export function EditProfileScreen() {
  const profile = useProfile();
  if (!profile.data) return <View className="flex-1 bg-background" />;
  return <EditProfileForm profile={profile.data} />;
}

function EditProfileForm({ profile }: { profile: Profile }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [name, setName] = useState(profile.name);
  // The photo is only copied into the app when the user saves, so cancelling leaves no trace.
  const [photo, setPhoto] = useState<PhotoChange>({ kind: 'keep' });
  const [photoError, setPhotoError] = useState<string | null>(null);
  const save = useSaveProfile();

  const previewUri = photo.kind === 'set' ? photo.sourceUri : photo.kind === 'remove' ? null : profile.photoUri;
  const hasPhoto = previewUri !== null;

  const choosePhoto = async () => {
    setPhotoError(null);
    try {
      const uri = await pickProfilePhoto();
      if (uri) setPhoto({ kind: 'set', sourceUri: uri });
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'Não foi possível abrir as fotos.');
    }
  };

  const submit = () =>
    save.mutate({ name: normalizeName(name), photo }, { onSuccess: () => router.back() });

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-background">
      <ModalHeader title="Perfil" />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-7 px-5 pb-8 pt-2">
        <View className="items-center gap-4 py-2">
          <Avatar name={name} photoUri={previewUri} size={72} />
          <View className="flex-row gap-2">
            <Button variant="secondary" size="sm" onPress={choosePhoto} accessibilityLabel="Trocar foto">
              <Camera size={16} color={colors.foreground} strokeWidth={1.9} />
              <Text className="text-sm">Trocar foto</Text>
            </Button>
            {hasPhoto && (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setPhoto({ kind: 'remove' })}
                accessibilityLabel="Remover foto">
                <Trash2 size={16} color={colors.expense} strokeWidth={1.9} />
                <Text className="text-sm text-destructive">Remover foto</Text>
              </Button>
            )}
          </View>
          <ErrorNote message={photoError} />
        </View>

        <Field label="Nome" hint="Como o app te chama na tela inicial.">
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Como você quer ser chamado?"
            maxLength={NAME_MAX_LENGTH}
            returnKeyType="done"
          />
        </Field>
      </ScrollView>

      <View className="gap-2 border-t-hairline border-border px-5 pt-3" style={{ paddingBottom: insets.bottom + 10 }}>
        <ErrorNote message={save.error ? errorMessage(save.error) : null} />
        <Button size="lg" loading={save.isPending} onPress={submit}>
          <Text>Salvar</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
