import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { CATEGORY_SUGGESTIONS } from '@/constants/categories';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export function CategoryChips({ value, onChange }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CATEGORY_SUGGESTIONS.map((category) => {
          const selected = value === category;
          return (
            <Pressable
              key={category}
              onPress={() => onChange(selected ? '' : category)}
              style={[
                styles.chip,
                {
                  backgroundColor: selected ? palette.chipSelected : palette.chip,
                },
              ]}
            >
              <Text
                style={{
                  color: selected ? palette.chipSelectedText : palette.text,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {category}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: 8,
    paddingVertical: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
});
