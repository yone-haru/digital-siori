"use client";

import { useState, useTransition } from "react";
import { DialInput } from "@/components/ui/dial-input";
import { CalendarPicker } from "@/components/ui/calendar-picker";
import { addManualSession } from "@/app/books/[id]/actions";

export function ManualSessionForm({
  bookId,
  currentPage,
  sessionDates,
}: {
  bookId: string;
  currentPage: number;
  sessionDates?: string[];
}) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(
    () => new Date().toLocaleDateString("sv")
  );
  const [startPage, setStartPage] = useState(Math.max(0, currentPage));
  const [endPage, setEndPage] = useState(currentPage);
  const [durationMin, setDurationMin] = useState(30);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClose() {
    setOpen(false);
    setMessage(null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) {
      setMessage("日付を選択してください");
      return;
    }
    if (endPage < startPage) {
      setMessage("終了ページは開始ページ以上にしてください");
      return;
    }
    if (durationMin < 1) {
      setMessage("読書時間は1分以上にしてください");
      return;
    }
    setMessage(null);
    startTransition(async () => {
      const res = await addManualSession(bookId, {
        date,
        startPage,
        endPage,
        durationMinutes: durationMin,
      });
      if (res && "error" in res) {
        setMessage(res.error ?? null);
      } else {
        handleClose();
        setStartPage(endPage);
      }
    });
  }

  return (
    <div>
      {/* Reading History ヘッダー行（常に表示） */}
      <div className="flex justify-between items-center mb-4">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
          Reading History
        </p>
        {!open && (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 font-zen text-[11px] text-muted-2 hover:text-ink transition-colors"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path
                d="M5.5 1v9M1 5.5h9"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            記録を追加
          </button>
        )}
      </div>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="border border-line rounded-sm p-4 flex flex-col gap-4 mb-4"
        >
          <div className="flex justify-between items-center">
            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
              Manual Entry
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="font-zen text-[11px] text-muted-2 hover:text-ink transition-colors"
            >
              キャンセル
            </button>
          </div>

          {/* Date */}
          <div>
            <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
              Date
            </label>
            <CalendarPicker
              value={date}
              onChange={setDate}
              max={new Date().toLocaleDateString("sv")}
              markedDates={sessionDates}
              trigger={
                <div className="border-b border-line pb-1.5">
                  <span className="font-zen text-[14px] text-ink">
                    {date
                      ? `${date.slice(0, 4)}年${parseInt(date.slice(5, 7))}月${parseInt(date.slice(8, 10))}日`
                      : "日付を選択"}
                  </span>
                </div>
              }
            />
          </div>

          {/* Pages */}
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                Start Page
              </label>
              <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
                <span className="font-cormorant text-[14px] text-muted-2">p.</span>
                <DialInput
                  value={startPage}
                  onChange={setStartPage}
                  className="w-full font-cormorant text-[24px] text-ink leading-none tracking-[-0.02em]"
                />
              </div>
            </div>
            <div>
              <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                End Page
              </label>
              <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
                <span className="font-cormorant text-[14px] text-muted-2">p.</span>
                <DialInput
                  value={endPage}
                  onChange={setEndPage}
                  className="w-full font-cormorant text-[24px] text-ink leading-none tracking-[-0.02em]"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
              Duration
            </label>
            <div className="flex items-baseline gap-1.5 border-b border-line pb-1.5">
              <DialInput
                value={durationMin}
                onChange={setDurationMin}
                min={1}
                className="w-14 font-cormorant text-[24px] text-ink leading-none tracking-[-0.02em]"
              />
              <span className="font-cormorant text-[16px] text-muted-2">min</span>
            </div>
          </div>

          {message && (
            <p className="font-zen text-[11px] text-[#7C2B28]">{message}</p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[44px] border border-ink font-zen text-[12px] tracking-[0.15em] text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 rounded-sm"
          >
            {isPending ? "保存中..." : "記録する"}
          </button>
        </form>
      )}
    </div>
  );
}
