import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { BookCover } from "@/components/books/book-cover";
import { BottomNav } from "@/components/ui/bottom-nav";
import { StatusButtons, BookMenu, RatingSection, BookReviewSection } from "@/components/books/detail-client";
import { ManualSessionForm } from "@/components/books/manual-session-form";
import { StartReadingButton } from "@/components/books/start-reading-button";
import { formatDuration, formatSessionDate } from "@/lib/utils";
import { TagPicker } from "@/components/books/tag-picker";
import type { Tag } from "@/components/books/tag-picker";

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

  const [{ data: book }, { data: sessions }, { data: bookTagRows }, { data: allTagRows }, { data: memoRows }] =
    await Promise.all([
      supabase.from("books").select("*").eq("id", id).single(),
      supabase
        .from("reading_sessions")
        .select("*")
        .eq("book_id", id)
        .order("started_at", { ascending: false }),
      supabase
        .from("book_tags")
        .select("tag_id, tags(id, name)")
        .eq("book_id", id),
      supabase
        .from("tags")
        .select("id, name")
        .eq("user_id", user.id)
        .order("created_at"),
      supabase
        .from("session_memos")
        .select("session_id, id, page_number, content")
        .eq("book_id", id),
    ]);

  const bookTags: Tag[] = (bookTagRows ?? [])
    .map((r) => {
      const t = r.tags as unknown as { id: string; name: string } | null;
      return t ? { id: t.id, name: t.name } : null;
    })
    .filter(Boolean) as Tag[];

  const allTags: Tag[] = (allTagRows ?? []) as Tag[];

  if (!book) redirect("/shelf");

  const b = book as {
    id: string;
    title: string;
    author: string;
    cover_url: string | null;
    total_pages: number;
    current_page: number;
    status: "reading" | "rereading" | "to_read" | "finished";
    description: string | null;
    started_at: string | null;
    finished_at: string | null;
    read_count: number;
    rating: number | null;
    review: string | null;
  };

  type SessionMemo = { id: string; page_number: number; content: string };

  const memosBySession = new Map<string, SessionMemo[]>();
  for (const m of (memoRows ?? [])) {
    const list = memosBySession.get(m.session_id) ?? [];
    list.push({ id: m.id, page_number: m.page_number, content: m.content });
    memosBySession.set(m.session_id, list);
  }

  const pct =
    b.total_pages > 0
      ? Math.min(100, Math.round((b.current_page / b.total_pages) * 100))
      : 0;
  const remaining = Math.max(0, b.total_pages - b.current_page);

  const totalSeconds =
    sessions?.reduce((sum, s) => sum + (s.duration_seconds ?? 0), 0) ?? 0;

  // セッションのあった日（JST、重複除去）
  const sessionDates = [
    ...new Set(
      sessions?.map((s) =>
        new Date(new Date(s.started_at).getTime() + 9 * 3600 * 1000)
          .toISOString()
          .slice(0, 10)
      ) ?? []
    ),
  ];

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

        {/* Tags */}
        <div className="mb-5">
          <TagPicker bookId={b.id} bookTags={bookTags} allTags={allTags} />
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

        {/* Page display */}
        <div className="flex gap-5 mb-6">
          <div className="flex-1">
            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
              Current Page
            </p>
            <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
              <span className="font-cormorant text-[16px] text-muted-2">p.</span>
              <span className="font-cormorant text-[28px] text-ink leading-none tracking-[-0.02em]">
                {b.current_page}
              </span>
            </div>
          </div>
          <div className="flex-1">
            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
              Total Pages
            </p>
            <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
              <span className="font-cormorant text-[16px] text-muted-2">p.</span>
              <span className="font-cormorant text-[28px] text-ink leading-none tracking-[-0.02em]">
                {b.total_pages > 0 ? b.total_pages : "—"}
              </span>
            </div>
          </div>
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
          <div className="flex-1 bg-bg rounded-sm p-3">
            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1.5">
              Times Read
            </p>
            <span className="font-cormorant text-[22px] text-ink tracking-[-0.01em]">
              {b.read_count ?? 0}
              <span className="font-zen text-[12px] text-muted ml-1">回</span>
            </span>
          </div>
        </div>

        {/* Rating */}
        <div className="mb-6">
          <RatingSection bookId={b.id} initialRating={b.rating} />
        </div>

        {/* Review */}
        <div className="mb-6">
          <BookReviewSection bookId={b.id} initialReview={b.review} />
        </div>

        {/* Reading CTA */}
        <StartReadingButton
          bookId={b.id}
          isFirstEver={!sessions?.length && (b.read_count ?? 0) === 0}
          totalPages={b.total_pages}
        />

        {/* Reading history */}
        <div>
          <ManualSessionForm
            bookId={b.id}
            currentPage={b.current_page}
            totalPages={b.total_pages}
            sessionDates={sessionDates}
          />
          {sessions && sessions.length > 0 ? (
            <ul>
              {sessions.map((s) => {
                const pagesRead = (s.end_page ?? 0) - (s.start_page ?? 0);
                const memos = memosBySession.get(s.id) ?? [];
                return (
                  <li key={s.id} className="border-t border-line py-3.5">
                    <div className="flex justify-between items-center">
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
                    </div>
                    {memos.length > 0 && (
                      <ul className="mt-2 flex flex-col gap-1">
                        {memos.map((m) => (
                          <li key={m.id} className="flex gap-2">
                            <span className="font-cormorant text-[12px] text-muted-2 shrink-0">
                              p.{m.page_number}
                            </span>
                            <span className="font-zen text-[12px] text-muted-2 leading-[1.7]">
                              {m.content}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
              <li className="border-t border-line" />
            </ul>
          ) : (
            <p className="font-zen text-[12px] text-muted-2">記録なし</p>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
