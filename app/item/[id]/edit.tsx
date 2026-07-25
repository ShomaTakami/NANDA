import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import { getMemoryById, updateMemory } from '@/db/memoryRepository';
import { deleteLocalImage } from '@/lib/images';
import type { MemoryInput, MemoryItem } from '@/types/memory';

export default function EditMemoryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useDatabase();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [item, setItem] = useState<MemoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
      const message = err instanceof Error ? err.message : '読み込みに失敗しました';
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

  const handleSubmit = async (input: MemoryInput) => {
    if (!item || saving) {
      return;
    }

    try {
      setSaving(true);
      const previousImage = item.imageUri;
      await updateMemory(db, item.id, input);

      if (previousImage && previousImage !== input.imageUri) {
        await deleteLocalImage(previousImage);
      }

      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新に失敗しました';
      Alert.alert('エラー', message);
      throw err;
    } finally {
      setSaving(false);
    }
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
        <Text style={{ color: palette.danger, marginBottom: 12 }}>
          {error ?? '項目が見つかりません'}
        </Text>
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
          initial={item}
          submitLabel="変更を保存"
          onSubmit={handleSubmit}
          saving={saving}
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
});
