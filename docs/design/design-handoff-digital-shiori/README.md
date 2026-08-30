# Handoff: デジタル栞 — Full UI Design

## Overview

「デジタル栞」は、紙の本の進捗・読書時間・読了予測を静かに記録するモバイルWebアプリです。このハンドオフパッケージには、6つのコア画面＋空状態・インタラクション提案のデザイン参照ファイルが含まれています。

## About the Design Files

このパッケージ内の HTML ファイルは **デザイン参照用プロトタイプ** です。本番コードをそのまま流用するためのものではありません。開発者は、これらの HTML デザインを参照しながら、実際のコードベース（Next.js + TypeScript + Tailwind CSS）のパターンとライブラリを使って再実装してください。

**実装スタック（確定）:**
- Framework: Next.js (App Router) + TypeScript
- Styling: Tailwind CSS
- Auth / DB: Supabase
- 書籍情報: Google Books API
- Deploy: Vercel

## Fidelity

**High-fidelity（ピクセル精度）** — 本パッケージのモックアップは最終的な色・タイポグラフィ・余白・インタラクションを含む高精度なデザインです。開発者はこれらをピクセル精度で再現することを目標としてください（実際のデータ・APIレスポンスへの対応は除く）。

---

## Design Tokens

### カラーパレット

```
--color-ink:     #0A0A0A  /* 主要テキスト、ボタン背景、強調 */
--color-ink-2:   #2A2A2A  /* 見出し下レベル */
--color-muted:   #6E6B65  /* 副次テキスト */
--color-muted-2: #9A968F  /* キャプション、無効状態 */
--color-line:    #E3DFD6  /* 罫線、区切り、プログレス背景 */
--color-line-2:  #EFEBE2  /* 背景ブロック（カード等） */
--color-paper:   #F7F5EF  /* 画面背景（温かみのあるオフホワイト） */
--color-bg:      #F0ECE2  /* セカンダリ背景（ステータスカード等） */
```

**重要:** アクセントカラーは使用しない。UIは黒・グレー・紙色のグレースケールのみ。色は「書影（本の表紙）」だけから生まれる。

### Tailwind カスタムカラー（tailwind.config.ts に追記）

```ts
colors: {
  ink:     { DEFAULT: '#0A0A0A', 2: '#2A2A2A' },
  muted:   { DEFAULT: '#6E6B65', 2: '#9A968F' },
  line:    { DEFAULT: '#E3DFD6', 2: '#EFEBE2' },
  paper:   '#F7F5EF',
  bg:      '#F0ECE2',
}
```

### タイポグラフィ

| 役割 | Font Family | Weight | 主な用途 |
|------|------------|--------|---------|
| 欧文ディスプレイ・数字 | Cormorant Garamond | 300, 400 | 数字ヒーロー（進捗%・時間）、英語ラベル値 |
| 和文ディスプレイ | Shippori Mincho | 500, 600 | 書名、ページ見出し（本棚・手帖）、コピー |
| UI本文 | Zen Kaku Gothic New | 400, 500 | ボタン、補助テキスト、キャプション、ラベル |

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500&family=Shippori+Mincho:wght@400;500;600;700&family=Zen+Kaku+Gothic+New:wght@300;400;500;700&display=swap" rel="stylesheet"/>
```

**文字間隔ルール:**
- 英大文字ラベル（LIBRARY / ELAPSED 等）: `letter-spacing: 0.22em`
- 英字UIテキスト: `letter-spacing: 0.05–0.15em`
- ボタンテキスト: `letter-spacing: 0.25–0.30em`
- 和文本文: デフォルト

### スペーシング

```
画面左右余白:     28px (px-7 相当)
セクション間:     24–32px
カード内パディング: 16–20px
タッチターゲット最小: 44px height
```

### ボーダー・シャドウ

```
ボタン・カード角丸:   border-radius: 2px (rounded-sm)
モバイルシェル角丸:   border-radius: 48px (prototype用)
書影カード角丸:      border-radius: 2px
シャドウ（書影）:    box-shadow: 2px 2px 8px rgba(0,0,0,0.22)
```

### 書影カラーパレット（12色）

Google Books API から表紙画像が取得できない場合のフォールバック色（ISBNベースで決定論的に選択）:

```ts
const coverColors = [
  '#2B3A2E', // 森緑
  '#7C2B28', // 深紅
  '#1B2A3A', // 濃紺
  '#3D2B1A', // こげ茶
  '#2A2A2A', // 墨黒
  '#4A3728', // 焦げ茶
  '#1E3040', // 青墨
  '#3B2E4A', // 藤紫
  '#1A3530', // 深緑
  '#5C2E2E', // えんじ
  '#C8BFA8', // 枯れ草（明るめ）
  '#8B7355', // 薄茶
]
```

---

## Screens / Views

### Screen 01 — Log in / Sign up

**目的:** 認証画面。「書籍の扉ページ」のような静けさを演出。

**レイアウト:**
- 背景: `#F7F5EF`（paper）
- 上部: ロゴブロック（SVG書影アイコン + "Digital Bookmark" テキスト）、paddingTop: 36px
- 中央ゾーン（flex:1, justify-content: center）:
  - "WELCOME" ラベル（Zen Kaku Gothic, 10px, letter-spacing: 0.22em, color: muted-2）
  - 見出し「あなたの読書を、次のページへ。」（Shippori Mincho, 30px, weight:500, line-height:1.65, color: ink-2）
  - メールフィールド: ラベル（上記ルール）+ 入力値（Cormorant Garamond, 20px, border-bottom: 1px solid ink（アクティブ時）/ line（通常時））
  - パスワードフィールド: 同上（border-bottom: line）
  - margin-bottom between fields: 24px
  - LOG IN ボタン: width:100%, height:52px, bg:ink, color:paper, border-radius:2px, font:Zen Kaku Gothic 12px, letter-spacing:0.30em
  - 「はじめての方は 新規登録」: 12px Zen Kaku Gothic, center, color:muted, underline on リンク部分

**コンポーネント:**
- `<AuthForm>` — email/password input + submit button
- `<Logo>` — SVG bookmark icon + typeface

---

### Screen 02 — Bookshelf (Home)

**目的:** 登録書籍を書影グリッドで一覧表示。ステータスでセクション分け。

**レイアウト:**
- Header: paddingTop:16px, padding:0 28px
  - 上: "LIBRARY" ラベル + 右に検索アイコン（22px）+ アバターアイコン（32px circle, bg:ink, font:Cormorant 14px）
  - 下: 「本棚」（Shippori Mincho, 32px, weight:500）
- Filter tabs: padding: 16px 28px 0, gap:8px
  - Active tab: bg:ink, color:paper, border-radius:20px, padding:6px 12px
  - Inactive tab: border:1px solid line, color:muted, opacity: 1.0
  - カウント数字: Cormorant Garamond 12px
- Content（スクロール可能、padding:24px 28px 0）:
  - Section header: "READING" ラベル + "— 3"（Cormorant 13px, muted-2）右端に「最終更新順」（Zen Kaku 11px）
  - 書影グリッド: display:flex, gap:12px
  - 書影カード: width:104px, height:152px, border-radius:2px
  - プログレスバー: height:2px, bg:line-2（未達）/ ink（達成）、下に %（Cormorant 15px, ink-2）と p.XXX（Cormorant 13px, muted）を左右配置
  - Section間margin: 32px

**コンポーネント:**
- `<BookCard status="reading" progress={62} currentPage={284} />` — cover + progress bar + stats
- `<BookCard status="to_read" />` — cover only
- `<FilterTabs activeStatus="all" />` — すべて/読書中/積読/読了
- `<SectionHeader label="READING" count={3} sortLabel="最終更新順" />`
- Bottom nav: `<BottomNav active="library" />`

---

### Screen 03 — Book Detail

**目的:** 特定書籍の詳細情報・進捗・読書履歴。進捗%が主役。

**レイアウト:**
- Top bar: ← 戻る（22px） / "DETAIL" ラベル / ⋮ メニュー（22px）, padding:12px 28px
- 書影 + メタ情報（flex, gap:20px, padding: 0 28px）:
  - 書影: width:80px, height:116px
  - 右側: 著者（Zen Kaku 10px, letter-spacing:0.18em, muted-2）/ 書名（Shippori Mincho 26px, weight:600）/ 出版社・ページ数（Zen Kaku 11px, muted, line-height:1.9）
  - ステータスボタン群: 「読書中」（filled, bg:ink）/ 「読了にする」（outline）, padding:6px 14px, border-radius:2px, font:Zen Kaku 11px
- Progress hero card（bg:line-2, border-radius:2px, padding:20px, margin-bottom:16px）:
  - "PROGRESS" ラベル（左上）
  - 進捗数字: Cormorant Garamond **88px** weight:300, color:ink + "%" Cormorant 28px, muted
  - 右寄せ: 残りページ（Shippori Mincho 14px）+ 予測時間（Zen Kaku 11px, muted）
  - プログレスバー: height:2px, margin:14px 0 8px
  - バー下: p.1（muted-2）/ 現在 p.284（ink-2）/ p.456（muted-2）, Cormorant 12px
- Stats row（display:flex, gap:12px, margin-bottom:20px）:
  - 各セル: flex:1, bg:bg（#F0ECE2）, padding:12px 16px, border-radius:2px
  - ラベル + 値（Cormorant Garamond 22px）
- 「読書をはじめる ▶」ボタン: 全幅, height:52px, bg:ink, 同上スタイル
- READING HISTORY セクション:
  - ラベル（上記ルール）
  - 各行: border-top:1px solid line, padding:14px 0
  - 左: 日付（Shippori Mincho 14px, ink-2）+ ページ範囲（Zen Kaku 11px, muted-2）
  - 右: 所要時間（Cormorant Garamond 16px, muted）

**コンポーネント:**
- `<ProgressHero percentage={62} remainingPages={172} estimatedMinutes={222} />` — 数字ヒーローカード
- `<StatCell label="Total Time" value="4 h 12 m" />`
- `<ReadingSessionRow date="11月14日（木）" range="p.248→p.284" duration="42 min" />`

---

### Screen 04 — Reading Timer

**目的:** 読書セッション中の没入タイマー。黒背景で集中環境を演出。

**レイアウト:**
- 背景全体: `#0F0D0A`（ほぼ黒）
- Top bar: × ボタン（X 22px, color:rgba(255,255,255,0.6)）/ "NOW READING" ラベル / 空白
- 書籍情報（中央揃え, padding:24px 28px 0）:
  - 著者（Zen Kaku 11px, letter-spacing:0.22em, rgba(255,255,255,0.35)）
  - 書名（Shippori Mincho 22px, weight:500, rgba(255,255,255,0.92)）
- タイマーヒーロー（flex:1, justify-content:center, align-items:center）:
  - "ELAPSED" ラベル（上）
  - 分: Cormorant Garamond **96px** weight:300, rgba(255,255,255,0.92), letter-spacing:-0.03em
  - :秒: Cormorant Garamond **36px** weight:300, rgba(255,255,255,0.45)
  - "MINUTES · SECONDS" （Zen Kaku 10px, letter-spacing:0.28em, rgba(255,255,255,0.3)）
  - ● READING パルス: 7px circle, rgba(255,255,255,0.7), box-shadow:0 0 12px rgba(255,255,255,0.5)
- Bottom エリア（padding:0 28px）:
  - 区切り線: border-top:1px solid rgba(255,255,255,0.08)
  - STARTED AT（p.284）← → CURRENT（p.312）: 両端寄せ
    - ラベル: Zen Kaku 10px, letter-spacing:0.22em
    - 値: Cormorant 22px（開始）/ 28px（現在ページ、border-bottom:1px solid rgba(255,255,255,0.3)）
  - 「読書をおわる」ボタン: bg:paper(#F7F5EF), color:ink, height:52px, Zen Kaku 13px, letter-spacing:0.15em, margin-bottom:32px

**コンポーネント:**
- `<ReadingTimer bookTitle="罪と罰" author="Dostoevsky" startPage={284} />` — タイマーロジック込み
- リアルタイムカウントアップ: `setInterval` 1000ms、useState で elapsed seconds 管理

---

### Screen 05 — Add Book / Search

**目的:** タイトル・著者で書籍を検索し、本棚に追加。

**レイアウト:**
- Top bar: × ボタン / "ADD A BOOK" ラベル / 空白
- 見出し「本を棚に加える」（Shippori Mincho 28px, weight:500）
- サブテキスト（Zen Kaku 12px, muted）
- 検索ボックス: 🔍アイコン（16px, muted-2）+ テキスト（Zen Kaku 16px, ink）, border-bottom:1.5px solid ink（フォーカス時）/ line（通常）, paddingBottom:10px
- Results ヘッダー: "RESULTS" ラベル + "· 4"（Cormorant 13px）/ "Google Books"（Zen Kaku 10px, muted-2）
- 結果リスト（border-topで区切り）:
  - 書影サムネ: **固定サイズ** width:48px, height:68px, border-radius:1px（重要：書名行数によって高さが変わらないよう固定）
  - 書名（Shippori Mincho 15px, ink）+ 著者（Zen Kaku 12px, muted）+ 年・ページ数（Cormorant 12px, muted-2）
  - ＋ボタン: width:36px, height:36px, border-radius:50%, border:1.2px solid line, color:muted（**44px以上のタッチターゲット確保のためwrapper拡張推奨**）
- 「手動で本を追加する」: 中央揃え、Zen Kaku 12px, border-bottom:1px solid ink

**コンポーネント:**
- `<BookSearchInput onSearch={...} />` — Google Books API連携
- `<SearchResultRow book={...} onAdd={...} />` — 固定高サムネ付きリスト行

---

### Screen 06 — Stats（読書手帖）

**目的:** 累計読書時間・冊数・ページ数・連続日数の統計ダッシュボード。

**レイアウト:**
- Header: "READING RECORD" ラベル / 「読書手帖」（Shippori Mincho 32px）
- 累計時間ヒーロー:
  - "TOTAL READING TIME" ラベル
  - 「127」Cormorant Garamond **80px** weight:300, letter-spacing:-0.03em + 「h」28px muted + 「42」48px ink-2 + 「m」28px muted
  - サブ: 「2026年 累計 · 1日平均 21分」（Zen Kaku 11px, muted-2）
- 4グリッド（display:grid, grid-template-columns:1fr 1fr, gap:1px, bg:line（グリッド線代わり））:
  - 各セル: bg:paper, padding:16px 18px
  - ラベル（上記ルール）+ 数字（Cormorant 34px, weight:300）+ 単位（Zen Kaku 12px, muted）+ 説明（Zen Kaku 11px, muted-2）
  - Finished / Reading / Pages / Streak
- THIS WEEK バーチャート:
  - ヘッダー: "THIS WEEK" ラベル / 「合計 4h 23m」（Cormorant 13px, muted）
  - 7本のバー（M T W T F S S）、最大高:52px
  - バー色: 今日=ink, その他=muted-2（opacity:0.55）
  - バーなし日（0分）は空欄
  - 今日のラベル: Cormorant Garamond 13px, weight:600, border-bottom:1px solid ink
  - その他のラベル: Zen Kaku 10px, muted-2

**コンポーネント:**
- `<HeroTime hours={127} minutes={42} />`
- `<StatGrid items={[{label, value, unit, sub}]} />`
- `<WeeklyBarChart data={weeklyData} todayIndex={3} />`

---

## Shared Components

### BottomNav

3アイテム（LIBRARY / ADD / STATS）。

```tsx
// 各アイテム
{ id: 'library' | 'add' | 'stats', label: string, icon: SVG }

// スタイル
border-top: 1px solid line
padding: 8px 0 24px (safe area対応)
active color: ink
inactive color: muted-2
label: Zen Kaku 9px, letter-spacing:0.18em
```

### StatusBar

iOS ステータスバー風。時刻（Cormorant 15px, weight:600）+ 電波・WiFi・バッテリーSVGアイコン。ダーク背景時は `rgba(255,255,255,0.7)`。

### BookCover

書影ブロックカラー表示（Google Books 画像未取得時のフォールバック）。

```tsx
interface BookCoverProps {
  title: string
  author: string
  publisher: string
  color: string   // 上記12色パレットから
  width: number
  height: number
}
// 内部: タイトル（Shippori Mincho, white 0.92）
//       著者（Zen Kaku, white 0.55, uppercase）
//       出版社（Zen Kaku, white 0.45, 下寄せ）
```

---

## Empty States

### 本棚（0冊）

- フィルタータブはすべて `opacity:0.45` で表示
- 中央: 細い縦線（2px wide, 64px tall, color:line）+ しおりV字形状
- 「本棚はまだ空です。」（Shippori Mincho 18px, weight:500, ink-2）
- 「最初の一冊を見つけましょう。\n下の ＋ から本を検索できます。」（Zen Kaku 12px, muted, line-height:1.9）
- 下向き矢印（1px縦線 + chevron, color:line）でADDナビへ誘導

### 読書手帖（0件）

- ヒーロー数字を「—」（Cormorant 80px, color:line）で表示
- 「記録がまだありません」（Zen Kaku 11px, muted-2）
- 4グリッドの数字もすべて「—」（color:line）
- 区切り線以下: 「読書を記録すると、ここに手帖が育ちます。」（Shippori Mincho 15px, ink-2, line-height:2）

---

## Interactions & Behavior

### タップ・プレス状態

| 要素 | Default | Pressed | Duration |
|------|---------|---------|----------|
| プライマリボタン（LOG IN 等）| - | `scale(0.98) opacity(0.82)` | 100ms ease |
| 書影カード | - | `scale(0.95) opacity(0.85)` | 120ms ease |
| フィルタータブ | - | `opacity(0.7)` | 80ms |

### ローディング状態

- **スケルトンローディング**: 書影カード・テキスト要素をグレーブロックで代替。シマーアニメーション:

```css
@keyframes shimmer {
  0%   { background-position: 200% 0 }
  100% { background-position: -200% 0 }
}
.skeleton {
  background: linear-gradient(90deg, #EFEBE2 25%, #E3DFD6 50%, #EFEBE2 75%);
  background-size: 200% 100%;
  animation: shimmer 1.6s infinite;
}
```

- **ボタンローディング**: テキストを3点ドット（`● ● ●`、opacity段階的に）に置換

### 画面遷移

| From | To | Transition |
|------|----|------------|
| 本棚 | 書籍詳細 | 右スライドイン（translateX 100% → 0, 300ms ease-out） |
| 書籍詳細 | 本棚 | 左スライドアウト（swipe or ← ボタン） |
| 書籍詳細 | 読書タイマー | フェードイン → 黒背景展開（400ms） |
| 読書タイマー | 記録完了モーダル | ボトムシートスライドアップ |
| 記録完了モーダル | 書籍詳細 | モーダル dismiss + 詳細を更新 |
| 本棚タブ | 追加 | モーダルまたはフルスクリーン sheet |

### 読書タイマーのリアルタイム更新

```ts
// 1秒ごとにカウントアップ
const [elapsed, setElapsed] = useState(0)
useEffect(() => {
  const interval = setInterval(() => setElapsed(e => e + 1), 1000)
  return () => clearInterval(interval)
}, [])

const minutes = Math.floor(elapsed / 60)
const seconds = elapsed % 60
```

---

## Delete / Trash UI（書籍削除フロー）

採用したのは **B → C → D の3段フロー** です。「静かに、しかし取り返しがつく」というアプリのトーンを保ちつつ、誤操作を防ぎます。

### Destructive カラー

```
--color-danger: #C77B6F  /* muted terracotta — 紙色パレットに馴染む控えめな destructive */
```

派手な赤は使わず、書影パレットの深紅トーンと近い質感の terracotta を使用。

### B · オーバーフローメニュー（書籍詳細画面）

書籍詳細画面のトップバー右上 ⋮（KebabIcon）をタップすると、ドロップダウンメニューが表示される。

**メニュー項目（上から）:**
1. 本の情報を編集
2. 読書履歴を見る
3. 共有
4. ─── 区切り線 ───
5. **本棚から削除**（color: `#C77B6F`、TrashIcon は同色）

**スタイル:**
- メニュー: `position: absolute`, `top: 50px`, `right: 18px`
- 背景: `#1F1C18`（ダーク） / `#FFFFFF`（ライト）
- 角丸: 4px
- 影: `0 16px 40px rgba(0,0,0,0.7), 0 2px 8px rgba(0,0,0,0.4)`
- 各項目: padding `12px 16px`, gap `12px`, font: Zen Kaku Gothic 13px
- 区切り線: 1px, color: line（薄いライン色）

「本棚から削除」をタップすると **C（確認ボトムシート）** を開く。

### C · 削除確認ボトムシート

書籍を即座に削除せず、失うものを具体的に明示する確認ステップ。

**レイアウト:**
- 背景全体を `rgba(0,0,0,0.5)` で暗転（背後の詳細画面が透けて見える）
- ボトムシート: `position: absolute, left:0, right:0, bottom:0`
- 背景: `#16140F`（ダーク）/ `#F7F5EF`（ライト）
- 角丸: `16px 16px 0 0`
- パディング: `12px 28px 32px`
- 影: `0 -16px 40px rgba(0,0,0,0.6)`

**コンテンツ（上から）:**
1. **ドラッグハンドル**: 40×3px, `rgba(255,255,255,0.18)`, border-radius:2px, 中央
2. **書籍プレビュー**: 書影（48×68px）+ 著者・書名（2行 ellipsis）, border-bottom で区切り
3. **見出し**: Shippori Mincho 20px / weight:500 / line-height:1.55
   ```
   この本を本棚から
   削除しますか？
   ```
4. **本文**: Zen Kaku Gothic 12px / line-height:1.9 / color: muted（55%透明度）
   ```
   読書履歴 4 件、累計時間 26m 27s も
   すべて消えます。この操作は取り消せません。
   ```
   ※ 数字部分（4 / 26m 27s）のみ Cormorant Garamond で強調

5. **アクション（縦積み、destructive が上）:**
   - 「削除する」: bg: `#C77B6F`, color: `#0F0D0A`, height:50px, Zen Kaku 13px / letter-spacing:0.15em
   - 「キャンセル」: outline (border: line), color: ink/white(92%), 同サイズ

**動作:**
- スワイプダウン or 「キャンセル」 or バックドロップタップで dismiss
- 「削除する」タップで本棚画面へ戻り、**D（Undoトースト）** を表示

### D · Undo トースト（本棚画面）

削除後、本棚画面に黒トーストを5秒間表示する。Material Design の定番。

**スタイル:**
- 位置: `position: absolute, left:20px, right:20px, bottom:104px`（BottomNav の上に浮かす）
- 背景: `#0A0A0A`（ink）
- 角丸: 2px
- パディング: `14px 18px`
- 影: `0 12px 32px rgba(0,0,0,0.25)`
- 表示時間: **5秒**（フェードイン200ms / フェードアウト300ms）

**コンテンツ（左右配置）:**
- 左: メッセージ「『また、同じ夢を見ていた』を削除しました」
  - Shippori Mincho 13px / color: paper / 1行 ellipsis
- 右: 「元に戻す」アクション
  - Zen Kaku Gothic 11px / letter-spacing: 0.18em / color: paper / border-bottom: 1px solid paper

**動作:**
- 「元に戻す」タップで書籍データを復元、トーストを即座に dismiss
- 5秒経過で完全削除確定（DB上で物理削除 or `deleted_at` を立てたソフトデリートのどちらでも良いが、Undo の実装上は **5秒間は実削除しない** のが安全）

### 実装上のヒント

```ts
// Soft-delete pattern with undo window
async function handleDelete(bookId: string) {
  // 1. UIから即座に消す（楽観的UI）
  setBooks(prev => prev.filter(b => b.id !== bookId))
  
  // 2. トースト表示開始 + 5秒タイマー
  const timer = setTimeout(async () => {
    await supabase.from('books').delete().eq('id', bookId)
  }, 5000)
  
  // 3. Undo タップ時はタイマーをキャンセルしてリスト復元
  setUndoHandler(() => {
    clearTimeout(timer)
    setBooks(prev => [...prev, deletedBook])
  })
}
```

---

## State Management

### 主要な状態変数

```ts
// 書籍一覧
books: Book[]           // status: 'reading' | 'finished' | 'to_read'
activeFilter: BookStatus | 'all'

// 読書セッション
isTimerActive: boolean
timerElapsedSeconds: number
currentSessionStartPage: number

// 統計
totalReadingSeconds: number
weeklyData: { date: string; minutes: number }[]
```

### Supabase RLS

各テーブルに `user_id` を持たせ、RLS で `auth.uid() = user_id` のみアクセス可。

---

## Assets

- **フォント**: Google Fonts（Cormorant Garamond / Shippori Mincho / Zen Kaku Gothic New）
- **アイコン**: 手描きSVG（シンプルな stroke ベース、stroke-width:1.4px、stroke-linecap:round）— 外部ライブラリ不要
- **書影**: Google Books API の `volumeInfo.imageLinks.thumbnail`。取得失敗時は上記12色パレットからフォールバック
- **ロゴ**: SVGインライン（書影アイコン + "Digital Bookmark" テキスト）

---

## Files in This Package

| ファイル | 内容 |
|---------|------|
| `デジタル栞 Screens v2.html` | **メインデザインキャンバス** — 全画面・空状態・インタラクション提案をまとめた参照ファイル |
| `shared-components.jsx` | 共通コンポーネント（MobileShell / StatusBar / BottomNav / BookCover / Label） |
| `screens-1-3.jsx` | Screen 01〜03 のコンポーネント |
| `screens-4-6.jsx` | Screen 04〜06 のコンポーネント |
| `screens-empty-states.jsx` | 空状態コンポーネント（本棚0冊・手帖0件） |
| `screens-improvements.jsx` | タイポグラフィ改善版・スケルトン・タップ状態・遷移図 |
| `デジタル栞 — Trash UI.html` | 書籍削除UI（B/C/D 採用版） |
| `screens-trash.jsx` | 削除UIコンポーネント（メニュー / 確認シート / Undoトースト） |
| `design-brief.md` | デザインコンセプト・方針のオリジナルブリーフ |
| `要件定義書.md` | 機能要件・データモデル・画面構成 |

---

## Notes for Developer

1. **書影の実装優先順位**: Google Books `thumbnail` URL → Supabase Storage にキャッシュ → カラーフォールバック（ISBNのハッシュ値で12色から決定論的に選択）
2. **フォントロード**: `font-display: swap` を必ず設定し、フォールバックフォントをできるだけ近い書体（Georgia / serif）に
3. **Safe Area**: iOS Safariのボトムバー考慮。`padding-bottom: env(safe-area-inset-bottom)` をBottomNavに適用
4. **ダークモード**: Screen 04（Reading Timer）のみダーク。システムのダークモード設定には連動させず、タイマー画面専用のダーク背景とする
5. **アニメーション**: `prefers-reduced-motion` を尊重し、アニメーション無効化オプションを実装すること
