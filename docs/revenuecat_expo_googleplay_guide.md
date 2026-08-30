# RevenueCat + React Native (Expo) — Google Play Store リリースガイド

## 全体の流れ

```
① Expoプロジェクト準備     → EAS Build 導入・app.json 設定
② RevenueCat セットアップ  → SDK 導入・Dashboard 設定・API 連携
③ Google Play Console 設定 → アカウント作成・アプリ登録・商品作成
④ AAB ビルド               → EAS Build で本番ビルド生成
⑤ 提出・審査               → ストア情報整備・審査提出
```

---

## ① Expoプロジェクトの準備

### EAS Build の導入（必須）

Expo でネイティブ SDK を使う場合、EAS Build が必要。

```bash
npm install -g eas-cli
eas login
eas build:configure
```

生成される `eas.json`:

```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

### app.json の確認

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "version": "1.0.0",
    "android": {
      "package": "com.yourname.myapp",   // 一度決めたら変更不可
      "versionCode": 1                    // リリースごとに +1
    }
  }
}
```

---

## ② RevenueCat セットアップ

### インストール

```bash
npx expo install react-native-purchases
```

> **注意**: Expo Go では動作しない。Development Build または本番ビルドが必要。

### RevenueCat Dashboard の設定

1. [app.revenuecat.com](https://app.revenuecat.com) でアプリ作成
2. **Google Play** を選択
3. `com.yourname.myapp` を登録
4. Google Play Store API の連携（③ で設定）

### コード実装

```javascript
import Purchases from 'react-native-purchases';

// アプリ起動時に初期化
await Purchases.configure({
  apiKey: 'goog_xxxxxxxxxxxxxxxx',  // RevenueCat Dashboard から取得
});

// 商品取得
const offerings = await Purchases.getOfferings();

// 購入
const { customerInfo } = await Purchases.purchasePackage(package);

// 購入状態確認
const customerInfo = await Purchases.getCustomerInfo();
const isPremium = customerInfo.entitlements.active['premium'] !== undefined;
```

---

## ③ Google Play Console の設定

### アカウント作成
- [play.google.com/console](https://play.google.com/console) で登録
- 登録料: **$25（一回のみ）**

### アプリの新規作成
1. 「アプリを作成」→ アプリ名・言語・アプリ/ゲームの選択
2. `package` 名は `app.json` と完全一致させる

### RevenueCat ↔ Google Play API 連携

1. Google Play Console → **設定 → API アクセス** → Google Cloud プロジェクトをリンク
2. サービスアカウントを作成 → 権限を付与
   - 財務データの閲覧
   - 注文の管理
3. JSON キーを RevenueCat Dashboard にアップロード

### 商品の作成（Google Play Console）

- 「収益化 → 商品 → アプリ内商品」でサブスクまたは一回購入を作成
- Product ID を RevenueCat の **Entitlements / Products** に登録

---

## ④ AAB ビルド（EAS Build）

```bash
# 本番ビルド（Google Play 提出用）
eas build --platform android --profile production
```

- EAS クラウドでビルド（ローカル環境不要）
- 完了後、`.aab` ファイルをダウンロード

### キーストアについて

EAS が自動で Keystore を生成・管理する。
**紛失するとアプリを更新できなくなる**ため、EAS 上に必ず保存すること。

---

## ⑤ Google Play への提出

### 審査トラックの選択（初回）

| トラック | 用途 | 審査 |
|---------|------|------|
| 内部テスト | 開発チームのみ | なし（最速） |
| クローズドテスト（α） | 特定ユーザー招待 | 簡易 |
| オープンテスト（β） | 公開テスト | あり |
| **本番** | 一般公開 | あり |

> 初回は **内部テスト → 本番** の順に進めると審査がスムーズ。

### 提出チェックリスト

- [ ] AAB ファイル
- [ ] スクリーンショット（スマホ必須、タブレット任意）
- [ ] 高解像度アイコン（512×512 PNG）
- [ ] フィーチャーグラフィック（1024×500 PNG）
- [ ] プライバシーポリシー URL（**課金アプリは必須**）
- [ ] アプリの説明文（短い説明・詳細説明）
- [ ] コンテンツレーティング回答

---

## よくあるハマりポイント

| 問題 | 対処 |
|------|------|
| `react-native-purchases` が Expo Go で動かない | Development Build を使う |
| RevenueCat が購入を検知しない | Google Play API 連携のサービスアカウント権限を確認 |
| ビルドの versionCode が前回と同じ | `app.json` の `versionCode` を +1 する |
| 審査でポリシー違反 | プライバシーポリシーに課金・データ収集の記載を追加 |
| サブスクの返金ポリシー未設定 | Google Play Console → 設定で返金ポリシーを記載 |

---

## まとめフロー

```
1. EAS Build 設定          eas build:configure
2. RevenueCat SDK 導入     npx expo install react-native-purchases
3. RevenueCat Dashboard    アプリ登録・商品作成・API キー取得
4. Google Play Console     アプリ登録・商品作成
5. API 連携                Google Play ↔ RevenueCat サービスアカウント接続
6. 本番ビルド              eas build --platform android --profile production
7. ストア情報整備          スクショ・アイコン・説明文・プライバシーポリシー
8. 審査提出                内部テスト → 本番トラックへ昇格
```
