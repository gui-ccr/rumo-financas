import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { CircleCheck, CircleX } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, Pressable, View } from 'react-native';

import { errorMessage } from '@/shared/presentation/use-command';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/ui/cn';
import { EmptyState, ErrorNote, Skeleton } from '@/shared/ui/feedback';
import { Field } from '@/shared/ui/form';
import { Illustration } from '@/shared/ui/illustration';
import { ListRow, ListSection } from '@/shared/ui/list';
import { Money } from '@/shared/ui/money';
import { MoneyInput } from '@/shared/ui/money-input';
import { Screen } from '@/shared/ui/screen';
import { Sheet, type SheetRef } from '@/shared/ui/sheet';
import { Pill, Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import { EDITABLE_SHIFT_STATUSES, hourlyCents, shiftDurationMinutes, type ShiftStatus } from '../../domain/shift';
import type { NotificationCapture } from '../../domain/notification-capture';
import { CaptureAmountForm } from '../components/capture-amount-form';
import { formatClock, formatDuration, formatShiftStart } from '../format';
import {
  useAssignCapture,
  useConfirmShift,
  useDiscardShift,
  useEndShift,
  useLearningCaptures,
  useSetReportedTotal,
  useShiftReview,
  useUpdateShiftCapture,
} from '../hooks';
import { useNow } from '../use-now';

const STATUS: Record<ShiftStatus, { label: string; tone: 'neutral' | 'income' | 'warning' | 'accent' }> = {
  active: { label: 'Em andamento', tone: 'income' },
  reviewing: { label: 'Aguardando conferência', tone: 'warning' },
  confirmed: { label: 'Confirmado', tone: 'accent' },
  discarded: { label: 'Descartado', tone: 'neutral' },
};

/** Live review of a shift: totals, what the racing app reported, the Pix list, and the confirm/discard actions. */
export function ShiftReviewScreen({ shiftId }: { shiftId: number }) {
  const colors = useThemeColors();
  const review = useShiftReview(shiftId);
  const learning = useLearningCaptures();
  const now = useNow();
  const update = useUpdateShiftCapture();
  const assign = useAssignCapture();
  const endShift = useEndShift();
  const discard = useDiscardShift();
  const confirm = useConfirmShift();
  const [created, setCreated] = useState<number | null>(null);
  const [editing, setEditing] = useState<NotificationCapture | null>(null);
  const sheet = useRef<SheetRef>(null);

  if (created !== null) {
    return (
      <Screen back title="Turno confirmado">
        <View className="items-center gap-3 py-4">
          <Illustration name="received" size={160} />
          <Text variant="heading" className="text-center">
            Turno confirmado!
          </Text>
          <Text variant="muted" className="text-center">
            {created === 1 ? '1 Pix virou' : `${created} Pix viraram`} lançamento de entrada.
          </Text>
          <Money cents={review.data?.includedTotalCents ?? 0} size="lg" tone="income" />
        </View>
        <Button size="lg" onPress={() => router.back()}>
          <Text>Concluir</Text>
        </Button>
      </Screen>
    );
  }

  if (review.isLoading) {
    return (
      <Screen back title="Turno">
        <Skeleton className="h-[170px]" />
        <Skeleton className="h-[220px]" />
      </Screen>
    );
  }

  const data = review.data;
  if (!data) {
    return (
      <Screen back title="Turno">
        <EmptyState illustration="empty" title="Turno não encontrado" description="Ele pode ter sido descartado ou apagado." />
      </Screen>
    );
  }

  const { shift } = data;
  const editable = EDITABLE_SHIFT_STATUSES.includes(shift.status);
  const minutes = shiftDurationMinutes(shift.startedAt, shift.endedAt, now);
  const hourly = hourlyCents(data.includedTotalCents, minutes);
  const outside = (learning.data ?? []).filter((c) => c.status === 'outside_shift').slice(0, 10);
  const firstError = endShift.error ?? confirm.error ?? discard.error ?? assign.error;

  const openEdit = (capture: NotificationCapture) => {
    setEditing(capture);
    sheet.current?.present();
  };

  const confirmShift = () =>
    confirm.mutate(shiftId, {
      onSuccess: (n) => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setCreated(n);
      },
    });

  const confirmDiscard = () =>
    Alert.alert('Descartar turno', 'Os Pix deste turno não viram lançamentos. Essa ação não pode ser desfeita.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Descartar',
        style: 'destructive',
        onPress: () => discard.mutate(shiftId, { onSuccess: () => router.back() }),
      },
    ]);

  return (
    <Screen back title="Conferência">
      <Surface tone="raised" className="gap-4 p-5">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1 gap-1">
            <Text variant="muted">Turno de {formatShiftStart(shift.startedAt)}</Text>
            <Money cents={data.includedTotalCents} size="xl" />
          </View>
          <Pill label={STATUS[shift.status].label} tone={STATUS[shift.status].tone} />
        </View>
        <View className="flex-row gap-4">
          <Stat label="Pix">
            <Text className="font-mono-semibold text-base text-foreground">{data.includedCount}</Text>
          </Stat>
          <Stat label="Duração">
            <Text className="font-mono-semibold text-base text-foreground">{formatDuration(minutes)}</Text>
          </Stat>
          <Stat label="Por hora">
            {hourly === null ? (
              <Text className="font-mono-semibold text-base text-foreground">—</Text>
            ) : (
              <Money cents={hourly} size="sm" />
            )}
          </Stat>
        </View>
      </Surface>

      {editable ? (
        <ReportedTotalField shiftId={shiftId} initial={shift.reportedTotalCents} captured={data.includedTotalCents} />
      ) : (
        <View className="gap-1">
          <Text variant="label">Total do app de corrida</Text>
          <DifferenceText diff={data.differenceCents} />
        </View>
      )}

      {data.captures.length === 0 ? (
        <EmptyState
          illustration="waiting"
          title="Nenhum Pix neste turno"
          description="Os Pix que caírem no Nubank com o turno ligado aparecem aqui."
        />
      ) : (
        <ListSection title="Pix do turno">
          {data.captures.map((c) => {
            const included = c.status === 'in_shift' || c.status === 'confirmed';
            return (
              <ListRow
                key={c.id}
                onPress={editable ? () => openEdit(c) : undefined}
                accessibilityLabel={`Pix de ${c.payer ?? 'pagador desconhecido'}, editar valor`}
                leading={<Text className="w-12 font-mono-medium text-sm text-muted-foreground">{formatClock(c.postedAt)}</Text>}
                title={
                  <Text className={cn('font-sans-semibold', !included && 'text-muted-foreground line-through')} numberOfLines={1}>
                    {c.payer ?? 'Pix recebido'}
                  </Text>
                }
                subtitle={included ? undefined : 'Fora do total'}
                trailing={
                  <View className="flex-row items-center gap-3">
                    {c.amountCents !== null ? (
                      <Money cents={c.amountCents} tone={included ? 'default' : 'muted'} />
                    ) : (
                      <Text variant="muted">Sem valor</Text>
                    )}
                    {editable && (
                      <Pressable
                        hitSlop={10}
                        accessibilityRole="switch"
                        accessibilityLabel={included ? 'Excluir este Pix do total' : 'Incluir este Pix no total'}
                        accessibilityState={{ checked: included }}
                        onPress={() => update.mutate({ captureId: c.id, changes: { included: !included } })}>
                        {included ? (
                          <CircleCheck size={22} color={colors.income} strokeWidth={2} />
                        ) : (
                          <CircleX size={22} color={colors.iconMuted} strokeWidth={2} />
                        )}
                      </Pressable>
                    )}
                  </View>
                }
              />
            );
          })}
        </ListSection>
      )}

      {editable && outside.length > 0 && (
        <View className="gap-3">
          <ListSection title="Pix fora do turno">
            {outside.map((c) => (
              <ListRow
                key={c.id}
                leading={<Text className="w-12 font-mono-medium text-sm text-muted-foreground">{formatClock(c.postedAt)}</Text>}
                title={c.payer ?? 'Pix recebido'}
                subtitle={formatShiftStart(c.postedAt)}
                trailing={
                  <View className="flex-row items-center gap-3">
                    {c.amountCents !== null && <Money cents={c.amountCents} />}
                    <Button
                      variant="secondary"
                      size="sm"
                      loading={assign.isPending && assign.variables?.captureId === c.id}
                      onPress={() => assign.mutate({ captureId: c.id, shiftId })}>
                      <Text className="text-sm">Adicionar</Text>
                    </Button>
                  </View>
                }
              />
            ))}
          </ListSection>
          <Text variant="caption">Caíram sem turno ligado. Adicione os que foram desta corrida.</Text>
        </View>
      )}

      <View className="gap-2">
        {shift.status === 'active' && (
          <Button size="lg" loading={endShift.isPending} onPress={() => endShift.mutate(shiftId)}>
            <Text>Encerrar turno</Text>
          </Button>
        )}
        {shift.status === 'reviewing' && (
          <>
            <Button size="lg" loading={confirm.isPending} disabled={discard.isPending} onPress={confirmShift}>
              <Text>Confirmar turno</Text>
            </Button>
            <Button variant="ghost" disabled={confirm.isPending || discard.isPending} onPress={confirmDiscard}>
              <Text className="text-expense">Descartar turno</Text>
            </Button>
          </>
        )}
        {shift.status === 'confirmed' && (
          <Text variant="muted" className="text-center">
            Turno confirmado. Os Pix viraram lançamentos de entrada.
          </Text>
        )}
        {shift.status === 'discarded' && (
          <Text variant="muted" className="text-center">
            Turno descartado. Nada dele foi registrado.
          </Text>
        )}
        <ErrorNote message={firstError ? errorMessage(firstError) : null} />
      </View>

      <Sheet ref={sheet} title="Valor do Pix">
        {editing && <CaptureAmountForm key={editing.id} capture={editing} onDone={() => sheet.current?.dismiss()} />}
      </Sheet>
    </Screen>
  );
}

/**
 * The total the racing app says it paid. Saves on its own after a short pause (no save button while
 * the user is typing) and shows the difference against what was captured.
 */
function ReportedTotalField({
  shiftId,
  initial,
  captured,
}: {
  shiftId: number;
  initial: number | null;
  captured: number;
}) {
  const [value, setValue] = useState<number | null>(initial);
  const { mutate } = useSetReportedTotal();

  useEffect(() => {
    if (value === initial) return;
    const timer = setTimeout(() => mutate({ shiftId, cents: value }), 600);
    return () => clearTimeout(timer);
  }, [value, initial, shiftId, mutate]);

  return (
    <Field label="Quanto o app de corrida diz que pagou" hint="Veja o total no app de corrida. Comparamos com o que foi capturado aqui.">
      <MoneyInput value={value} onChange={setValue} />
      <DifferenceText diff={value === null ? null : value - captured} />
    </Field>
  );
}

/** Reported minus captured: green when they match, red with the amount when they do not. */
function DifferenceText({ diff }: { diff: number | null }) {
  if (diff === null) return <Text variant="caption">Informe o total para ver a diferença.</Text>;
  if (diff === 0) return <Text className="text-sm text-income">Bate com o app.</Text>;
  return (
    <View className="flex-row flex-wrap items-center gap-2">
      <Text className="text-sm text-expense">{diff > 0 ? 'Faltam capturar' : 'Sobram capturados'}</Text>
      <Money cents={Math.abs(diff)} tone="expense" size="sm" />
    </View>
  );
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className="flex-1 gap-1">
      <Text variant="caption">{label}</Text>
      {children}
    </View>
  );
}
