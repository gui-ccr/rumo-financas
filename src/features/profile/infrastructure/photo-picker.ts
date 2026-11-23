import * as ImagePicker from 'expo-image-picker';

export class PhotoPermissionError extends Error {}

/**
 * Opens the system gallery with a square crop and returns the picked image's URI,
 * or null when the user cancels. The URI points at a temporary file: copy it before keeping it.
 */
export async function pickProfilePhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new PhotoPermissionError('Permita o acesso às fotos nas configurações do celular.');

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  if (result.canceled) return null;
  return result.assets[0]?.uri ?? null;
}
