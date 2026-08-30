# デジタル栞

紙の本の「どこまで読んだか忘れる」を解決するデジタル本棚Webアプリ。

---

## 技術スタック

| 役割 | 技術 |
|------|------|
| フロントエンド | Next.js 15 (App Router) + TypeScript |
| スタイル | Tailwind CSS |
| 認証・DB | Supabase (Auth + PostgreSQL) |
| 書籍情報取得 | Google Books API |
| ホスティング | Vercel |

---

## ローカル開発セットアップ

### 1. リポジトリをクローン

```bash
git clone <repo-url>
cd デジタル栞/web
```

### 2. 依存パッケージをインストール

```bash
npm install
```

### 3. Supabase プロジェクトを作成

1. [https://supabase.com](https://supabase.com) でアカウントを作成（または既存アカウントでログイン）
2. 「New project」でプロジェクトを作成
3. 作成完了後、左サイドバーの **Settings > API** を開く
4. 以下の値を控えておく
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` に使用
   - **anon public** キー → `NEXT_PUBLIC_SUPABASE_ANON_KEY` に使用

### 4. データベーススキーマを適用

1. Supabase ダッシュボードの **SQL Editor** を開く
2. リポジトリ直下の [`supabase/schema.sql`](../supabase/schema.sql) の内容をまるごとコピーして貼り付け、「Run」をクリック

`books` テーブル・`reading_sessions` テーブル・RLS ポリシー・インデックスがすべて作成されます。

### 5. 環境変数を設定

```bash
cp .env.example .env.local
```

`.env.local` を開いて値を入力：

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 任意: 設定するとGoogle Books検索のレート制限を緩和できます
# GOOGLE_BOOKS_API_KEY=your-google-books-api-key-here
```

> **Google Books API キーの取得方法**  
> [Google Cloud Console](https://console.cloud.google.com/) で「Books API」を有効化し、
> 「認証情報」からAPIキーを作成してください。無料枠で十分に使用できます。

### 6. 開発サーバーを起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開くと、ログイン画面にリダイレクトされます。

---

## Vercel へのデプロイ

### 1. GitHub にリポジトリをプッシュ

```bash
git add .
git commit -m "initial commit"
git push origin master
```

### 2. Vercel でインポート

1. [https://vercel.com](https://vercel.com) にログインし「Add New... > Project」
2. GitHub リポジトリを選択して「Import」
3. **Environment Variables** セクションで以下を追加：

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase の Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase の anon public キー |
| `GOOGLE_BOOKS_API_KEY` | Google Books API キー（任意） |

4. 「Deploy」をクリック

### 3. Supabase に本番 URL を登録

デプロイ完了後、Supabase ダッシュボードの **Authentication > URL Configuration** を開いて以下を設定：

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: `https://your-app.vercel.app/**`

これでメール認証のリダイレクトが正しく機能します。

### ローカルビルド確認

```bash
npm run build
npm run start
```

---

## プロジェクト構成

```
web/
├── app/
│   ├── layout.tsx              # ルートレイアウト・メタデータ
│   ├── page.tsx                # ルート（未ログイン→LP、ログイン済み→/shelf）
│   ├── globals.css             # グローバルスタイル・カラートークン（ダークモード対応）
│   ├── error.tsx               # グローバルエラーバウンダリ
│   ├── not-found.tsx           # 404 ページ
│   ├── auth/                   # ログイン・サインアップ画面
│   ├── shelf/                  # 本棚（ホーム）画面
│   ├── books/
│   │   ├── add/                # 書籍追加・検索
│   │   └── [id]/                # 書籍詳細・読書タイマー
│   ├── stats/                  # 統計画面
│   ├── account/                 # アカウント設定・氏名変更・パスワード変更
│   ├── delete-account/          # アカウント削除フロー
│   ├── privacy/                 # プライバシーポリシー
│   └── api/books/                # サーバーサイド API ルート
├── components/
│   ├── books/                  # 書籍関連コンポーネント
│   ├── account/                 # アカウント関連コンポーネント
│   ├── auth/                    # ログイン・サインアップフォーム
│   ├── landing/                  # LP（ランディングページ）
│   ├── pro/                     # Pro プラン（RevenueCat）関連
│   ├── providers/                # 認証・サブスクリプション状態の Context
│   ├── stats/                    # 統計画面コンポーネント
│   └── ui/                     # 共通 UI（BottomNav・星評価など）
├── lib/
│   ├── supabase/               # Supabase クライアント（client / server / admin / types）
│   ├── google-books.ts         # Google Books API パーサー
│   ├── limits.ts                 # Free / Pro プランの利用上限
│   └── utils.ts                # 時間・色などユーティリティ
├── middleware.ts                # 認証リダイレクト
├── .env.example                # 環境変数テンプレート
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

DB スキーマ（`supabase/schema.sql`）は mobile と共通のため、リポジトリ直下に配置しています。

---

## 実装フェーズ

| Phase | 内容 | 状態 |
|-------|------|------|
| 1 | プロジェクトセットアップ（Next.js + Supabase + Tailwind） | **完了** |
| 2 | 認証機能（サインアップ・ログイン・ログアウト） | **完了** |
| 3 | 書籍検索・登録（Google Books API 連携） | **完了** |
| 4 | 本棚 UI・書籍詳細画面 | **完了** |
| 5 | 読書時間計測・進捗記録 | **完了** |
| 6 | ステータス管理・統計画面 | **完了** |
| 7 | UI 仕上げ・ダークモード・Vercel デプロイ | **完了** |
