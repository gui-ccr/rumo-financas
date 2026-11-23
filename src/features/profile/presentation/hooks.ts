import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { readProfile, removePhoto, storePhoto, writeName } from '../infrastructure/profile-store';

/** What the user decided about the photo in the edit screen. */
export type PhotoChange = { kind: 'keep' } | { kind: 'set'; sourceUri: string } | { kind: 'remove' };

export function useProfile() {
  return useQuery({ queryKey: ['profile'], queryFn: () => readProfile() });
}

/** Saves the name and applies the photo decision in one go. Only the profile query is refreshed. */
export function useSaveProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; photo: PhotoChange }) => {
      if (input.photo.kind === 'set') await storePhoto(input.photo.sourceUri);
      if (input.photo.kind === 'remove') removePhoto();
      writeName(input.name);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['profile'] }),
  });
}
