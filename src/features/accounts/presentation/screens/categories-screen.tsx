import { router } from 'expo-router';
import { ChevronRight, Plus, Tags } from 'lucide-react-native';

import { Button } from '@/shared/ui/button';
import { CategoryBadge } from '@/shared/ui/category-badge';
import { EmptyState } from '@/shared/ui/feedback';
import { ListRow, ListSection } from '@/shared/ui/list';
import { HeaderIconButton, Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { CATEGORY_GROUP_LABEL, type CategoryGroup } from '../../domain/category';
import { useCategories } from '../hooks';

const GROUPS: CategoryGroup[] = ['moto', 'dev', 'casa', 'pessoal'];

/** Every category, grouped. Opened from Ajustes and from Planejar; tapping one edits it. */
export function CategoriesScreen() {
  const colors = useThemeColors();
  const categories = useCategories();
  const list = categories.data ?? [];

  const openCategory = (id: number | 'nova') =>
    router.push({ pathname: '/ajustes/categoria/[id]', params: { id: String(id) } });

  return (
    <Screen
      back
      title="Categorias"
      onRefresh={() => categories.refetch()}
      refreshing={categories.isRefetching}
      actions={
        <HeaderIconButton label="Nova categoria" onPress={() => openCategory('nova')}>
          <Plus size={20} color={colors.foreground} strokeWidth={1.9} />
        </HeaderIconButton>
      }>
      {categories.data && list.length === 0 && (
        <EmptyState
          icon={Tags}
          title="Nenhuma categoria ainda"
          description="Crie categorias para classificar gastos e entradas por grupo."
          action={
            <Button size="lg" onPress={() => openCategory('nova')}>
              <Text>Criar categoria</Text>
            </Button>
          }
        />
      )}

      {GROUPS.map((group) => {
        const items = list.filter((c) => c.group === group);
        if (items.length === 0) return null;
        return (
          <ListSection key={group} title={CATEGORY_GROUP_LABEL[group]}>
            {items.map((c) => (
              <ListRow
                key={c.id}
                onPress={() => openCategory(c.id)}
                leading={<CategoryBadge icon={c.icon} color={c.color} />}
                title={c.name}
                subtitle={c.kind === 'income' ? 'Entrada' : 'Gasto'}
                trailing={<ChevronRight size={18} color={colors.iconMuted} />}
              />
            ))}
          </ListSection>
        );
      })}
    </Screen>
  );
}
