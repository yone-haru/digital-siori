import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  {
    no: "01",
    en: "BOOKSHELF",
    title: "書影が並ぶ、デジタルの本棚",
    body: "タイトルで検索するだけで、表紙・著者・ページ数を自動取得。手元の紙の本が、数秒で美しい本棚に並びます。",
  },
  {
    no: "02",
    en: "DIGITAL BOOKMARK",
    title: "どこまで読んだか、忘れない",
    body: "現在のページを記録すれば、進捗率と残りページを常に表示。栞を失くしても、読書の現在地は失われません。",
  },
  {
    no: "03",
    en: "READING TIMER",
    title: "没入のための、読書タイマー",
    body: "読書をはじめたら、タイマーをそっと起動。黒い画面が集中を守り、読んだ時間とページを静かに記録します。",
  },
  {
    no: "04",
    en: "FORECAST",
    title: "「あと何分で読み終わるか」",
    body: "あなた自身の読書ペースから、読了までの残り時間を予測。次の読書時間の計画が立てやすくなります。",
  },
  {
    no: "05",
    en: "READING RECORD",
    title: "積み重ねが見える、読書手帖",
    body: "累計読書時間、読了冊数、読んだページ数、連続読書日数。あなたの読書が、確かな記録として残ります。",
  },
  {
    no: "06",
    en: "MEMO & TAGS",
    title: "メモ・評価・タグで、自分だけの書斎に",
    body: "心に残った一文のメモ、読み終えた本の評価とレビュー、タグでの整理。再読の記録にも対応しています。",
  },
];

const SCREENS = [
  { src: "/lp/shelf.jpg", en: "LIBRARY", caption: "本棚 — 書影のグリッドと読書中の本" },
  { src: "/lp/detail.jpg", en: "DETAIL", caption: "書籍詳細 — 進捗と読書の現在地" },
  { src: "/lp/timer.jpg", en: "NOW READING", caption: "読書タイマー — 没入の黒い画面" },
  { src: "/lp/stats.jpg", en: "STATS", caption: "読書手帖 — 積み重ねの統計" },
];

function PhoneShot({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-shell border border-line bg-paper p-2 shadow-[0_24px_60px_-24px_rgba(10,10,10,0.35)]">
      <Image
        src={src}
        alt={alt}
        width={1220}
        height={2712}
        priority={priority}
        className="w-full rounded-[40px]"
      />
    </div>
  );
}

export function LandingPage() {
  return (
    <main className="min-h-screen bg-bg text-ink">
      {/* ── Nav ── */}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-6 md:px-7">
        <div className="flex items-center gap-3">
          <Image
            src="/lp/icon.png"
            alt="Yondle アイコン"
            width={36}
            height={36}
            className="rounded-lg"
          />
          <span className="font-cormorant text-2xl tracking-[0.08em]">Yondle</span>
        </div>
        <nav className="flex items-center gap-3 md:gap-6">
          <Link
            href="/auth/login"
            className="whitespace-nowrap font-zen text-sm text-muted transition-colors hover:text-ink"
          >
            ログイン
          </Link>
          <Link
            href="/auth/signup"
            className="whitespace-nowrap rounded bg-ink px-5 py-2.5 font-zen text-sm text-paper transition-opacity hover:opacity-80"
          >
            無料ではじめる
          </Link>
        </nav>
      </header>

      {/* ── Hero ── */}
      <section className="mx-auto max-w-5xl px-7 pb-24 pt-14 md:pt-20">
        <div className="grid items-center gap-14 md:grid-cols-[1.2fr_1fr]">
          <div>
            <p className="mb-6 font-cormorant text-sm tracking-[0.25em] text-muted">
              READING LOG, LIKE A BOOKMARK
            </p>
            <h1 className="mb-8 font-shippori text-4xl leading-snug tracking-wide md:text-5xl md:leading-snug">
              読書の記録を、
              <br />
              しおりのように。
            </h1>
            <p className="mb-10 max-w-md font-zen leading-loose text-muted">
              紙の本の「どこまで読んだか忘れた」をなくす、静かな読書記録アプリ。
              書籍情報の自動取得から、進捗の記録、読書時間の計測、読了予測まで。
              あなたの読書を、次のページへ。
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                href="/auth/signup"
                className="rounded bg-ink px-8 py-4 font-zen text-sm tracking-wider text-paper transition-opacity hover:opacity-80"
              >
                無料ではじめる
              </Link>
              <p className="font-zen text-xs leading-relaxed text-muted-2">
                iOS / Android アプリは近日公開
              </p>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[300px]">
            <PhoneShot src="/lp/shelf.jpg" alt="Yondle の本棚画面" priority />
          </div>
        </div>
      </section>

      {/* ── Concept ── */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-3xl px-7 py-20 text-center">
          <p className="mb-6 font-cormorant text-sm tracking-[0.25em] text-muted">CONCEPT</p>
          <p className="font-shippori text-2xl leading-loose tracking-wide md:text-3xl md:leading-loose">
            書籍のように、静謐に。
          </p>
          <p className="mx-auto mt-6 max-w-xl font-zen leading-loose text-muted">
            派手な通知も、過剰な装飾もありません。色はすべて本の表紙にゆだね、
            数字は書籍のページ番号のように堂々と。読書体験と地続きの、
            使っていることを意識させない道具を目指しました。
          </p>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-5xl px-7 py-24">
        <p className="mb-4 font-cormorant text-sm tracking-[0.25em] text-muted">FEATURES</p>
        <h2 className="mb-14 font-shippori text-3xl tracking-wide">できること</h2>
        <div className="grid gap-x-12 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.no}>
              <div className="mb-4 flex items-baseline gap-3 border-b border-line pb-3">
                <span className="font-cormorant text-3xl font-light text-muted-2">{f.no}</span>
                <span className="font-cormorant text-xs tracking-[0.25em] text-muted">
                  {f.en}
                </span>
              </div>
              <h3 className="mb-3 font-shippori text-lg tracking-wide">{f.title}</h3>
              <p className="font-zen text-sm leading-loose text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Screens ── */}
      <section className="border-y border-line bg-paper">
        <div className="mx-auto max-w-5xl px-7 py-24">
          <p className="mb-4 font-cormorant text-sm tracking-[0.25em] text-muted">SCREENS</p>
          <h2 className="mb-14 font-shippori text-3xl tracking-wide">画面</h2>
          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-8">
            {SCREENS.map((s) => (
              <figure key={s.src}>
                <PhoneShot src={s.src} alt={s.caption} />
                <figcaption className="mt-4">
                  <p className="font-cormorant text-xs tracking-[0.25em] text-muted-2">{s.en}</p>
                  <p className="mt-1 font-zen text-xs leading-relaxed text-muted">{s.caption}</p>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pro ── */}
      <section className="mx-auto max-w-3xl px-7 py-24 text-center">
        <p className="mb-4 font-cormorant text-sm tracking-[0.25em] text-muted">YONDLE PRO</p>
        <h2 className="mb-6 font-shippori text-3xl tracking-wide">もっと読む人のために</h2>
        <p className="mx-auto mb-10 max-w-xl font-zen leading-loose text-muted">
          基本機能はすべて無料でお使いいただけます。本棚の冊数やタグ、
          セッション履歴を無制限にし、統計を全期間さかのぼれる Yondle Pro もご用意しています。
        </p>
        <div className="mx-auto grid max-w-lg grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line text-left">
          {[
            ["本棚の冊数", "無制限"],
            ["タグ", "無制限"],
            ["セッション履歴", "無制限"],
            ["統計の表示期間", "全期間"],
          ].map(([label, value]) => (
            <div key={label} className="bg-paper px-5 py-4">
              <p className="font-zen text-xs text-muted">{label}</p>
              <p className="mt-1 font-shippori text-lg">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="border-t border-line bg-ink text-paper">
        <div className="mx-auto max-w-3xl px-7 py-24 text-center">
          <p className="mb-6 font-cormorant text-sm tracking-[0.25em] opacity-60">
            START READING
          </p>
          <p className="mb-10 font-shippori text-3xl leading-relaxed tracking-wide">
            あなたの読書を、
            <br className="md:hidden" />
            次のページへ。
          </p>
          <Link
            href="/auth/signup"
            className="inline-block rounded bg-paper px-10 py-4 font-zen text-sm tracking-wider text-ink transition-opacity hover:opacity-85"
          >
            無料ではじめる
          </Link>
          <p className="mt-6 font-zen text-xs opacity-50">
            メールアドレスだけで登録できます
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-7 py-12 md:flex-row md:justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/lp/icon.png"
            alt=""
            width={24}
            height={24}
            className="rounded"
          />
          <span className="font-cormorant text-lg tracking-[0.08em]">Yondle</span>
        </div>
        <nav className="flex items-center gap-6 font-zen text-xs text-muted">
          <Link href="/privacy" className="transition-colors hover:text-ink">
            プライバシーポリシー
          </Link>
          <Link href="/delete-account" className="transition-colors hover:text-ink">
            アカウント削除について
          </Link>
        </nav>
        <p className="font-cormorant text-xs tracking-[0.15em] text-muted-2">
          © 2026 Yondle
        </p>
      </footer>
    </main>
  );
}
