import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { truncate } from '@/lib/format';
import type { MemoryItem } from '@/types/memory';

type Props = {
  item: MemoryItem;
  onPress: () => void;
};

function buildSubtitle(item: MemoryItem): string | null {
  if (item.memo?.trim()) {
    return truncate(item.memo.trim(), 48);
  }
  if (item.tags.length > 0) {
    return item.tags.slice(0, 3).map((tag) => `#${tag}`).join(' ');
  }
  return null;
}

export function MemoryListItem({ item, onPress }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];
  const subtitle = buildSubtitle(item);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        {
          backgroundColor: palette.surface,
          borderBottomColor: palette.border,
          opacity: pressed ? 0.72 : 1,
        },
      ]}
    >
      {item.imageUri ? (
        <Image source={{ uri: item.imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imageFallback, { backgroundColor: palette.imagePlaceholder }]}>
          <Text style={[styles.fallbackText, { color: palette.textSecondary }]}>
            {(item.name.trim().charAt(0) || '?').toUpperCase()}
          </Text>
        </View>
      )}

      <View style={styles.content}>
        <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
          {item.name}
        </Text>
        {item.category ? (
          <Text style={[styles.category, { color: palette.tint }]} numberOfLines={1}>
            {item.category}
          </Text>
        ) : null}
        {subtitle ? (
          <Text style={[styles.subtitle, { color: palette.textSecondary }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  image: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  imageFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});
