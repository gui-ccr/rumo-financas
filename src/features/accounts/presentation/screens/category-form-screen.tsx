import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { CategoryBadge } from '@/shared/ui/category-badge';
import { cn } from '@/shared/ui/cn';
import { ErrorNote } from '@/shared/ui/feedback';
import { Chip, Field } from '@/shared/ui/form';
import { CATEGORY_ICON_KEYS } from '@/shared/ui/icon';
import { Input } from '@/shared/ui/input';
import { ModalHeader } from '@/shared/ui/modal-header';
import { Segmented } from '@/shared/ui/segmented';
import { SWATCHES, SwatchPicker } from '@/shared/ui/swatches';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { CATEGORY_GROUP_LABEL, type Category, type CategoryGroup, type CategoryKind } from '../../domain/category';
import { useArchiveCategory, useCategories, useSaveCategory } from '../hooks';

const GROUPS: CategoryGroup[] = ['moto', 'dev', 'casa', 'pessoal'];

export function CategoryFormScreen({ id }: { id?: number }) {
  const categories = useCategories();
  if (id !== undefined && !categories.data) return <View className="flex-1 bg-background" />;
  return <CategoryForm category={categories.data?.find((c) => c.id === id) ?? null} />;
}

function CategoryForm({ category }: { category: Category | null }) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const [name, setName] = useState(category?.name ?? '');
  const [kind, setKind] = useState<CategoryKind>(category?.kind ?? 'expense');
  const [group, setGroup] = useState<CategoryGroup>(category?.group ?? 'pessoal');
  const [icon, setIcon] = useState(category?.icon ?? 'tag');
  const [color, setColor] = useState(category?.color ?? SWATCHES[2]);
  const save = useSaveCategory();
  const archive = useArchiveCategory();

  const submit = () =>
    save.mutate({ id: category?.id, input: { name, kind, group, icon, color } }, { onSuccess: () => router.back() });

  const confirmArchive = () =>
    Alert.alert('Arquivar categoria', `${category?.name} some do lançamento rápido. O histórico continua igual.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Arquivar',
        style: 'destructive',
        onPress: () => category && archive.mutate(category.id, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-background">
      <ModalHeader title={category ? 'Editar categoria' : 'Nova categoria'} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-7 px-5 pb-8 pt-2">
        <View className="items-center py-2">
          <CategoryBadge icon={icon} color={color} size="lg" />
        </View>
        <Segmented
          options={[
            { value: 'expense', label: 'Gasto' },
            { value: 'income', label: 'Entrada' },
          ]}
          value={kind}
          onChange={setKind}
        />
        <Field label="Nome">
          <Input value={name} onChangeText={setName} placeholder="Ex.: Academia" maxLength={30} />
        </Field>
        <Field label="Grupo" hint="Onde esta categoria aparece nos resumos: Moto, Dev, Casa ou Pessoal.">
          <View className="flex-row flex-wrap gap-2">
            {GROUPS.map((g) => (
              <Chip key={g} label={CATEGORY_GROUP_LABEL[g]} selected={g === group} onPress={() => setGroup(g)} />
            ))}
          </View>
        </Field>
        <Field label="Ícone" hint="Aparece ao lado do nome nas listas.">
          <View className="flex-row flex-wrap gap-2">
            {CATEGORY_ICON_KEYS.filter((k) => k !== 'more').map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setIcon(k);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Ícone ${k}`}
                accessibilityState={{ selected: k === icon }}
                className={cn('rounded-full border p-0.5 active:opacity-70', k === icon ? 'border-primary' : 'border-transparent')}>
                <CategoryBadge icon={k} color={k === icon ? color : colors.iconMuted} />
              </Pressable>
            ))}
          </View>
        </Field>
        <Field label="Cor">
          <SwatchPicker value={color} onChange={setColor} />
        </Field>
        {category && (
          <Button variant="ghost" onPress={confirmArchive}>
            <Text className="text-destructive">Arquivar categoria</Text>
          </Button>
        )}
      </ScrollView>
      <View className="gap-2 border-t-hairline border-border px-5 pt-3" style={{ paddingBottom: insets.bottom + 10 }}>
        <ErrorNote message={save.error ? errorMessage(save.error) : null} />
        <Button size="lg" disabled={!name.trim()} loading={save.isPending} onPress={submit}>
          <Text>{category ? 'Salvar alterações' : 'Criar categoria'}</Text>
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}
