import { router } from 'expo-router';
import { Bike, ChevronRight, Plus, Tags, Wallet } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { View } from 'react-native';

import { useCategories } from '@/features/accounts/presentation/hooks';
import {
  INCOME_KIND_LABEL,
  type IncomeOccurrenceView,
} from '@/features/incomes/domain/income';
import {
  useAddExpectedIncome,
  useExpectedIncome,
  useIncomes,
  usePendingIncomes,
} from '@/features/incomes/presentation/hooks';
import { currentMonth, formatShortDate } from '@/shared/domain/dates';
import { Button } from '@/shared/ui/button';
import { CategoryBadge, IconTile } from '@/shared/ui/category-badge';
import { EmptyState } from '@/shared/ui/feedback';
import { Illustration } from '@/shared/ui/illustration';
import { ListRow, ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { HeaderIconButton, Screen } from '@/shared/ui/screen';
import { Sheet, type SheetRef } from '@/shared/ui/sheet';
import { Pill, Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { IncomeFormSheet } from '../components/income-form-sheet';
import { ReceiveIncomeSheet } from '../components/receive-income-sheet';

export function PlanScreen({ embedded = false }: { embedded?: boolean } = {}) {
  const colors = useThemeColors();
  const month = currentMonth();
  const chevron = <ChevronRight size={18} color={colors.iconMuted} />;

  const incomes = useIncomes();
  const pendingIncomes = usePendingIncomes();
  const expected = useExpectedIncome(month);
  const categories = useCategories();
  const addExpected = useAddExpectedIncome();

  const receiveSheetRef = useRef<SheetRef>(null);
  const incomeSheetRef = useRef<SheetRef>(null);
  const [selectedOccurrence, setSelectedOccurrence] = useState<IncomeOccurrenceView | null>(null);

  const openReceive = (occurrence: IncomeOccurrenceView) => {
    setSelectedOccurrence(occurrence);
    receiveSheetRef.current?.present();
  };

  const pendingList = pendingIncomes.data ?? [];
  const waitingList = pendingList.filter((i) => i.expectedDate === null);
  const incomeList = incomes.data ?? [];
  const expectedTotal = expected.data ?? 0;
  const categoryCount = categories.data?.length;

  const refresh = () => {
    incomes.refetch();
    pendingIncomes.refetch();
    expected.refetch();
    categories.refetch();
  };

  const isRefreshing =
    incomes.isRefetching || pendingIncomes.isRefetching || expected.isRefetching;

  return (
    <Screen
      title="Planejar"
      embedded={embedded}
      actions={
        <HeaderIconButton label="Nova renda" onPress={() => incomeSheetRef.current?.present()}>
          <Plus size={20} color={colors.foreground} strokeWidth={1.9} />
        </HeaderIconButton>
      }
      onRefresh={refresh}
      refreshing={isRefreshing}>
      {/* Hero card com previsão de entradas e ilustração */}
      <Surface tone="raised" className="flex-row items-center justify-between p-5">
        <View className="flex-1 gap-1">
          <Text variant="caption">Previsão de entradas do mês</Text>
          <Money cents={expectedTotal} size="xl" tone="income" />
          {waitingList.length > 0 && (
            <View className="flex-row pt-1">
              <Pill
                label={`${waitingList.length} ${waitingList.length === 1 ? 'bolsa aguardando' : 'bolsas aguardando'}`}
                tone="warning"
              />
            </View>
          )}
        </View>
        <Illustration name={waitingList.length > 0 ? 'waiting' : 'plan'} size={72} />
      </Surface>

      {/* Bolsas e Rendas Pendentes / Aguardando. Vazio: o estado fica fora de qualquer card. */}
      {pendingList.length === 0 ? (
        <View className="gap-2">
          <View className="px-1">
            <Text variant="section">Entradas aguardadas</Text>
          </View>
          <EmptyState
            illustration="waiting"
            title="Nenhuma entrada pendente"
            description="Cadastre bolsas, salários ou freelas para acompanhar quando entrarem."
          />
        </View>
      ) : (
        <ListSection title="Entradas aguardadas">
          {pendingList.map((i) => {
            const isWaiting = i.expectedDate === null;
            return (
              <ListRow
                key={`pending-${i.id}`}
                leading={
                  i.category ? (
                    <CategoryBadge icon={i.category.icon} color={i.category.color} />
                  ) : (
                    <IconTile>
                      <Wallet size={18} color={colors.income} strokeWidth={1.9} />
                    </IconTile>
                  )
                }
                title={i.incomeName}
                subtitle={
                  isWaiting ? (
                    <Pill label="Sem data certa" tone="warning" />
                  ) : (
                    <Text variant="caption">Previsto: {formatShortDate(i.expectedDate!)}</Text>
                  )
                }
                trailing={
                  <View className="flex-row items-center gap-3">
                    <Money cents={i.expectedCents} tone="income" />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 rounded-full px-3"
                      onPress={() => openReceive(i)}>
                      <Text className="text-xs">Recebi</Text>
                    </Button>
                  </View>
                }
              />
            );
          })}
        </ListSection>
      )}

      {/* Rendas Ativas Cadastradas */}
      {incomeList.length > 0 && (
        <ListSection title="Rendas cadastradas">
          {incomeList.map((inc) => (
            <ListRow
              key={`income-${inc.id}`}
              leading={
                <IconTile>
                  <Wallet size={18} color={colors.foreground} strokeWidth={1.9} />
                </IconTile>
              }
              title={inc.name}
              onPress={
                inc.kind === 'uncertain'
                  ? () => addExpected.mutate({ incomeId: inc.id, month: month, expectedCents: inc.expectedCents })
                  : undefined
              }
              accessibilityLabel={inc.kind === 'uncertain' ? `Aguardar ${inc.name} neste mês` : undefined}
              subtitle={
                inc.kind === 'fixed'
                  ? `Fixa (todo dia ${inc.dueDay ?? 5})`
                  : `${INCOME_KIND_LABEL[inc.kind]} · toque para aguardar este mês`
              }
              trailing={<Money cents={inc.expectedCents} tone="default" />}
            />
          ))}
        </ListSection>
      )}

      {/* Seção Moto */}
      <ListSection title="Atalhos de trabalho">
        <ListRow
          leading={
            <IconTile>
              <Bike size={18} color={colors.accent} strokeWidth={1.9} />
            </IconTile>
          }
          title="Painel Moto"
          subtitle="Ganhos, custos e lucro por corrida"
          trailing={chevron}
          onPress={() => router.push('/moto')}
        />
      </ListSection>

      {/* Categorias: uma linha que leva à lista completa (a mesma de Ajustes). */}
      <ListSection title="Organização">
        <ListRow
          leading={
            <IconTile>
              <Tags size={18} color={colors.accent} strokeWidth={1.9} />
            </IconTile>
          }
          title="Categorias"
          subtitle={
            categoryCount === undefined
              ? 'Gastos e entradas, por grupo'
              : `${categoryCount} ${categoryCount === 1 ? 'categoria' : 'categorias'} de gasto e entrada`
          }
          trailing={chevron}
          onPress={() => router.push('/categorias')}
        />
      </ListSection>

      {/* Bottom Sheet de Confirmação de Recebimento com Animação */}
      <Sheet ref={receiveSheetRef} title="Confirmar recebimento">
        <ReceiveIncomeSheet
          occurrence={selectedOccurrence}
          onDone={() => {
            receiveSheetRef.current?.dismiss();
            refresh();
          }}
        />
      </Sheet>

      {/* Bottom Sheet de Cadastro de Nova Renda */}
      <Sheet ref={incomeSheetRef} title="Nova renda ou bolsa">
        <IncomeFormSheet
          onDone={() => {
            incomeSheetRef.current?.dismiss();
            refresh();
          }}
        />
      </Sheet>
    </Screen>
  );
}
