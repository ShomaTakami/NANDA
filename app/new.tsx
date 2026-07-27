import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { MemoryForm } from '@/components/MemoryForm';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { useDatabase } from '@/contexts/DatabaseContext';
import { createMemory } from '@/db/memoryRepository';
import type { MemoryInput } from '@/types/memory';

export default function NewMemoryScreen() {
  const db = useDatabase();
  const router = useRouter();
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (input: MemoryInput) => {
    if (saving) {
      return;
    }

    try {
      setSaving(true);
      await createMemory(db, input);
      router.back();
    } catch (err) {
      const message = err instanceof Error ? err.message : '登録に失敗しました';
      Alert.alert('エラー', message);
      throw err;
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: palette.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <MemoryForm
          submitLabel="保存する"
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
});
