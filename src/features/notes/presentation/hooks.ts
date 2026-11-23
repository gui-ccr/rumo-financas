import { useQuery } from '@tanstack/react-query';

import { useContainer } from '@/core/container-context';
import { useCommand } from '@/shared/presentation/use-command';

import type { NoteInput } from '../application/schemas';

/** A note change shows in the notes list and in the agenda (its reminder is an agenda item). */
const NOTE_KEYS = [['notes'], ['agenda']];

export function useNotes(search = '') {
  const { repos } = useContainer();
  return useQuery({ queryKey: ['notes', 'list', search.trim()], queryFn: () => repos.notes.list(search) });
}

export function useNote(id: number | undefined) {
  const { repos } = useContainer();
  return useQuery({
    queryKey: ['notes', 'note', id],
    queryFn: () => repos.notes.findById(id!),
    enabled: id !== undefined,
  });
}

export function useSaveNote() {
  const { useCases } = useContainer();
  return useCommand((a: { input: NoteInput; id?: number }) => useCases.saveNote.execute(a.input, a.id), {
    keys: NOTE_KEYS,
  });
}

export function useDeleteNote() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.deleteNote.execute(id), { keys: NOTE_KEYS });
}

export function useToggleNoteDone() {
  const { useCases } = useContainer();
  return useCommand((a: { id: number; done?: boolean }) => useCases.toggleNoteDone.execute(a.id, a.done), {
    keys: NOTE_KEYS,
  });
}

export function useToggleNotePin() {
  const { useCases } = useContainer();
  return useCommand((id: number) => useCases.toggleNotePin.execute(id), { keys: NOTE_KEYS });
}
