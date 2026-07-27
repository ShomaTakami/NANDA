import * as SQLite from 'expo-sqlite';

const DATABASE_NAME = 'nanda.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS memories (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      memo TEXT,
      tags TEXT NOT NULL DEFAULT '[]',
      image_uri TEXT,
      url TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_memories_updated_at ON memories(updated_at);
    CREATE INDEX IF NOT EXISTS idx_memories_name ON memories(name);
  `);
}

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
      await migrate(db);
      return db;
    })();
  }

  try {
    return await dbPromise;
  } catch (error) {
    dbPromise = null;
    throw error;
  }
}
