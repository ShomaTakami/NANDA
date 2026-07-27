# NANDA

「なんだっけ？」をなくす、自分専用の記憶データベースです。

ブランド、商品、人物、建築家、建物、場所、店舗、本、作品などの固有名詞を、思い出したその場で素早く登録し、後から名前・特徴・カテゴリ・タグ・メモで引き出せます。

ポートフォリオ目的ではなく、日常利用を前提にしたローカル完結のモバイルアプリです。

## コンセプト

- 登録コストを最小化（名前だけでも保存できる）
- 後からすぐ探せる（部分一致検索）
- 後から整理できる（詳細は後編集）
- 機能を増やしすぎない（まずは端末内で完結）

## 使用技術

- React Native
- Expo (SDK 56)
- TypeScript
- Expo Router
- SQLite (`expo-sqlite`)
- 画像選択: `expo-image-picker`
- 画像ファイル管理: `expo-file-system`
- 主対象: Android（iOS も妨げない構成）

## セットアップ方法

前提:

- Node.js 20 以上推奨
- Android 実機またはエミュレーター
- Expo Go、または development build

```bash
npm install
```

## 起動方法

```bash
# 開発サーバー起動
npm start

# Android を直接起動
npm run android
```

Expo の QR コードを Expo Go で読み取っても起動できます。

## ディレクトリ構成

```text
app/                     # 画面（Expo Router）
  index.tsx              # 一覧・検索
  new.tsx                # 新規登録
  item/[id]/index.tsx    # 詳細（この画面で直接編集）
components/              # UI コンポーネント
constants/               # カテゴリ候補・カラー
contexts/                # DB 初期化コンテキスト
db/                      # SQLite 初期化・リポジトリ
lib/                     # ID / 整形 / 画像ユーティリティ
types/                   # 型定義
assets/                  # アイコン等
```

## SQLite のデータ構造

データベース名: `nanda.db`

テーブル: `memories`

| カラム | 型 | 説明 |
| --- | --- | --- |
| id | TEXT PK | 一意 ID |
| name | TEXT NOT NULL | 名前 |
| category | TEXT | カテゴリ（任意） |
| memo | TEXT | メモ（任意） |
| tags | TEXT | タグ配列の JSON 文字列 |
| image_uri | TEXT | 端末内画像 URI（任意） |
| url | TEXT | 参照 URL（任意） |
| created_at | TEXT | 登録日時（ISO 8601） |
| updated_at | TEXT | 更新日時（ISO 8601） |

アプリ上の型:

```ts
type MemoryItem = {
  id: string;
  name: string;
  category: string | null;
  memo: string | null;
  tags: string[];
  imageUri: string | null;
  url: string | null;
  createdAt: string;
  updatedAt: string;
};
```

画像ファイル本体は SQLite に保存せず、`documentDirectory/nanda-images/` へコピーして URI を保持します。

## MVP で実装した機能

- 名前のみでの高速登録
- 任意項目（カテゴリ / メモ / タグ / 画像 / URL）
- 一覧表示（更新日時の新しい順）
- 名前・カテゴリ・メモ・タグの部分一致検索（大文字小文字を区別しない）
- 詳細表示（画面上で直接編集）
- 削除（確認ダイアログあり）
- 画像ライブラリからの選択
- URL を外部ブラウザで開く
- 空データ時の表示
- ローカル永続化（アプリ再起動後も保持）
- オフライン動作

## 現時点で実装していない機能

- ユーザー登録 / ログイン
- クラウド同期（Supabase / Firebase / 自前 API）
- 複数端末同期
- Web 版
- AI 自動分類 / OCR / 画像認識 / 音声入力
- SNS 共有・他ユーザー共有
- 想起クイズ / 通知 / 課金 / 広告
- 高度な分析機能
- カテゴリ管理専用画面
- カメラ撮影

## 今後の候補

- カテゴリの追加・並び替え UI
- タグの候補サジェスト
- バックアップ / エクスポート
- 任意のクラウド同期
- カメラ撮影対応
- ウィジェットや共有シートからの素早い登録

## 確認方法

1. `npm start` または `npm run android` で起動
2. 「+ 新規」から名前だけ保存できること
3. 一覧にすぐ反映されること
4. アプリを再起動しても残ること
5. 検索で名前 / カテゴリ / メモ / タグがヒットすること
6. 詳細画面で編集・削除ができること
7. 画像と URL を任意登録できること

## 型チェック

```bash
npx tsc --noEmit
```
