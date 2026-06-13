# Claude Code 実装指示書

このドキュメントは、デジタル栞Webアプリを Claude Code で実装するための指示書です。
最初のプロンプトとしてそのまま Claude Code に渡せる構成になっています。

---

## 🚀 Claude Code への初回プロンプト（ここをコピペして使う）

```
デジタル栞Webアプリを作成してください。

## プロジェクト概要
紙の本の「どこまで読んだか忘れる」問題を解決するWebアプリ。書籍情報をAPIから自動取得し、
デジタル本棚として管理できる。ユーザーごとに蔵書・読書進捗・読書時間を記録する。
モバイルファーストで設計し、将来的にスマホアプリへの展開も視野に入れる。

## 技術スタック（厳守）
- フロント: Next.js 14+ (App Router) + TypeScript
- スタイル: Tailwind CSS
- 認証・DB: Supabase (Auth + PostgreSQL + Storage)
- 外部API: Google Books API（APIキー不要）
- ホスティング想定: Vercel

## 機能要件

### 認証
- Supabase Authでメールアドレス＋パスワード認証
- サインアップ / ログイン / ログアウト
- 未ログイン時は認証画面にリダイレクト
- Row Level Security (RLS) で自分のデータのみ閲覧・編集可能にする

### 書籍登録
- タイトルで検索 → Google Books APIから候補取得
- 候補から選択で、表紙・著者・総ページ数・ISBN・概要を自動登録
- APIで見つからない場合は手動入力フォームに切り替え
- 登録後も情報編集可能

### 本棚（ホーム画面）
- 登録書籍を表紙画像のグリッドで表示
- ステータスでフィルタ可能（読書中 / 読了 / 積読）
- ソート可能（登録日順 / 更新日順 / タイトル順）
- 本をタップすると詳細ページへ

### 書籍詳細
- 表紙、タイトル、著者、概要を表示
- 現在ページ数を入力・更新
- 進捗率（%）とプログレスバー表示
- 残りページ数表示
- 「読書開始」ボタン → タイマー画面へ
- ステータス変更ボタン（読書中 / 読了 / 積読）
- この本の累計読書時間を表示
- 読書セッション履歴を表示
- 読了予測時間を表示（セッション記録がある場合のみ）

### 読書中画面
- 「読書開始」タップでタイマー開始
- 経過時間を表示
- 「読書終了」タップで停止 → 終了時のページ数を入力 → セッション記録を保存
- 本の current_page を終了時ページに更新

### ステータス管理
- 3ステータス: reading / finished / to_read
- 積読 → 読書中 に変わったとき started_at を自動記録
- 読書中 → 読了 に変わったとき finished_at を自動記録

### 統計画面
- 全書籍の累計読書時間を表示
- 読了冊数を表示
- 現在読書中の本の冊数を表示

## データモデル

### books テーブル
- id: uuid (PK)
- user_id: uuid (FK, auth.users.id)
- title: text
- author: text
- cover_url: text (nullable)
- total_pages: int
- current_page: int (default 0)
- status: text ('reading' | 'finished' | 'to_read', default 'to_read')
- isbn: text (nullable)
- description: text (nullable)
- started_at: timestamptz (nullable)
- finished_at: timestamptz (nullable)
- created_at: timestamptz (default now())
- updated_at: timestamptz (default now())

### reading_sessions テーブル
- id: uuid (PK)
- book_id: uuid (FK, books.id, on delete cascade)
- user_id: uuid (FK, auth.users.id)
- started_at: timestamptz
- ended_at: timestamptz
- start_page: int
- end_page: int
- duration_seconds: int
- created_at: timestamptz (default now())

両テーブルに RLS を設定し、user_id = auth.uid() のレコードのみアクセス可能にする。

## UI/UX要件
- モバイルファースト（スマホでの操作を最優先）
- レスポンシブ対応（PCでも快適に使える）
- タップしやすいボタンサイズ
- 本棚は表紙画像を活かしたビジュアル重視のデザイン
- 温かみのある落ち着いた配色（読書体験に合う雰囲気）

## 読了予測の計算式
```
ページあたり秒数 = この本の累計読書時間秒 ÷ 読んだページ数
残り秒数 = ページあたり秒数 × 残りページ数
```
読書セッションが1件もない場合は表示しない。

## 最初にやってほしいこと（Phase 1）
いきなり全機能を実装せず、以下の順で進めてください。各フェーズ完了ごとに確認します。

### Phase 1: プロジェクトセットアップ
1. Next.js プロジェクトを作成（App Router, TypeScript, Tailwind有効）
2. Supabase クライアントのセットアップ
3. 環境変数のテンプレート（.env.example）を作成
4. Supabase のスキーマ定義SQL（books, reading_sessions テーブル＋RLS）をファイルに出力
5. README.md に、Supabaseプロジェクト作成手順と環境変数設定手順、起動方法を記載

Phase 1 が完了したら、内容を報告してください。その後 Phase 2（認証）に進みます。
```

---

## 🎨 デザインファイルを使う上での注意点

`design_handoff_digital_shiori/` フォルダ内のJSXファイルをデザイン参照として使う際に必ず守ってほしいこと。

### ファイルの役割分担

| ファイル | 扱い |
|---------|------|
| `shared-components.jsx` | デザイントークン（色・フォント・サイズ）とベースコンポーネントの定義。TypeScriptに変換して参照する |
| `screens-1-3.jsx` | 画面01〜03のレイアウト・デザイン参照。実装の視覚的なゴールとして使う |
| `screens-4-6.jsx` | 画面04〜06のレイアウト・デザイン参照。同上 |
| `screens-empty-states.jsx` | データ0件時の空状態デザイン参照。Phase 4〜6で実装時に参照する |
| `screens-improvements.jsx` | **実装対象ではない**。タイポグラフィ改善案・ローディング・タップ状態・画面遷移のデザイン仕様書として読む。`ScreenTypoLogin`・`ScreenSkeleton`・`ScreenTapStates`・`ScreenTransitions`などは参考資料 |

### コードを使うときの変換ルール

**① `.jsx` → `.tsx` に変換してTypeScriptの型を追加する**

デザインファイルはJSX（型なし）で書かれている。実装ではすべて`.tsx`に変換し、propsに型定義を追加すること。

```tsx
// デザインファイル（型なし）
function BookCover({ title, author, publisher, color, width, height, fontSize }) { ... }

// 実装（型あり）
type BookCoverProps = {
  title: string;
  author: string;
  publisher: string;
  color: string;
  width?: number;
  height?: number;
  fontSize?: number;
};
function BookCover({ title, author, publisher, color, width = 88, height = 130, fontSize = 12 }: BookCoverProps) { ... }
```

**② モックデータはSupabaseのクエリに置き換える**

`screens-1-3.jsx`冒頭の`books`・`toread`配列はデザイン確認用のハードコードデータ。実装ではSupabaseから取得したデータを使うこと。

```tsx
// デザインファイル（ハードコード）
const books = [
  { title:'罪と罰', author:'DOSTOEVSKY', ... },
];

// 実装（Supabaseから取得）
const { data: books } = await supabase
  .from('books')
  .select('*')
  .eq('user_id', user.id)
  .eq('status', 'reading');
```

**③ `readOnly`のinputは実際のstateに置き換える**

`screens-1-3.jsx`のLogin画面のinputが`readOnly value="haru@example.com"`になっているのはデザイン確認用。実装では`useState`で管理すること。

**④ デザイントークン（`DS`オブジェクト）をTailwindの設定に反映する**

`shared-components.jsx`の`DS`オブジェクトの色定義をそのまま`tailwind.config.ts`のカスタムカラーとして登録すること。

```ts
// tailwind.config.ts
colors: {
  paper:  '#F7F5EF',
  bg:     '#F0ECE2',
  ink:    '#0A0A0A',
  ink2:   '#2A2A2A',
  muted:  '#6E6B65',
  muted2: '#9A968F',
  line:   '#E3DFD6',
  line2:  '#EFEBE2',
}
```

### インタラクション仕様（`screens-improvements.jsx`から抜粋）

| 要素 | 仕様 |
|------|------|
| プライマリボタン（押下時） | `scale(0.98)` + `opacity: 0.82` |
| プライマリボタン（ローディング時） | ドット3つのインジケーター（`background: ink2`） |
| 書影カード（押下時） | `scale(0.95)` + `opacity: 0.85` |
| 画面遷移：本棚→書籍詳細 | 右へスライドイン（戻るは左スワイプ or ←ボタン） |
| 画面遷移：書籍詳細→タイマー | フェードイン（ライト→ダーク） |
| 画面遷移：タイマー終了後 | セッション結果モーダル表示 → 書籍詳細に戻る |

---

## 📋 Claude Codeへの依頼の流れ（段階的に進める）

### Phase 1: プロジェクトセットアップ
上記プロンプトで開始。Supabaseのスキーマ・環境変数・READMEまで整える。

**この段階で手動でやること:**
- Supabase でプロジェクト作成
- Google Books API は APIキー不要なので作業なし
- `.env.local` に Supabase のURL・anon keyを記載
- Supabase のSQL Editorで、Claude Codeが出力したスキーマSQLを実行

### Phase 2: 認証機能
```
Phase 2に進んでください。認証機能を実装してください。

- Supabase Auth でメール＋パスワード認証
- /signup, /login ページを作成
- ログイン済みユーザーのみホームにアクセスできるミドルウェア
- ログアウトボタン
- 認証状態をReact Contextで管理

UIはモバイルファーストで、シンプルで読書体験に合う温かみのあるデザインに。
```

### Phase 3: 書籍検索・登録
```
Phase 3に進んでください。書籍検索・登録機能を実装してください。

- /books/add ページにタイトル検索フォーム
- Google Books API (https://www.googleapis.com/books/v1/volumes?q=...) で検索
- 検索結果を表紙画像つきのカード一覧で表示
- 選択すると books テーブルに登録
- APIで見つからない場合の手動入力フォームも用意
```

### Phase 4: 本棚UI・詳細画面
```
Phase 4に進んでください。本棚と書籍詳細画面を実装してください。

- ホーム画面（/）に登録書籍を表紙グリッド表示
- ステータスフィルタ（読書中 / 読了 / 積読 / すべて）
- ソート機能（登録日順 / 更新日順 / タイトル順）
- 書籍カードをタップで /books/[id] 詳細ページへ
- 詳細ページで表紙・情報・進捗率・プログレスバーを表示
```

### Phase 5: 読書時間計測・進捗記録
```
Phase 5に進んでください。読書セッションとページ記録を実装してください。

- 詳細ページに「読書開始」ボタン
- /books/[id]/reading ページで経過時間表示、終了ボタン
- 終了時に終了ページを入力 → reading_sessions に記録 & books.current_page を更新
- 詳細ページにこの本の累計読書時間を表示
- 読書履歴をリスト表示
- 読了予測時間を計算して表示
```

### Phase 6: ステータス管理と統計
```
Phase 6に進んでください。

- ステータス変更ボタン（読書中 / 読了 / 積読）
- 積読→読書中で started_at を自動記録、読書中→読了で finished_at を自動記録
- /stats ページで全体の累計読書時間・読了冊数・読書中冊数を表示
```

### Phase 7: 仕上げ・デプロイ
```

```

---

## 💡 Claude Code を使うコツ

1. **一度に全部作らせない** - フェーズごとに区切って進める（このドキュメントの通り）
2. **各フェーズ後に動作確認** - 問題があれば次に進む前に解決
3. **Git commit をフェーズ単位で** - Phase 1完了時点、Phase 2完了時点…でコミット
4. **困ったら `/clear` で文脈リセット** - 長くなりすぎたら新しいセッションで作業再開
5. **設計変更は要件定義書を更新** - 途中で仕様を変えたら要件定義書も修正して、Claude Codeに再度渡す

---

## ⚠️ 事前準備チェックリスト

Claude Codeに投げる前にやっておくこと：

- [×] Node.js がインストール済み（v20以上推奨）
- [×] Supabase アカウント作成・プロジェクト作成済み
- [×] Supabase の Project URL と anon key を控えておく
- [×] GitHub アカウントがある（Vercelデプロイで使う）
- [×] VS Code に Claude Code 拡張機能インストール済み、もしくはターミナルで `claude` コマンドが使える
