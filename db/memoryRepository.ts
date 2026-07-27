import type { SQLiteDatabase } from 'expo-sqlite';

import {
  normalizeOptionalText,
  normalizeTags,
} from '@/lib/format';
import { createId } from '@/lib/id';
import type { MemoryInput, MemoryItem } from '@/types/memory';

type MemoryRow = {
  id: string;
  name: string;
  category: string | null;
  memo: string | null;
  tags: string;
  image_uri: string | null;
  url: string | null;
  created_at: string;
  updated_at: string;
};

function parseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function mapRow(row: MemoryRow): MemoryItem {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    memo: row.memo,
    tags: parseTags(row.tags),
    imageUri: row.image_uri,
    url: row.url,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function sanitizeInput(input: MemoryInput): {
  name: string;
  category: string | null;
  memo: string | null;
  tags: string[];
  imageUri: string | null;
  url: string | null;
} {
  const name = input.name.trim();
  if (!name) {
    throw new Error('名前を入力してください');
  }

  return {
    name,
    category: normalizeOptionalText(input.category),
    memo: normalizeOptionalText(input.memo),
    tags: normalizeTags(input.tags),
    imageUri: normalizeOptionalText(input.imageUri),
    url: normalizeOptionalText(input.url),
  };
}

export async function listMemories(
  db: SQLiteDatabase,
  query?: string
): Promise<MemoryItem[]> {
  const trimmed = query?.trim() ?? '';

  if (!trimmed) {
    const rows = await db.getAllAsync<MemoryRow>(
      `SELECT * FROM memories ORDER BY updated_at DESC, created_at DESC`
    );
    return rows.map(mapRow);
  }

  const pattern = `%${trimmed.toLowerCase()}%`;
  const rows = await db.getAllAsync<MemoryRow>(
    `
      SELECT * FROM memories
      WHERE
        lower(name) LIKE ?
        OR lower(IFNULL(category, '')) LIKE ?
        OR lower(IFNULL(memo, '')) LIKE ?
        OR lower(tags) LIKE ?
      ORDER BY updated_at DESC, created_at DESC
    `,
    pattern,
    pattern,
    pattern,
    pattern
  );

  return rows.map(mapRow);
}

export async function getMemoryById(
  db: SQLiteDatabase,
  id: string
): Promise<MemoryItem | null> {
  const row = await db.getFirstAsync<MemoryRow>(
    `SELECT * FROM memories WHERE id = ?`,
    id
  );
  return row ? mapRow(row) : null;
}

export async function createMemory(
  db: SQLiteDatabase,
  input: MemoryInput
): Promise<MemoryItem> {
  const data = sanitizeInput(input);
  const now = new Date().toISOString();
  const id = createId();

  await db.runAsync(
    `
      INSERT INTO memories (
        id, name, category, memo, tags, image_uri, url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    id,
    data.name,
    data.category,
    data.memo,
    JSON.stringify(data.tags),
    data.imageUri,
    data.url,
    now,
    now
  );

  const created = await getMemoryById(db, id);
  if (!created) {
    throw new Error('登録に失敗しました');
  }
  return created;
}

export async function updateMemory(
  db: SQLiteDatabase,
  id: string,
  input: MemoryInput
): Promise<MemoryItem> {
  const existing = await getMemoryById(db, id);
  if (!existing) {
    throw new Error('項目が見つかりません');
  }

  const data = sanitizeInput(input);
  const now = new Date().toISOString();

  await db.runAsync(
    `
      UPDATE memories
      SET
        name = ?,
        category = ?,
        memo = ?,
        tags = ?,
        image_uri = ?,
        url = ?,
        updated_at = ?
      WHERE id = ?
    `,
    data.name,
    data.category,
    data.memo,
    JSON.stringify(data.tags),
    data.imageUri,
    data.url,
    now,
    id
  );

  const updated = await getMemoryById(db, id);
  if (!updated) {
    throw new Error('更新に失敗しました');
  }
  return updated;
}

export async function deleteMemory(
  db: SQLiteDatabase,
  id: string
): Promise<MemoryItem | null> {
  const existing = await getMemoryById(db, id);
  if (!existing) {
    return null;
  }

  await db.runAsync(`DELETE FROM memories WHERE id = ?`, id);
  return existing;
}
