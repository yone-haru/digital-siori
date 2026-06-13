import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "プライバシーポリシー | Yondle",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-16 text-ink">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 font-cormorant text-sm tracking-widest text-muted uppercase">
          Privacy Policy
        </p>
        <h1 className="mb-10 font-shippori text-3xl">プライバシーポリシー</h1>

        <Section title="1. はじめに">
          <p>
            Yondle（以下「本アプリ」）は、yoneharu（以下「開発者」）が提供する読書記録アプリです。
            本ポリシーは、本アプリがどのような情報を収集し、どのように利用・保護するかを説明します。
          </p>
        </Section>

        <Section title="2. 収集する情報">
          <SubSection title="アカウント情報">
            <p>
              メールアドレスおよびパスワード（ハッシュ化済み）を収集します。
              Google・Apple等でのソーシャルログインを利用する場合は、各プロバイダが提供するメールアドレスを取得します。
            </p>
          </SubSection>
          <SubSection title="読書記録データ">
            <p>
              本のタイトル・著者・ISBN・ページ数・読書ステータス・読書セッション（日時・ページ数・時間）・
              評価・レビュー・メモ・タグなど、ユーザーが入力した読書に関するデータを収集します。
            </p>
          </SubSection>
          <SubSection title="購入情報">
            <p>
              有料プランの購入状況を管理するために RevenueCat を使用します。
              クレジットカード情報等の決済情報は開発者のサーバーには保存されず、
              Apple App Store / Google Play Store が直接管理します。
            </p>
          </SubSection>
        </Section>

        <Section title="3. 情報の利用目的">
          <ul className="list-disc space-y-1 pl-5">
            <li>アカウントの作成・認証・管理</li>
            <li>読書記録の保存・同期・表示</li>
            <li>有料プランの提供および管理</li>
            <li>アプリの不具合調査・品質改善</li>
          </ul>
        </Section>

        <Section title="4. 情報の共有">
          <p className="mb-3">
            開発者は、以下の場合を除き、収集した情報を第三者に販売・共有しません。
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong>Supabase</strong>
              （データベース・認証）— アカウント情報および読書記録データを安全に保管します。
              <br />
              <a
                href="https://supabase.com/privacy"
                className="text-muted underline underline-offset-2 hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                Supabase プライバシーポリシー
              </a>
            </li>
            <li className="mt-2">
              <strong>RevenueCat</strong>
              （サブスクリプション管理）— 購入状況の確認・管理に使用します。
              <br />
              <a
                href="https://www.revenuecat.com/privacy"
                className="text-muted underline underline-offset-2 hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                RevenueCat プライバシーポリシー
              </a>
            </li>
            <li className="mt-2">
              <strong>Google Books API</strong>
              — 本の書誌情報・書影の取得に使用します。検索クエリがGoogleのサーバーに送信されます。
              <br />
              <a
                href="https://policies.google.com/privacy"
                className="text-muted underline underline-offset-2 hover:text-ink"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google プライバシーポリシー
              </a>
            </li>
          </ul>
        </Section>

        <Section title="5. データの保管と削除">
          <p>
            収集したデータはSupabaseのサーバーに保管されます。
            アカウントを削除した場合、読書記録を含む全てのデータは速やかに削除されます。
            アカウント削除はアプリ内の「アカウント」画面から行えます。
          </p>
        </Section>

        <Section title="6. セキュリティ">
          <p>
            通信はすべてHTTPS/TLSで暗号化されます。
            パスワードは適切にハッシュ化され、開発者も平文を参照できません。
            ただし、インターネット上でのデータ送受信において完全な安全を保証するものではありません。
          </p>
        </Section>

        <Section title="7. 子どものプライバシー">
          <p>
            本アプリは13歳未満の方を対象としていません。
            意図せず13歳未満の方の情報を収集していることが判明した場合、速やかに削除します。
          </p>
        </Section>

        <Section title="8. ポリシーの変更">
          <p>
            本ポリシーは必要に応じて更新することがあります。
            重要な変更がある場合はアプリ内またはこのページで通知します。
            変更後も引き続きご利用いただいた場合、変更に同意したものとみなします。
          </p>
        </Section>

        <Section title="9. お問い合わせ">
          <p>
            本ポリシーに関するご質問は下記までご連絡ください。
          </p>
          <p className="mt-2">
            <a
              href="mailto:yonemuraharuki2006510@gmail.com"
              className="text-muted underline underline-offset-2 hover:text-ink"
            >
              yonemuraharuki2006510@gmail.com
            </a>
          </p>
        </Section>

        <p className="mt-16 text-sm text-muted">最終更新日：2026年6月13日</p>
      </div>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-shippori text-lg border-b border-line pb-2">{title}</h2>
      <div className="space-y-3 text-sm leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

function SubSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <h3 className="mb-1 font-medium text-ink">{title}</h3>
      {children}
    </div>
  );
}
