"use client";

import { useState, useTransition } from "react";
import { addManualSession } from "@/app/books/[id]/actions";

type Props = { bookId: string; currentPage: number };

export function ManualSessionForm({ bookId, currentPage }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [startPage, setStartPage] = useState(String(currentPage));
  const [endPage, setEndPage] = useState("");
  const [hours, setHours] = useState("0");
  const [mins, setMins] = useState("30");
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sp = Number(startPage);
    const ep = Number(endPage);
    const totalMins = Number(hours) * 60 + Number(mins);

    if (!date) return setMessage({ ok: false, text: "日付を選択してください" });
    if (!Number.isInteger(sp) || sp < 0) return setMessage({ ok: false, text: "開始ページを正しく入力してください" });
    if (!Number.isInteger(ep) || ep < 0) return setMessage({ ok: false, text: "終了ページを正しく入力してください" });
    if (totalMins <= 0) return setMessage({ ok: false, text: "読書時間を入力してください" });

    setMessage(null);
    startTransition(async () => {
      const result = await addManualSession(bookId, { date, startPage: sp, endPage: ep, durationMinutes: totalMins });
      if (result?.error) {
        setMessage({ ok: false, text: result.error });
      } else {
        setMessage({ ok: true, text: "記録しました" });
        setEndPage("");
        setTimeout(() => { setIsOpen(false); setMessage(null); }, 1200);
      }
    });
  }

  return (
    <div className="border-t border-line pt-4 mb-7">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1"
      >
        <span className="font-zen text-[11px] tracking-[0.12em] text-muted">
          手動で記録を追加する
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`text-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && (
        <form onSubmit={handleSubmit} className="pt-5 flex flex-col gap-5">
          {/* Date */}
          <div>
            <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-transparent border-b border-line pb-2 outline-none font-cormorant text-[18px] text-ink focus:border-ink transition-colors"
            />
          </div>

          {/* Pages */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                Start Page
              </label>
              <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
                <span className="font-cormorant text-[14px] text-muted-2">p.</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={startPage}
                  onChange={(e) => setStartPage(e.target.value)}
                  min="0"
                  className="w-full bg-transparent outline-none font-cormorant text-[22px] text-ink leading-none"
                />
              </div>
            </div>
            <div className="flex-1">
              <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                End Page
              </label>
              <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
                <span className="font-cormorant text-[14px] text-muted-2">p.</span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={endPage}
                  onChange={(e) => setEndPage(e.target.value)}
                  min="0"
                  placeholder="—"
                  className="w-full bg-transparent outline-none font-cormorant text-[22px] text-ink leading-none placeholder:text-muted-2"
                />
              </div>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
              Duration
            </label>
            <div className="flex items-baseline gap-2">
              <input
                type="number"
                inputMode="numeric"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                min="0"
                max="23"
                className="w-12 bg-transparent border-b border-line pb-1.5 outline-none font-cormorant text-[22px] text-ink text-center focus:border-ink transition-colors"
              />
              <span className="font-zen text-[12px] text-muted">h</span>
              <input
                type="number"
                inputMode="numeric"
                value={mins}
                onChange={(e) => setMins(e.target.value)}
                min="0"
                max="59"
                className="w-12 bg-transparent border-b border-line pb-1.5 outline-none font-cormorant text-[22px] text-ink text-center focus:border-ink transition-colors"
              />
              <span className="font-zen text-[12px] text-muted">m</span>
            </div>
          </div>

          {message && (
            <p className={`font-zen text-[12px] text-center ${message.ok ? "text-muted" : "text-[#7C2B28]"}`}>
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[44px] border border-ink font-zen text-[12px] tracking-[0.15em] text-ink rounded-sm disabled:opacity-40 transition-colors hover:bg-ink hover:text-paper"
          >
            {isPending ? "..." : "記録を追加する"}
          </button>
        </form>
      )}
    </div>
  );
}
