import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';

import { EmptyState } from '@/components/EmptyState';
import { MemoryListItem } from '@/components/MemoryListItem';
import { SearchBar } from '@/components/SearchBar';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDatabase } from '@/contexts/DatabaseContext';
import { listMemories } from '@/db/memoryRepository';
import type { MemoryItem } from '@/types/memory';

export default function HomeScreen() {
  const db = useDatabase();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [query, setQuery] = useState('');
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (search: string) => {
      try {
        setError(null);
        const rows = await listMemories(db, search);
        setItems(rows);
      } catch (err) {
        const message = err instanceof Error ? err.message : '一覧の取得に失敗しました';
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    [db]
  );

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load(query);
    }, [load, query])
  );

  return (
    <View style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.headerBlock}>
        <Text style={[styles.tagline, { color: palette.textSecondary }]}>
          なんだっけ？をなくす
        </Text>
        <SearchBar
          value={query}
          onChangeText={(value) => {
            setLoading(true);
            setQuery(value);
          }}
        />
      </View>

      {error ? (
        <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>
      ) : null}

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={palette.tint} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemoryListItem
              item={item}
              onPress={() => router.push(`/item/${item.id}`)}
            />
          )}
          ListEmptyComponent={
            query.trim() ? (
              <EmptyState
                title="見つかりませんでした"
                message="別のキーワードで試すか、特徴・タグを追加して検索しやすくしましょう。"
              />
            ) : (
              <EmptyState
                title="まだ何も登録されていません"
                message="気になったブランドや場所の名前を、その場でサッと残しましょう。"
              />
            )
          }
          contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
        />
      )}

      <Link href="/new" asChild>
        <Pressable
          style={[styles.fab, { backgroundColor: palette.fab }]}
          accessibilityRole="button"
          accessibilityLabel="新規登録"
        >
          <Text style={[styles.fabText, { color: palette.fabText }]}>+ 新規</Text>
        </Pressable>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlock: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 10,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
  },
  error: {
    paddingHorizontal: 16,
    marginBottom: 8,
    fontSize: 13,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyList: {
    flexGrow: 1,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 14,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: {
    fontSize: 16,
    fontWeight: '800',
  },
});
