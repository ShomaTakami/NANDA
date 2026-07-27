import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { MemoryForm } from '@/components/MemoryForm';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDatabase } from '@/contexts/DatabaseContext';
import { deleteMemory, getMemoryById, updateMemory } from '@/db/memoryRepository';
import { ensureHttpUrl } from '@/lib/format';
import { deleteLocalImage } from '@/lib/images';
import type { MemoryInput, MemoryItem } from '@/types/memory';

export default function MemoryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatabase();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [item, setItem] = useState<MemoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleOpenUrl = async (rawUrl: string) => {
    const target = ensureHttpUrl(rawUrl);
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

  const handleSubmit = async (input: MemoryInput) => {
    if (!item || saving) {
      return;
    }

    try {
      setSaving(true);
      const previousImage = item.imageUri;
      const updated = await updateMemory(db, item.id, input);

      if (previousImage && previousImage !== input.imageUri) {
        await deleteLocalImage(previousImage);
      }

      setItem(updated);
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新に失敗しました';
      Alert.alert('エラー', message);
      throw err;
    } finally {
      setSaving(false);
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <MemoryForm
          key={item.id + item.updatedAt}
          variant="edit"
          initial={item}
          submitLabel="保存する"
          onSubmit={handleSubmit}
          saving={saving}
          onOpenUrl={handleOpenUrl}
          footer={
            <Pressable
              onPress={handleDelete}
              disabled={deleting || saving}
              style={[styles.dangerButton, { borderColor: palette.danger }]}
            >
              {deleting ? (
                <ActivityIndicator color={palette.danger} />
              ) : (
                <Text style={{ color: palette.danger, fontWeight: '700' }}>削除する</Text>
              )}
            </Pressable>
          }
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dangerButton: {
    marginTop: 10,
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
