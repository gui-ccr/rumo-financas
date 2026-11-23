import { router, usePreventRemove } from 'expo-router';
import { Bell, CircleCheck, Pin, Trash2 } from 'lucide-react-native';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Alert, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { errorMessage } from '@/shared/presentation/use-command';
import { cn } from '@/shared/ui/cn';
import { EmptyState, ErrorNote } from '@/shared/ui/feedback';
import { ModalHeader } from '@/shared/ui/modal-header';
import type { SheetRef } from '@/shared/ui/sheet';
import { Pill } from '@/shared/ui/surface';
import { useThemeColors } from '@/shared/ui/theme';

import type { Note } from '../domain/note';
import { ReminderChip } from './components/reminder-chip';
import { ReminderSheet } from './components/reminder-sheet';
import { useDeleteNote, useNote, useSaveNote, useToggleNoteDone, useToggleNotePin } from './hooks';

/** What the editor shows. Pin and done are part of it, but they are saved on leave, like the text. */
type Draft = {
  title: string;
  body: string;
  remindAt: string | null;
  pinned: boolean;
  done: boolean;
};

const EMPTY: Draft = { title: '', body: '', remindAt: null, pinned: false, done: false };

const fromNote = (n: Note): Draft => ({
  title: n.title,
  body: n.body,
  remindAt: n.remindAt,
  pinned: n.pinned,
  done: n.done,
});

const same = (a: Draft, b: Draft) =>
  a.title === b.title &&
  a.body === b.body &&
  a.remindAt === b.remindAt &&
  a.pinned === b.pinned &&
  a.done === b.done;

/**
 * Note editor for /nota/nova and /nota/<id>. Changes are saved when the screen closes,
 * whether by the close button, the system back gesture or a delete. Nothing is lost silently:
 * if saving fails, the editor stays open and says why.
 */
export function NoteEditor({ id }: { id: number | 'nova' }) {
  const noteId = id === 'nova' ? undefined : id;
  const note = useNote(noteId);

  if (noteId !== undefined && note.isPending) return <View className="flex-1 bg-background" />;

  if (noteId !== undefined && note.data === null) {
    return (
      <View className="flex-1 bg-background">
        <ModalHeader />
        <EmptyState title="Esta nota não existe mais" description="Ela pode ter sido apagada." />
      </View>
    );
  }

  const initial = note.data ? fromNote(note.data) : EMPTY;
  // Keyed by id: each note opens with its own state, and saves never reset the form.
  return <NoteForm key={String(id)} id={id} initial={initial} />;
}

function NoteForm({ id, initial }: { id: number | 'nova'; initial: Draft }) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const noteId = id === 'nova' ? undefined : id;

  const saveNote = useSaveNote();
  const togglePin = useToggleNotePin();
  const toggleDone = useToggleNoteDone();
  const deleteNote = useDeleteNote();
  const sheet = useRef<SheetRef>(null);

  const [draft, setDraft] = useState<Draft>(initial);
  // The last saved state, so only real changes are written.
  const [baseline, setBaseline] = useState<Draft>(initial);
  const [error, setError] = useState<string | null>(null);
  // The note's id once it exists (a new note gets one on its first save).
  const savedId = useRef<number | undefined>(noteId);
  const deleted = useRef(false);

  const dirty = !same(draft, baseline);
  const update = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  /** Writes whatever changed since the last save. Throws when the note would end up empty. */
  const persist = async (): Promise<void> => {
    if (same(draft, baseline)) return;

    const title = draft.title.trim();
    const body = draft.body.trim();
    if (!title && !body) {
      if (savedId.current === undefined) {
        setBaseline(draft); // a new empty note is simply not kept
        return;
      }
      throw new Error('Escreva alguma coisa na nota ou apague a nota.');
    }

    let target = savedId.current;
    const contentChanged =
      draft.title !== baseline.title || draft.body !== baseline.body || draft.remindAt !== baseline.remindAt;
    if (contentChanged || target === undefined) {
      target = await saveNote.mutateAsync({
        input: { title: draft.title, body: draft.body, remindAt: draft.remindAt },
        id: savedId.current,
      });
      savedId.current = target;
    }
    if (draft.pinned !== baseline.pinned) await togglePin.mutateAsync(target);
    if (draft.done !== baseline.done) await toggleDone.mutateAsync({ id: target, done: draft.done });
    setBaseline(draft);
  };

  // Unsaved changes block leaving. On the way out, save, then let the blocked action through.
  const release = useRef<() => void>(() => {});
  const disablePrevention = usePreventRemove(dirty, ({ repeat }) => {
    if (deleted.current) {
      release.current();
      repeat();
      return;
    }
    persist()
      .then(() => {
        release.current();
        repeat();
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : errorMessage(err)));
  });
  useEffect(() => {
    release.current = disablePrevention;
  });

  const confirmDelete = () => {
    if (savedId.current === undefined) {
      deleted.current = true;
      router.back();
      return;
    }
    Alert.alert('Apagar nota', 'A nota e o lembrete dela saem do app. Não dá para desfazer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Apagar',
        style: 'destructive',
        onPress: () => {
          deleted.current = true;
          deleteNote.mutate(savedId.current!, {
            onSuccess: () => router.back(),
            onError: () => {
              deleted.current = false;
              setError('Não foi possível apagar a nota. Tente de novo.');
            },
          });
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView behavior="height" className="flex-1 bg-background">
      <ModalHeader />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-5 pb-8 pt-2">
        <TextInput
          value={draft.title}
          onChangeText={(title) => update({ title })}
          placeholder="Título"
          placeholderTextColor={colors.mutedForeground}
          maxLength={120}
          returnKeyType="next"
          className="font-display text-3xl text-foreground"
          accessibilityLabel="Título da nota"
        />

        <View className="flex-row flex-wrap items-center gap-2">
          {draft.done && <Pill label="Concluída" tone="income" />}
          {draft.pinned && <Pill label="Fixada" tone="accent" />}
          {draft.remindAt && (
            <Pressable
              onPress={() => sheet.current?.present()}
              accessibilityRole="button"
              accessibilityLabel="Alterar lembrete">
              <ReminderChip remindAt={draft.remindAt} />
            </Pressable>
          )}
        </View>

        <TextInput
          value={draft.body}
          onChangeText={(body) => update({ body })}
          placeholder="Escreva aqui"
          placeholderTextColor={colors.mutedForeground}
          multiline
          textAlignVertical="top"
          maxLength={5000}
          className="min-h-[260px] font-sans text-base leading-6 text-foreground"
          accessibilityLabel="Corpo da nota"
        />

        <ErrorNote message={error} />
      </ScrollView>

      <View
        className="flex-row items-center justify-around border-t-hairline border-border px-5 pt-3"
        style={{ paddingBottom: insets.bottom + 10 }}>
        <ToolButton
          label={draft.pinned ? 'Desafixar nota' : 'Fixar nota'}
          active={draft.pinned}
          onPress={() => update({ pinned: !draft.pinned })}>
          <Pin size={20} color={draft.pinned ? colors.accent : colors.foreground} strokeWidth={1.9} />
        </ToolButton>
        <ToolButton
          label={draft.remindAt ? 'Alterar lembrete' : 'Definir lembrete'}
          active={draft.remindAt !== null}
          onPress={() => sheet.current?.present()}>
          <Bell size={20} color={draft.remindAt ? colors.accent : colors.foreground} strokeWidth={1.9} />
        </ToolButton>
        <ToolButton
          label={draft.done ? 'Reabrir nota' : 'Concluir nota'}
          active={draft.done}
          onPress={() => update({ done: !draft.done })}>
          <CircleCheck size={20} color={draft.done ? colors.income : colors.foreground} strokeWidth={1.9} />
        </ToolButton>
        <ToolButton label="Apagar nota" onPress={confirmDelete}>
          <Trash2 size={20} color={colors.expense} strokeWidth={1.9} />
        </ToolButton>
      </View>

      <ReminderSheet sheetRef={sheet} current={draft.remindAt} onPick={(remindAt) => update({ remindAt })} />
    </KeyboardAvoidingView>
  );
}

function ToolButton({
  label,
  active = false,
  onPress,
  children,
}: {
  label: string;
  active?: boolean;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      className={cn('h-14 w-14 items-center justify-center rounded-full active:opacity-70', active ? 'bg-secondary' : 'bg-muted')}>
      {children}
    </Pressable>
  );
}
