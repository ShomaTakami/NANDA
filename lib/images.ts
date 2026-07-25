import * as FileSystem from 'expo-file-system/legacy';

import { createId } from '@/lib/id';

const IMAGE_DIR = `${FileSystem.documentDirectory ?? ''}nanda-images/`;

async function ensureImageDir(): Promise<void> {
  if (!FileSystem.documentDirectory) {
    throw new Error('画像の保存先を利用できません');
  }

  const info = await FileSystem.getInfoAsync(IMAGE_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(IMAGE_DIR, { intermediates: true });
  }
}

function extensionFromUri(uri: string): string {
  const clean = uri.split('?')[0] ?? uri;
  const match = clean.match(/\.([a-zA-Z0-9]+)$/);
  if (!match) {
    return 'jpg';
  }
  return match[1].toLowerCase();
}

export async function persistImage(sourceUri: string): Promise<string> {
  await ensureImageDir();
  const ext = extensionFromUri(sourceUri);
  const destination = `${IMAGE_DIR}${createId()}.${ext}`;
  await FileSystem.copyAsync({ from: sourceUri, to: destination });
  return destination;
}

export async function deleteLocalImage(uri: string | null | undefined): Promise<void> {
  if (!uri || !FileSystem.documentDirectory) {
    return;
  }

  if (!uri.startsWith(FileSystem.documentDirectory)) {
    return;
  }

  try {
    const info = await FileSystem.getInfoAsync(uri);
    if (info.exists) {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    }
  } catch {
    // 画像削除失敗は致命的ではないため無視する
  }
}
