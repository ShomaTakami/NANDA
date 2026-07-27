/**
 * 初期カテゴリ候補。
 * 固定マスタではなく候補リストなので、将来の追加・変更がしやすい。
 */
export const CATEGORY_SUGGESTIONS = [
  'ブランド',
  '商品',
  '人物',
  '建築',
  '場所',
  '店舗',
  '本',
  '映画・作品',
  'その他',
] as const;

export type CategorySuggestion = (typeof CATEGORY_SUGGESTIONS)[number];
