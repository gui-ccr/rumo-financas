import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { DomainError } from '@/shared/domain/errors';

import type { BackupFileGateway } from '../domain/backup';

export class ExpoBackupFileGateway implements BackupFileGateway {
  async share(fileName: string, contents: string) {
    const file = new File(Paths.cache, fileName);
    if (file.exists) file.delete();
    file.create();
    await file.write(contents);
    if (!(await Sharing.isAvailableAsync())) {
      throw new DomainError('Este aparelho não permite compartilhar arquivos.');
    }
    await Sharing.shareAsync(file.uri, { mimeType: 'application/json', dialogTitle: 'Salvar backup' });
  }

  async pick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain', '*/*'],
      copyToCacheDirectory: true,
    });
    if (result.canceled) return null;
    return new File(result.assets[0].uri).text();
  }
}
