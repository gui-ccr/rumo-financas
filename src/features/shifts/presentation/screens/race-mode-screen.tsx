import { router } from 'expo-router';
import { Bell, Bike, ChevronRight, CircleCheck, Plus } from 'lucide-react-native';
import { useRef, useState } from 'react';
import { Switch, View } from 'react-native';

import { formatBRL } from '@/shared/domain/money';
import { Button } from '@/shared/ui/button';
import { IconTile } from '@/shared/ui/category-badge';
import { EmptyState, Skeleton } from '@/shared/ui/feedback';
import { ListRow, ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { Screen, HeaderIconButton } from '@/shared/ui/screen';
import { Sheet, type SheetRef } from '@/shared/ui/sheet';
import { Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import type { NotificationRule } from '../../domain/notification-rule';
import { RuleForm } from '../components/rule-form';
import { formatClock, formatDuration, formatShiftStart } from '../format';
import {
  useCaptureAccess,
  useLearningCaptures,
  useNotificationRules,
  useShifts,
  useToggleNotificationRule,
} from '../hooks';

/** Setup and history of the racing mode: permission, Pix rules, unrecognized notifications, shifts. */
export function RaceModeScreen() {
  const colors = useThemeColors();
  const access = useCaptureAccess();
  const rules = useNotificationRules();
  const learning = useLearningCaptures();
  const shifts = useShifts();
  const toggle = useToggleNotificationRule();
  const [editing, setEditing] = useState<NotificationRule | 'new' | null>(null);
  const sheet = useRef<SheetRef>(null);

  const openRule = (rule: NotificationRule | 'new') => {
    setEditing(rule);
    sheet.current?.present();
  };

  const unmatched = (learning.data ?? []).filter((c) => c.status === 'unmatched').slice(0, 20);

  return (
    <Screen
      back
      title="Modo corrida"
      actions={
        <HeaderIconButton label="Nova regra" onPress={() => openRule('new')}>
          <Plus size={20} color={colors.foreground} strokeWidth={1.9} />
        </HeaderIconButton>
      }>
      <Surface tone="plain" className="gap-2 p-5">
        <Text variant="heading">Como funciona</Text>
        <Text variant="muted">
          Quando o Nubank avisa que caiu um Pix, o Rumo lê a notificação e registra o valor no turno ligado. Você não
          digita nada durante a corrida.
        </Text>
      </Surface>

      <ListSection title="Permissão">
        {!access.available ? (
          <ListRow
            leading={
              <IconTile>
                <Bell size={18} color={colors.iconMuted} strokeWidth={2} />
              </IconTile>
            }
            title="Indisponível neste app"
            subtitle="Instale o Rumo pelo APK de desenvolvimento para ler notificações."
          />
        ) : access.granted ? (
          <ListRow
            leading={
              <IconTile>
                <CircleCheck size={18} color={colors.income} strokeWidth={2} />
              </IconTile>
            }
            title="Leitura de notificações ativa"
            subtitle="O Rumo pode ler os Pix do Nubank."
            trailing={<ChevronRight size={18} color={colors.iconMuted} />}
            onPress={access.openSettings}
            accessibilityLabel="Abrir configurações de acesso às notificações"
          />
        ) : (
          <View className="gap-4 p-4">
            <View className="gap-2">
              <Text className="font-sans-semibold">Falta permitir a leitura das notificações</Text>
              <Text variant="muted">1. Toque em Abrir configurações.</Text>
              <Text variant="muted">2. Procure Rumo na lista de apps.</Text>
              <Text variant="muted">3. Ative o acesso às notificações.</Text>
              <Text variant="muted">4. Volte para o Rumo. A permissão é checada sozinha.</Text>
            </View>
            <Button variant="secondary" onPress={access.openSettings}>
              <Text>Abrir configurações</Text>
            </Button>
          </View>
        )}
      </ListSection>

      <View className="gap-3">
        <ListSection title="Regras de Pix">
          {rules.isLoading ? (
            <Skeleton className="h-16" />
          ) : (rules.data ?? []).length === 0 ? (
            <EmptyState
              illustration="empty"
              title="Nenhuma regra"
              description="Crie uma regra com o app e o texto do Pix para o Rumo reconhecer."
            />
          ) : (
            (rules.data ?? []).map((rule) => (
              <ListRow
                key={rule.id}
                onPress={() => openRule(rule)}
                leading={
                  <IconTile>
                    <Bike size={18} color={rule.active ? colors.accent : colors.iconMuted} strokeWidth={2} />
                  </IconTile>
                }
                title={rule.name}
                subtitle={rule.packageName}
                trailing={
                  <Switch
                    value={rule.active}
                    onValueChange={(active) => toggle.mutate({ id: rule.id, active })}
                    trackColor={{ false: colors.muted, true: colors.accent }}
                    thumbColor={colors.foreground}
                    accessibilityLabel={`Regra ${rule.name} ativa`}
                  />
                }
              />
            ))
          )}
        </ListSection>
        <Text variant="caption">Toque numa regra para editar. O Nubank já vem configurado.</Text>
      </View>

      <View className="gap-3">
        <ListSection title="Notificações não reconhecidas">
          {unmatched.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="Nada por aqui"
              description="Notificações de apps observados que não são Pix recebido aparecem aqui, para você conferir."
            />
          ) : (
            unmatched.map((c) => (
              <ListRow
                key={c.id}
                leading={<Text className="w-12 font-mono-medium text-sm text-muted-foreground">{formatClock(c.postedAt)}</Text>}
                title={c.title ?? 'Sem título'}
                subtitle={
                  <Text variant="muted" numberOfLines={2}>
                    {c.text ?? 'Sem texto'}
                  </Text>
                }
              />
            ))
          )}
        </ListSection>
        {unmatched.length > 0 && (
          <Text variant="caption">Se um destes for Pix recebido, ajuste o padrão de texto na regra do app.</Text>
        )}
      </View>

      <View className="gap-3">
        <ListSection title="Histórico de turnos">
          {shifts.isLoading ? (
            <Skeleton className="h-16" />
          ) : (shifts.data ?? []).length === 0 ? (
            <EmptyState illustration="moto" title="Nenhum turno ainda" description="Ao rodar com o modo corrida ligado, cada turno aparece aqui." />
          ) : (
            (shifts.data ?? []).map((s) => (
              <ListRow
                key={s.shift.id}
                onPress={() => router.push(`/turno/${s.shift.id}`)}
                accessibilityLabel={`Turno de ${formatShiftStart(s.shift.startedAt)}, abrir conferência`}
                title={formatShiftStart(s.shift.startedAt)}
                subtitle={`${formatDuration(s.durationMinutes)} · ${s.count} Pix · ${s.accountName}`}
                trailing={
                  <View className="items-end gap-0.5">
                    <Money cents={s.totalCents} />
                    {s.hourlyCents !== null && <Text variant="caption">{formatHourly(s.hourlyCents)}</Text>}
                  </View>
                }
              />
            ))
          )}
        </ListSection>
      </View>

      <Sheet ref={sheet} title={editing === 'new' || editing === null ? 'Nova regra' : 'Editar regra'}>
        {editing !== null && (
          <RuleForm
            key={editing === 'new' ? 'new' : editing.id}
            rule={editing === 'new' ? undefined : editing}
            onDone={() => sheet.current?.dismiss()}
          />
        )}
      </Sheet>
    </Screen>
  );
}

function formatHourly(cents: number): string {
  return `${formatBRL(cents)}/h`;
}
