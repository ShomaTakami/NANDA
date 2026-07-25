import { StyleSheet, Text, View } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';

type Props = {
  title: string;
  message: string;
};

export function EmptyState({ title, message }: Props) {
  const colorScheme = useColorScheme() ?? 'light';
  const palette = Colors[colorScheme];

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.textSecondary }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 28,
    paddingVertical: 48,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
});
