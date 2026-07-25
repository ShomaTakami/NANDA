import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

import { CategoryChips } from '@/components/CategoryChips';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { normalizeOptionalText, parseTagInput } from '@/lib/format';
import { persistImage } from '@/lib/images';
import type { MemoryInput, MemoryItem } from '@/types/memory';

type Props = {
  initial?: MemoryItem | null;
  submitLabel: string;
  onSubmit: (input: MemoryInput) => Promise<void>;
  saving: boolean;
};

export function MemoryForm({ initial, submitLabel, onSubmit, saving }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  const [name, setName] = useState(initial?.name ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [memo, setMemo] = useState(initial?.memo ?? '');
  const [tagsText, setTagsText] = useState((initial?.tags ?? []).join(', '));
  const [url, setUrl] = useState(initial?.url ?? '');
  const [imageUri, setImageUri] = useState<string | null>(initial?.imageUri ?? null);
  const [showDetails, setShowDetails] = useState(
    Boolean(
      initial?.category ||
        initial?.memo ||
        (initial?.tags && initial.tags.length > 0) ||
        initial?.imageUri ||
        initial?.url
    )
  );
  const [error, setError] = useState<string | null>(null);
  const [pickingImage, setPickingImage] = useState(false);

  const canSave = name.trim().length > 0 && !saving;

  const handlePickImage = async () => {
    try {
      setPickingImage(true);
      setError(null);

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('写真ライブラリへのアクセスが許可されていません');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (result.canceled || !result.assets[0]?.uri) {
        return;
      }

      const persisted = await persistImage(result.assets[0].uri);
      setImageUri(persisted);
      setShowDetails(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '画像の選択に失敗しました';
      setError(message);
    } finally {
      setPickingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!canSave) {
      return;
    }

    try {
      setError(null);
      await onSubmit({
        name,
        category: normalizeOptionalText(category),
        memo: normalizeOptionalText(memo),
        tags: parseTagInput(tagsText),
        imageUri,
        url: normalizeOptionalText(url),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存に失敗しました';
      setError(message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.text }]}>名前 *</Text>
      <TextInput
        value={name}
        onChangeText={setName}
        placeholder="例: Issey Miyake / 代官山 T-SITE"
        placeholderTextColor={palette.placeholder}
        style={[
          styles.input,
          styles.nameInput,
          { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border },
        ]}
        autoFocus={!initial}
        returnKeyType="done"
        onSubmitEditing={handleSubmit}
      />
      <Text style={[styles.hint, { color: palette.textSecondary }]}>
        名前だけでも保存できます
      </Text>

      <Pressable onPress={() => setShowDetails((prev) => !prev)} style={styles.detailsToggle}>
        <Text style={{ color: palette.tint, fontWeight: '700', fontSize: 14 }}>
          {showDetails ? '詳細を閉じる' : '詳細を追加（カテゴリ・メモ・タグ・画像・URL）'}
        </Text>
      </Pressable>

      {showDetails ? (
        <View style={styles.details}>
          <Text style={[styles.label, { color: palette.text }]}>カテゴリ</Text>
          <CategoryChips value={category} onChange={setCategory} />
          <TextInput
            value={category}
            onChangeText={setCategory}
            placeholder="候補以外も入力できます"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border },
            ]}
          />

          <Text style={[styles.label, { color: palette.text }]}>メモ</Text>
          <TextInput
            value={memo}
            onChangeText={setMemo}
            placeholder="特徴や思い出したきっかけなど"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              styles.multiline,
              { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            multiline
            textAlignVertical="top"
          />

          <Text style={[styles.label, { color: palette.text }]}>タグ</Text>
          <TextInput
            value={tagsText}
            onChangeText={setTagsText}
            placeholder="例: 渋谷, 白い建物, 気になる"
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            autoCapitalize="none"
          />
          <Text style={[styles.hint, { color: palette.textSecondary }]}>
            カンマまたはスペース区切りで複数入力できます
          </Text>

          <Text style={[styles.label, { color: palette.text }]}>URL</Text>
          <TextInput
            value={url}
            onChangeText={setUrl}
            placeholder="https://..."
            placeholderTextColor={palette.placeholder}
            style={[
              styles.input,
              { color: palette.text, backgroundColor: palette.surface, borderColor: palette.border },
            ]}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={[styles.label, { color: palette.text }]}>画像</Text>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.preview} />
          ) : (
            <View
              style={[
                styles.previewFallback,
                { backgroundColor: palette.imagePlaceholder, borderColor: palette.border },
              ]}
            >
              <Text style={{ color: palette.textSecondary }}>未選択</Text>
            </View>
          )}
          <View style={styles.imageActions}>
            <Pressable
              onPress={handlePickImage}
              disabled={pickingImage || saving}
              style={[styles.secondaryButton, { borderColor: palette.border }]}
            >
              {pickingImage ? (
                <ActivityIndicator color={palette.tint} />
              ) : (
                <Text style={{ color: palette.text, fontWeight: '600' }}>ライブラリから選択</Text>
              )}
            </Pressable>
            {imageUri ? (
              <Pressable
                onPress={() => setImageUri(null)}
                disabled={saving}
                style={[styles.secondaryButton, { borderColor: palette.border }]}
              >
                <Text style={{ color: palette.danger, fontWeight: '600' }}>画像を外す</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}

      {error ? <Text style={[styles.error, { color: palette.danger }]}>{error}</Text> : null}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSave}
        style={[
          styles.submit,
          {
            backgroundColor: canSave ? palette.tint : palette.border,
          },
        ]}
      >
        {saving ? (
          <ActivityIndicator color={palette.fabText} />
        ) : (
          <Text style={[styles.submitText, { color: canSave ? palette.fabText : palette.textSecondary }]}>
            {submitLabel}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
    paddingBottom: 40,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  nameInput: {
    fontSize: 18,
    fontWeight: '600',
  },
  multiline: {
    minHeight: 96,
  },
  hint: {
    fontSize: 12,
    lineHeight: 18,
  },
  detailsToggle: {
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 8,
  },
  details: {
    gap: 8,
  },
  preview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  previewFallback: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: 120,
    alignItems: 'center',
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
  },
  submit: {
    marginTop: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
