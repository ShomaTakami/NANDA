import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * 旧・編集画面への互換ルート。
 * 詳細画面で直接編集するため、ここへ来ても詳細へ戻す。
 */
export default function EditMemoryRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={id ? `/item/${id}` : '/'} />;
}
