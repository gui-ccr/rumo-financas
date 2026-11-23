import { useLocalSearchParams } from 'expo-router';

import { NoteEditor } from '@/features/notes/presentation/note-editor';

/** /nota/nova creates a note; /nota/<id> edits the one with that id. */
export default function NoteRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <NoteEditor id={id === 'nova' ? 'nova' : Number(id)} />;
}
