import { router } from 'expo-router';
import { Plus, Search } from 'lucide-react-native';
import { useDeferredValue, useState } from 'react';
import { View } from 'react-native';

import { EmptyState } from '@/shared/ui/feedback';
import { Input } from '@/shared/ui/input';
import { HeaderIconButton, Screen } from '@/shared/ui/screen';
import { Text } from '@/shared/ui/text';
import { useThemeColors } from '@/shared/ui/theme';

import type { Note } from '../domain/note';
import { NoteCard } from './components/note-card';
import { useNotes } from './hooks';

function NoteGrid({ title, notes }: { title?: string; notes: Note[] }) {
  return (
    <View className="gap-3">
      {title && <Text variant="section">{title}</Text>}
      <View className="flex-row flex-wrap gap-3">
        {notes.map((n) => (
          <NoteCard key={n.id} note={n} />
        ))}
      </View>
    </View>
  );
}

/** The notes tab: search, pinned notes first, then the rest in a two-column grid. */
export function NotesView() {
  const colors = useThemeColors();
  const [search, setSearch] = useState('');
  const deferred = useDeferredValue(search);
  const notes = useNotes(deferred);

  const list = notes.data ?? [];
  const pinned = list.filter((n) => n.pinned);
  const others = list.filter((n) => !n.pinned);

  return (
    <Screen
      title="Notas"
      actions={
        <HeaderIconButton
          label="Nova nota"
          onPress={() => router.push({ pathname: '/nota/[id]', params: { id: 'nova' } })}>
          <Plus size={20} color={colors.foreground} strokeWidth={1.9} />
        </HeaderIconButton>
      }
      onRefresh={() => notes.refetch()}
      refreshing={notes.isRefetching}>
      <View className="justify-center">
        <View className="absolute left-4 z-10">
          <Search size={16} color={colors.mutedForeground} />
        </View>
        <Input
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar nas notas"
          className="pl-11"
          returnKeyType="search"
        />
      </View>

      {notes.data && list.length === 0 ? (
        deferred ? (
          <EmptyState title="Nada encontrado" description="Tente outra palavra." />
        ) : (
          <EmptyState
            illustration="empty"
            title="Anote o que não pode esquecer"
            description="Toque em + para criar a primeira nota. Ela pode ter um lembrete com dia e hora."
          />
        )
      ) : (
        <>
          {pinned.length > 0 && <NoteGrid title="Fixadas" notes={pinned} />}
          {others.length > 0 && <NoteGrid title={pinned.length > 0 ? 'Outras' : undefined} notes={others} />}
        </>
      )}
    </Screen>
  );
}
