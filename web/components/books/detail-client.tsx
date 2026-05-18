"use client";

import { useState, useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateCurrentPage, updateBookStatus, updateBookRating, updateBookReview } from "@/app/books/[id]/actions";
import { DialInput } from "@/components/ui/dial-input";
import { StarRatingInput } from "@/components/ui/star-rating";
import { formatDuration } from "@/lib/utils";
import type { BookStatus } from "@/lib/supabase/types";

/* ── 本の削除メニュー ── */
export function BookMenu({
  bookId,
  bookTitle,
  bookAuthor,
  sessionCount,
  totalSeconds,
}: {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  sessionCount: number;
  totalSeconds: number;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const router = useRouter();

  function handleDelete() {
    setSheetOpen(false);
    router.push(
      `/shelf?deleted=${bookId}&title=${encodeURIComponent(bookTitle)}`
    );
  }

  return (
    <>
      <button
        onClick={() => setMenuOpen(!menuOpen)}
        className="w-[22px] h-[22px] flex items-center justify-center"
        aria-label="メニュー"
      >
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="5" r="1.4" fill="currentColor" className="text-muted" />
          <circle cx="11" cy="11" r="1.4" fill="currentColor" className="text-muted" />
          <circle cx="11" cy="17" r="1.4" fill="currentColor" className="text-muted" />
        </svg>
      </button>

      {menuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
          <div className="absolute top-11 right-0 z-50 bg-paper border border-line rounded-sm shadow-lg py-1 min-w-[160px]">
            <button
              onClick={() => { setMenuOpen(false); setSheetOpen(true); }}
              className="w-full flex items-center gap-3 px-4 py-3 font-zen text-[13px] text-[#C77B6F] hover:bg-bg transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path
                  d="M3 5h12M7 5V3.5A1.5 1.5 0 0 1 8.5 2h1A1.5 1.5 0 0 1 11 3.5V5M5 5l.7 9.2A1.5 1.5 0 0 0 7.2 15.5h3.6a1.5 1.5 0 0 0 1.5-1.3L13 5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              本棚から削除
            </button>
          </div>
        </>
      )}

      {sheetOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setSheetOpen(false)}
          />
          <div className="relative bg-paper rounded-t-2xl px-7 pb-10 pt-3 shadow-2xl">
            <div className="w-10 h-[3px] bg-line rounded-full mx-auto mb-6" />

            <div className="mb-6 pb-5 border-b border-line">
              <p className="font-zen text-[11px] text-muted mb-1">{bookAuthor}</p>
              <p className="font-shippori text-[17px] text-ink font-medium leading-snug line-clamp-2">
                {bookTitle}
              </p>
            </div>

            <h2 className="font-shippori text-[20px] font-medium text-ink leading-relaxed mb-3">
              この本を本棚から<br />削除しますか？
            </h2>
            <p className="font-zen text-[12px] text-muted leading-relaxed mb-1">
              読書履歴{" "}
              <span className="font-cormorant text-[14px] text-ink">{sessionCount}</span>{" "}
              件、累計時間{" "}
              <span className="font-cormorant text-[14px] text-ink">{formatDuration(totalSeconds)}</span> も
            </p>
            <p className="font-zen text-[12px] text-muted leading-relaxed mb-7">
              すべて消えます。
            </p>

            <div className="flex flex-col gap-2.5">
              <button
                onClick={handleDelete}
                className="w-full h-[50px] bg-[#C77B6F] font-zen text-[13px] tracking-[0.15em] text-white rounded-sm"
              >
                削除する
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full h-[50px] border border-line font-zen text-[13px] tracking-[0.15em] text-ink rounded-sm"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: "読書中",
  rereading: "再読中",
  to_read: "未読",
  finished: "読書完了",
};

const NEXT_STATUSES: Record<BookStatus, BookStatus[]> = {
  to_read: ["reading", "finished"],
  reading: ["finished", "to_read"],
  finished: ["rereading", "to_read"],
  rereading: ["finished", "to_read"],
};

/* ── ページ数更新フォーム ── */
export function PageUpdateForm({
  bookId,
  currentPage,
  totalPages,
}: {
  bookId: string;
  currentPage: number;
  totalPages: number;
}) {
  const [value, setValue] = useState(currentPage);
  const [totalValue, setTotalValue] = useState(totalPages > 0 ? totalPages : 0);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const total = totalValue === 0 ? undefined : totalValue;
    if (total !== undefined && value > total) {
      setMessage(`総ページ数 ${total} を超えています`);
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await updateCurrentPage(bookId, value, total);
      if (res.error) setMessage(res.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
            Current Page
          </label>
          <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
            <span className="font-cormorant text-[16px] text-muted-2">p.</span>
            <DialInput
              value={value}
              onChange={setValue}
              min={0}
              max={totalValue > 0 ? totalValue : undefined}
              className="w-full font-cormorant text-[28px] text-ink leading-none tracking-[-0.02em]"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
            Total Pages
          </label>
          <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
            <span className="font-cormorant text-[16px] text-muted-2">p.</span>
            <DialInput
              value={totalValue}
              onChange={setTotalValue}
              min={0}
              placeholder="—"
              className="w-full font-cormorant text-[28px] text-ink leading-none tracking-[-0.02em]"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isPending}
          className="h-9 px-4 border border-line font-zen text-[11px] tracking-[0.1em] text-muted hover:border-ink hover:text-ink transition-colors disabled:opacity-40 rounded-sm shrink-0"
        >
          {isPending ? "..." : "更新"}
        </button>
      </div>
      {message && (
        <p className="font-zen text-[11px] text-[#7C2B28]">{message}</p>
      )}
    </form>
  );
}

/* ── 評価 ── */
export function RatingSection({
  bookId,
  initialRating,
}: {
  bookId: string;
  initialRating: number | null;
}) {
  const [rating, setRating] = useState(initialRating ?? 0);
  const [isPending, startTransition] = useTransition();

  function handleChange(newRating: number) {
    setRating(newRating);
    startTransition(async () => {
      await updateBookRating(bookId, newRating === 0 ? null : newRating);
    });
  }

  return (
    <div>
      <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2.5">
        Rating
      </p>
      <div className="flex items-center gap-3">
        <div className="text-ink">
          <StarRatingInput value={rating} onChange={handleChange} disabled={isPending} />
        </div>
        <span className="font-cormorant text-[20px] text-ink-2 leading-none w-7">
          {rating > 0 ? rating.toFixed(1) : ""}
        </span>
      </div>
    </div>
  );
}

/* ── 本の感想 ── */
export function BookReviewSection({
  bookId,
  initialReview,
}: {
  bookId: string;
  initialReview: string | null;
}) {
  const [review, setReview] = useState(initialReview ?? "");
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleBlur() {
    setEditing(false);
    startTransition(async () => {
      await updateBookReview(bookId, review);
    });
  }

  return (
    <div>
      <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2.5">
        Review
      </p>
      {editing ? (
        <textarea
          autoFocus
          value={review}
          onChange={(e) => setReview(e.target.value)}
          onBlur={handleBlur}
          placeholder="感想を書く..."
          rows={5}
          className={`w-full bg-transparent outline-none resize-none font-zen text-[13px] text-ink leading-[1.9] border-b border-line pb-2 placeholder:text-muted-2 ${isPending ? "opacity-50" : ""}`}
        />
      ) : (
        <div
          onClick={() => setEditing(true)}
          className="cursor-text min-h-[44px] border-b border-line pb-2"
        >
          {review.trim() ? (
            <p className="font-zen text-[13px] text-ink leading-[1.9] whitespace-pre-wrap">
              {review}
            </p>
          ) : (
            <p className="font-zen text-[13px] text-muted-2 leading-[1.9]">感想を書く...</p>
          )}
        </div>
      )}
    </div>
  );
}

/* ── ステータス変更ボタン群 ── */
export function StatusButtons({
  bookId,
  currentStatus,
}: {
  bookId: string;
  currentStatus: BookStatus;
}) {
  const [optimisticStatus, setOptimisticStatus] = useOptimistic(currentStatus);
  const [isPending, startTransition] = useTransition();

  const nextStatuses = NEXT_STATUSES[optimisticStatus];

  function handleChange(newStatus: BookStatus) {
    startTransition(async () => {
      setOptimisticStatus(newStatus);
      await updateBookStatus(bookId, newStatus);
    });
  }

  return (
    <div className="flex gap-2">
      {/* 現在のステータスバッジ */}
      <div className="px-3.5 py-1.5 bg-ink border border-ink rounded-sm font-zen text-[11px] tracking-[0.08em] text-paper">
        {STATUS_LABELS[optimisticStatus]}
      </div>

      {/* 変更先ボタン */}
      {nextStatuses.map((s) => (
        <button
          key={s}
          onClick={() => handleChange(s)}
          disabled={isPending}
          className="px-3.5 py-1.5 border border-ink rounded-sm font-zen text-[11px] tracking-[0.08em] text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-40"
        >
          {STATUS_LABELS[s]}にする
        </button>
      ))}
    </div>
  );
}
