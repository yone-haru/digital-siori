"use client";

import { useState, useOptimistic, useTransition } from "react";
import { updateCurrentPage, updateBookStatus } from "@/app/books/[id]/actions";
import type { BookStatus } from "@/lib/supabase/types";

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: "読書中",
  to_read: "積読",
  finished: "読了",
};

const NEXT_STATUSES: Record<BookStatus, BookStatus[]> = {
  to_read: ["reading", "finished"],
  reading: ["finished", "to_read"],
  finished: ["reading", "to_read"],
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
  const [value, setValue] = useState(String(currentPage));
  const [totalValue, setTotalValue] = useState(
    totalPages > 0 ? String(totalPages) : ""
  );
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(value);
    if (isNaN(n) || n < 0 || !Number.isInteger(n)) {
      setMessage("0以上の整数を入力してください");
      return;
    }
    const total = totalValue === "" ? undefined : Number(totalValue);
    if (total !== undefined && (isNaN(total) || total < 0 || !Number.isInteger(total))) {
      setMessage("総ページ数は0以上の整数を入力してください");
      return;
    }
    if (total !== undefined && total > 0 && n > total) {
      setMessage(`総ページ数 ${total} を超えています`);
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await updateCurrentPage(bookId, n, total);
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
            <input
              type="number"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full bg-transparent outline-none font-cormorant text-[28px] text-ink leading-none tracking-[-0.02em]"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
            Total Pages
          </label>
          <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
            <span className="font-cormorant text-[16px] text-muted-2">p.</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="—"
              value={totalValue}
              onChange={(e) => setTotalValue(e.target.value)}
              className="w-full bg-transparent outline-none font-cormorant text-[28px] text-ink leading-none tracking-[-0.02em] placeholder:text-muted-2"
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
