import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { getDatabase } from '@/db/database';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type DatabaseContextValue = {
  db: SQLiteDatabase;
};

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

export function DatabaseProvider({ children }: { children: ReactNode }) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [db, setDb] = useState<SQLiteDatabase | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const database = await getDatabase();
        if (mounted) {
          setDb(database);
        }
      } catch (err) {
        if (mounted) {
          const message =
            err instanceof Error ? err.message : 'データベースの初期化に失敗しました';
          setError(message);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const value = useMemo(() => (db ? { db } : null), [db]);

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.title, { color: palette.text }]}>起動エラー</Text>
        <Text style={[styles.message, { color: palette.textSecondary }]}>{error}</Text>
      </View>
    );
  }

  if (!value) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator size="large" color={palette.tint} />
        <Text style={[styles.message, { color: palette.textSecondary, marginTop: 12 }]}>
          NANDA を準備しています…
        </Text>
      </View>
    );
  }

  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): SQLiteDatabase {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase は DatabaseProvider 内で使ってください');
  }
  return context.db;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
