import { router } from 'expo-router';
import { CircleCheck, Pin } from 'lucide-react-native';
import { memo } from 'react';
import { Pressable, View } from 'react-native';

import { cn } from '@/shared/ui/cn';
import { Surface } from '@/shared/ui/surface';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import type { Note } from '../../domain/note';
import { ReminderChip } from './reminder-chip';

function NoteCardView({ note }: { note: Note }) {
  const colors = useThemeColors();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/nota/[id]', params: { id: String(note.id) } })}
      accessibilityRole="button"
      accessibilityLabel={`${note.title || 'Sem título'}${note.done ? ', concluída' : ''}`}
      className={cn('w-[48%] active:opacity-70', note.done && 'opacity-60')}>
      <Surface tone="plain" className="gap-2 rounded-lg p-3" style={{ minHeight: 152 }}>
        <View className="flex-row items-start justify-between gap-2">
          <Text className="flex-1 font-sans-semibold" numberOfLines={2}>
            {note.title || 'Sem título'}
          </Text>
          {note.pinned && <Pin size={14} color={colors.accent} strokeWidth={2} />}
        </View>
        {note.body.trim() ? (
          <Text variant="muted" numberOfLines={4}>
            {note.body}
          </Text>
        ) : null}
        <View className="flex-1" />
        {note.done ? (
          <View className="flex-row items-center gap-1.5">
            <CircleCheck size={14} color={colors.income} strokeWidth={2} />
            <Text variant="caption">Concluída</Text>
          </View>
        ) : note.remindAt ? (
          <ReminderChip remindAt={note.remindAt} />
        ) : null}
      </Surface>
    </Pressable>
  );
}

/** Memoized: rows keep identity between renders of the grid. */
export const NoteCard = memo(NoteCardView);
