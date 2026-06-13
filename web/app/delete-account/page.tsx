import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "アカウント削除 | Yondle",
};

export default function DeleteAccountPage() {
  return (
    <main className="min-h-screen bg-paper px-6 py-16 text-ink">
      <div className="mx-auto max-w-2xl">
        <p className="mb-2 font-cormorant text-sm tracking-widest text-muted uppercase">
          Account Deletion
        </p>
        <h1 className="mb-10 font-shippori text-3xl">アカウントの削除</h1>

        <section className="mb-10">
          <h2 className="mb-4 border-b border-line pb-2 font-shippori text-lg">
            削除の手順
          </h2>
          <ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-ink-2">
            <li>Yondleアプリを開き、ログインします</li>
            <li>画面右下の <strong className="text-ink">「STATS」</strong> タブを開きます</li>
            <li>右上のアカウントアイコンをタップします</li>
            <li><strong className="text-ink">「アカウントを削除する」</strong> をタップします</li>
            <li>確認画面で <strong className="text-ink">「削除する」</strong> を選択します</li>
          </ol>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 border-b border-line pb-2 font-shippori text-lg">
            削除されるデータ
          </h2>
          <p className="mb-3 text-sm leading-relaxed text-ink-2">
            アカウントを削除すると、以下のデータがすべて削除されます。削除後の復元はできません。
          </p>
          <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-ink-2">
            <li>アカウント情報（メールアドレス）</li>
            <li>登録した本の情報（タイトル・著者・ステータス・評価・レビュー）</li>
            <li>読書セッションの記録（日時・ページ数・時間）</li>
            <li>メモ・タグ</li>
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 border-b border-line pb-2 font-shippori text-lg">
            データの保持期間
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            アカウント削除のリクエストを受け付け後、速やかにすべてのデータを削除します。
            バックアップ等による保持は行いません。
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 border-b border-line pb-2 font-shippori text-lg">
            お問い合わせ
          </h2>
          <p className="text-sm leading-relaxed text-ink-2">
            アプリからの削除が難しい場合は、下記までご連絡ください。
            メールにてアカウント削除の対応をいたします。
          </p>
          <p className="mt-2">
            <a
              href="mailto:yonemuraharuki2006510@gmail.com"
              className="text-sm text-muted underline underline-offset-2 hover:text-ink"
            >
              yonemuraharuki2006510@gmail.com
            </a>
          </p>
        </section>

        <p className="mt-16 text-sm text-muted">最終更新日：2026年6月13日</p>
      </div>
    </main>
  );
}
