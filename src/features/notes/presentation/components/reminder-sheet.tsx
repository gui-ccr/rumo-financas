import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState, type RefObject } from 'react';
import { Platform, Pressable, View } from 'react-native';

import { Button } from '@/shared/ui/button';
import { ErrorNote } from '@/shared/ui/feedback';
import { Sheet, type SheetRef } from '@/shared/ui/sheet';
import { Text } from '@/shared/ui/text';
import { useIsDark } from '@/shared/ui/theme';

import { reminderLabel } from '../../domain/note';

/** Pads a Date to "HH:mm" for the quick options. */
function hm(d: Date) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * The clock, read through one function so every use is the moment it runs. A sheet opened
 * later in the day still offers the right "Hoje" and "Amanhã".
 */
function currentTime(): Date {
  return new Date();
}

function quickOptions(now: Date) {
  const tonight = new Date(now);
  tonight.setHours(18, 0, 0, 0);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);
  const options: { key: string; label: string; when: Date }[] = [];
  if (tonight.getTime() > now.getTime()) options.push({ key: 'tonight', label: 'Hoje', when: tonight });
  options.push({ key: 'tomorrow', label: 'Amanhã', when: tomorrow });
  return options;
}

/**
 * Picks a reminder time. Quick options first; "Escolher" opens the system date and time
 * (Android dialogs, one after the other; iOS spinner inline). Past times are refused.
 */
export function ReminderSheet({
  sheetRef,
  current,
  onPick,
}: {
  sheetRef: RefObject<SheetRef | null>;
  current: string | null;
  onPick: (iso: string | null) => void;
}) {
  const isDark = useIsDark();
  const [error, setError] = useState<string | null>(null);
  const [iosDraft, setIosDraft] = useState<Date | null>(null);
  const choose = (when: Date) => {
    if (when.getTime() <= currentTime().getTime()) {
      setError('Escolha um horário no futuro.');
      return;
    }
    setError(null);
    setIosDraft(null);
    onPick(when.toISOString());
    sheetRef.current?.dismiss();
  };

  const pickCustom = () => {
    setError(null);
    const base = current ? new Date(current) : new Date(currentTime().getTime() + 60 * 60 * 1000);
    if (Platform.OS === 'ios') {
      setIosDraft(base);
      return;
    }
    DateTimePickerAndroid.open({
      value: base,
      mode: 'date',
      onChange: (event, day) => {
        if (event.type !== 'set' || !day) return;
        DateTimePickerAndroid.open({
          value: day,
          mode: 'time',
          is24Hour: true,
          onChange: (timeEvent, time) => {
            if (timeEvent.type === 'set' && time) {
              const combined = new Date(day);
              combined.setHours(time.getHours(), time.getMinutes(), 0, 0);
              choose(combined);
            }
          },
        });
      },
    });
  };

  return (
    <Sheet ref={sheetRef} title="Lembrete">
      <View className="gap-3 px-5 pb-8 pt-2">
        {quickOptions(currentTime()).map((o) => (
          <Pressable
            key={o.key}
            onPress={() => choose(o.when)}
            accessibilityRole="button"
            className="h-14 flex-row items-center justify-between rounded-full bg-muted px-5 active:opacity-70">
            <Text className="font-sans-semibold">{o.label}</Text>
            <Text className="font-mono-medium text-base">{hm(o.when)}</Text>
          </Pressable>
        ))}

        <Pressable
          onPress={pickCustom}
          accessibilityRole="button"
          className="h-14 flex-row items-center justify-between rounded-full bg-muted px-5 active:opacity-70">
          <Text className="font-sans-semibold">Escolher data e hora</Text>
          <Text className="font-mono-medium text-base text-muted-foreground">{current ? reminderLabel(current) : '—'}</Text>
        </Pressable>

        {iosDraft && (
          <View className="gap-3">
            <DateTimePicker
              value={iosDraft}
              mode="datetime"
              display="spinner"
              minimumDate={currentTime()}
              themeVariant={isDark ? 'dark' : 'light'}
              onChange={(_, d) => d && setIosDraft(d)}
            />
            <Button size="lg" onPress={() => iosDraft && choose(iosDraft)}>
              <Text>Usar este horário</Text>
            </Button>
          </View>
        )}

        {current && (
          <Button variant="ghost" onPress={() => { onPick(null); sheetRef.current?.dismiss(); }}>
            <Text className="text-destructive">Remover lembrete</Text>
          </Button>
        )}

        <ErrorNote message={error} />
      </View>
    </Sheet>
  );
}
