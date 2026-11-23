export type CategoryKind = 'expense' | 'income';

/** Where the money belongs in the user's life. */
export type CategoryGroup = 'moto' | 'dev' | 'casa' | 'pessoal';

export type Category = {
  id: number;
  name: string;
  kind: CategoryKind;
  group: CategoryGroup;
  /** Key in the icon registry (src/shared/ui/icon.tsx). Never an emoji. */
  icon: string;
  color: string;
  archived: boolean;
};

export const CATEGORY_GROUP_LABEL: Record<CategoryGroup, string> = {
  moto: 'Moto',
  dev: 'Dev',
  casa: 'Casa',
  pessoal: 'Pessoal',
};

/** Most used first, then alphabetical — the order of the quick-add picker. */
export function sortByUsage(categories: Category[], usage: Map<number, number>): Category[] {
  return [...categories].sort(
    (a, b) => (usage.get(b.id) ?? 0) - (usage.get(a.id) ?? 0) || a.name.localeCompare(b.name, 'pt-BR'),
  );
}
