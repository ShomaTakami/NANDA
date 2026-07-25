import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDatabase } from '@/contexts/DatabaseContext';
import { deleteMemory, getMemoryById } from '@/db/memoryRepository';
import { ensureHttpUrl, formatDateTime } from '@/lib/format';
import { deleteLocalImage } from '@/lib/images';
import type { MemoryItem } from '@/types/memory';

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatabase();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [item, setItem] = useState<MemoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id) {
      setError('項目が見つかりません');
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const memory = await getMemoryById(db, id);
      if (!memory) {
        setError('項目が見つかりません');
        setItem(null);
      } else {
        setItem(memory);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '詳細の取得に失敗しました';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void load();
    }, [load])
  );

  const handleOpenUrl = async () => {
    if (!item?.url) {
      return;
    }

    const target = ensureHttpUrl(item.url);
    try {
      const canOpen = await Linking.canOpenURL(target);
      if (!canOpen) {
        Alert.alert('エラー', 'このURLを開けませんでした');
        return;
      }
      await Linking.openURL(target);
    } catch {
      Alert.alert('エラー', '外部ブラウザを開けませんでした');
    }
  };

  const handleDelete = () => {
    if (!item || deleting) {
      return;
    }

    Alert.alert(
      '削除の確認',
      `「${item.name}」を削除しますか？この操作は取り消せません。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除する',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                setDeleting(true);
                const deleted = await deleteMemory(db, item.id);
                if (deleted?.imageUri) {
                  await deleteLocalImage(deleted.imageUri);
                }
                router.replace('/');
              } catch (err) {
                const message = err instanceof Error ? err.message : '削除に失敗しました';
                Alert.alert('エラー', message);
              } finally {
                setDeleting(false);
              }
            })();
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <ActivityIndicator color={palette.tint} />
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={[styles.center, { backgroundColor: palette.background }]}>
        <Text style={[styles.error, { color: palette.danger }]}>
          {error ?? '項目が見つかりません'}
        </Text>
        <Pressable onPress={() => router.back()} style={styles.backLink}>
          <Text style={{ color: palette.tint, fontWeight: '700' }}>戻る</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: palette.background }}
      contentContainerStyle={styles.content}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.image} />
      ) : (
        <View
          style={[
            styles.imageFallback,
            { backgroundColor: palette.imagePlaceholder, borderColor: palette.border },
          ]}
        >
          <Text style={{ color: palette.textSecondary, fontWeight: '600' }}>画像なし</Text>
        </View>
      )}

      <Text style={[styles.name, { color: palette.text }]}>{item.name}</Text>

      {item.category ? (
        <Text style={[styles.category, { color: palette.tint }]}>{item.category}</Text>
      ) : (
        <Text style={[styles.muted, { color: palette.textSecondary }]}>カテゴリ未設定</Text>
      )}

      <Section title="メモ" palette={palette}>
        <Text style={[styles.body, { color: palette.text }]}>
          {item.memo?.trim() || '未入力'}
        </Text>
      </Section>

      <Section title="タグ" palette={palette}>
        {item.tags.length > 0 ? (
          <View style={styles.tags}>
            {item.tags.map((tag) => (
              <View
                key={tag}
                style={[styles.tag, { backgroundColor: palette.chip }]}
              >
                <Text style={{ color: palette.text, fontSize: 13 }}>#{tag}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.body, { color: palette.text }]}>未設定</Text>
        )}
      </Section>

      <Section title="URL" palette={palette}>
        {item.url ? (
          <Pressable onPress={handleOpenUrl}>
            <Text style={[styles.link, { color: palette.tint }]}>{item.url}</Text>
            <Text style={[styles.muted, { color: palette.textSecondary, marginTop: 4 }]}>
              タップして外部ブラウザで開く
            </Text>
          </Pressable>
        ) : (
          <Text style={[styles.body, { color: palette.text }]}>未設定</Text>
        )}
      </Section>

      <Section title="日時" palette={palette}>
        <Text style={[styles.body, { color: palette.text }]}>
          登録: {formatDateTime(item.createdAt)}
        </Text>
        <Text style={[styles.body, { color: palette.text, marginTop: 4 }]}>
          更新: {formatDateTime(item.updatedAt)}
        </Text>
      </Section>

      <View style={styles.actions}>
        <Pressable
          onPress={() => router.push(`/item/${item.id}/edit`)}
          style={[styles.primaryButton, { backgroundColor: palette.tint }]}
        >
          <Text style={[styles.primaryButtonText, { color: palette.fabText }]}>編集する</Text>
        </Pressable>
        <Pressable
          onPress={handleDelete}
          disabled={deleting}
          style={[styles.dangerButton, { borderColor: palette.danger }]}
        >
          {deleting ? (
            <ActivityIndicator color={palette.danger} />
          ) : (
            <Text style={{ color: palette.danger, fontWeight: '700' }}>削除する</Text>
          )}
        </Pressable>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  children,
  palette,
}: {
  title: string;
  children: ReactNode;
  palette: (typeof Colors)['light'];
}) {
  return (
    <View style={[styles.section, { borderTopColor: palette.border }]}>
      <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 14,
    marginBottom: 16,
  },
  imageFallback: {
    width: '100%',
    height: 120,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 6,
  },
  category: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  muted: {
    fontSize: 13,
  },
  section: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.4,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  link: {
    fontSize: 15,
    fontWeight: '600',
  },
  actions: {
    marginTop: 28,
    gap: 10,
  },
  primaryButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  dangerButton: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  error: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
  backLink: {
    padding: 8,
  },
});
