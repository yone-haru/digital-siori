# デジタル栞 (Yondle)

紙の本の「どこまで読んだか忘れた」をなくす、静かな読書記録アプリ。

## 今すぐ使う

**[https://digital-siori.vercel.app](https://digital-siori.vercel.app)** — Web版はメールアドレスだけで今すぐ始められます。

iOS / Android アプリも実装済みで、ストア公開に向けて準備中です。

## スクリーンショット

<p>
  <img src="mobile/screen%20short/実機/library_notaskbar.jpg" width="220" alt="本棚画面" />
  <img src="mobile/screen%20short/実機/now_reading_notaskbar.jpg" width="220" alt="読書タイマー画面" />
  <img src="mobile/screen%20short/実機/stats_total_notaskbar.jpg" width="220" alt="読書統計画面" />
</p>

## できること

- 認証（メールでのサインアップ・ログイン）
- 書籍検索・登録（Google Books API で表紙・著者・ページ数を自動取得）
- 読書タイマーによる読書時間・進捗の記録
- 読書統計（累計時間・読了冊数・連続読書日数など）
- Pro サブスクリプション（RevenueCat）

## 技術スタック

| 領域 | 技術 |
|---|---|
| Web | Next.js 15 (App Router) / TypeScript |
| モバイル | Expo + React Native / TypeScript |
| 認証・DB | Supabase (Auth + PostgreSQL + Edge Functions) |
| 課金 | RevenueCat |
| スタイル | Tailwind CSS |
| ホスティング | Vercel |

## モノレポ構成

```
デジタル栞/
├── web/      # Next.js Web アプリ（本番稼働中）
└── mobile/   # Expo モバイルアプリ（iOS / Android、ストア公開準備中）
```

開発環境のセットアップ手順は [web/README.md](web/README.md) を参照してください。
