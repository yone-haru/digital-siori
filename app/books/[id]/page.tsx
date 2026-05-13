import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { BookCover } from "@/components/books/book-cover";
import { BottomNav } from "@/components/ui/bottom-nav";
import { PageUpdateForm, StatusButtons, BookMenu } from "@/components/books/detail-client";
import { ManualSessionForm } from "@/components/books/manual-session-form";
import { formatDuration, formatSessionDate } from "@/lib/utils";

export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: book }, { data: sessions }] = await Promise.all([
    supabase.from("books").select("*").eq("id", id).single(),
    supabase
      .from("reading_sessions")
      .select("*")
      .eq("book_id", id)
      .order("started_at", { ascending: false }),
  ]);

  if (!book) redirect("/shelf");

  // 型アサーション（Supabase generic 型未使用のため）
  const b = book as {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
    total_pages: number;
    current_page: number;
    status: "reading" | "to_read" | "finished";
    description: string | null;
    started_at: string | null;
    finished_at: string | null;
  };

  const pct =
    b.total_pages > 0
      ? Math.min(100, Math.round((b.current_page / b.total_pages) * 100))
      : 0;
  const remaining = Math.max(0, b.total_pages - b.current_page);

  // 読書統計
  const totalSeconds =
    sessions?.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) ?? 0;

  // 読了予測（セッション記録 & current_page > 0 のときのみ）
  let estimatedRemainingStr: string | null = null;
  if (sessions && sessions.length > 0 && b.current_page > 0 && remaining > 0) {
    const secondsPerPage = totalSeconds / b.current_page;
    const remainingSec = Math.round(secondsPerPage * remaining);
    estimatedRemainingStr = formatDuration(remainingSec);
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Top bar */}
      <div className="relative flex justify-between items-center px-7 py-3 shrink-0">
        <Link
          href="/shelf"
          className="text-ink hover:opacity-60 transition-opacity"
          aria-label="本棚に戻る"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M14 4L6 11l8 7"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>
        <span className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
          Detail
        </span>
        <BookMenu
          bookId={b.id}
          bookTitle={b.title}
          bookAuthor={b.author}
          sessionCount={sessions?.length ?? 0}
          totalSeconds={totalSeconds}
        />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-7 pb-28">
        {/* Book info row */}
        <div className="flex gap-5 mb-7">
          <BookCover
            title={b.title}
            coverUrl={b.cover_url}
            width={80}
            height={116}
          />
          <div className="flex-1 flex flex-col justify-between min-w-0">
            <div>
              <p className="font-zen text-[11px] tracking-[0.15em] text-muted-2 uppercase mb-1 truncate">
                {b.author}
              </p>
              <h1 className="font-shippori text-[24px] font-semibold text-ink leading-[1.2] mb-2">
                {b.title}
              </h1>
              {b.total_pages > 0 && (
                <p className="font-zen text-[12px] text-muted">
                  {b.total_pages}p
                </p>
              )}
            </div>
            <StatusButtons bookId={b.id} currentStatus={b.status} />
          </div>
        </div>

        {/* Description */}
        {b.description && (
          <p className="font-zen text-[12px] text-muted leading-[1.8] mb-6 line-clamp-4">
            {b.description}
          </p>
        )}

        {/* Progress hero */}
        <div className="bg-line-2 rounded-sm p-5 mb-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1">
                Progress
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-cormorant text-[72px] font-light text-ink leading-none">
                  {pct}
                </span>
                <span className="font-cormorant text-[24px] text-muted font-light">
                  %
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1.5">
                Remaining
              </p>
              <p className="font-shippori text-[15px] text-ink-2 leading-[1.6]">
                あと {remaining} ページ
              </p>
              {estimatedRemainingStr && (
                <p className="font-zen text-[12px] text-muted">
                  約 {estimatedRemainingStr}
                </p>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-[2px] bg-line rounded-[1px] mb-2">
            <div
              className="h-full bg-ink rounded-[1px] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-cormorant text-[12px] text-muted-2">p.1</span>
            <span className="font-cormorant text-[12px] text-ink-2">
              現在 p.{b.current_page}
            </span>
            <span className="font-cormorant text-[12px] text-muted-2">
              p.{b.total_pages}
            </span>
          </div>
        </div>

        {/* Page update */}
        <div className="mb-6">
          <PageUpdateForm
            bookId={b.id}
            currentPage={b.current_page}
            totalPages={b.total_pages}
          />
        </div>

        {/* Stats row */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 bg-bg rounded-sm p-3">
            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1.5">
              Total Time
            </p>
            <span className="font-cormorant text-[22px] text-ink tracking-[-0.01em]">
              {formatDuration(totalSeconds)}
            </span>
          </div>
          <div className="flex-1 bg-bg rounded-sm p-3">
            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1.5">
              Sessions
            </p>
            <span className="font-cormorant text-[22px] text-ink tracking-[-0.01em]">
              {sessions?.length ?? 0}
              <span className="font-zen text-[12px] text-muted ml-1">回</span>
            </span>
          </div>
        </div>

        {/* Reading CTA */}
        <Link
          href={`/books/${b.id}/reading`}
          className="flex items-center justify-center gap-2.5 w-full h-[52px] bg-ink text-paper font-zen text-[13px] tracking-[0.15em] rounded-sm mb-7 hover:opacity-90 transition-opacity"
        >
          読書をはじめる
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <polygon points="3,2 12,7 3,12" fill="currentColor" />
          </svg>
        </Link>

        {/* Manual session */}
        <ManualSessionForm bookId={b.id} currentPage={b.current_page} />

        {/* Reading history */}
        {sessions && sessions.length > 0 && (
          <div>
            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-4">
              Reading History
            </p>
            <ul>
              {sessions.map((s) => {
                const pagesRead = (s.end_page ?? 0) - (s.start_page ?? 0);
                return (
                  <li
                    key={s.id}
                    className="border-t border-line py-3.5 flex justify-between items-center"
                  >
                    <div>
                      <p className="font-shippori text-[14px] text-ink-2 mb-0.5">
                        {formatSessionDate(s.started_at)}
                      </p>
                      <p className="font-zen text-[11px] text-muted-2">
                        p.{s.start_page} → p.{s.end_page}
                        {pagesRead > 0 && ` · ${pagesRead}ページ`}
                      </p>
                    </div>
                    <span className="font-cormorant text-[16px] text-muted tracking-[0.02em]">
                      {formatDuration(s.duration_seconds)}
                    </span>
                  </li>
                );
              })}
              <li className="border-t border-line" />
            </ul>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
