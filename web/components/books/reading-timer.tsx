"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveReadingSession } from "@/app/books/[id]/reading/actions";

const BRIGHT = "rgba(255,255,255,0.92)";
const DIM = "rgba(255,255,255,0.55)";

type Props = {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  startPage: number;
};

type SavedResult = { durationSeconds: number; pagesRead: number };

export function ReadingTimer({ bookId, bookTitle, bookAuthor, startPage }: Props) {
  const [elapsed, setElapsed] = useState(0); // 秒
  const [isRunning, setIsRunning] = useState(true);
  const [currentPage, setCurrentPage] = useState(String(startPage));
  const [phase, setPhase] = useState<"running" | "confirm" | "saving" | "saved">("running");
  const [error, setError] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null);
  const router = useRouter();

  // マウント時刻を start とする（ref に保持してリレンダーの影響を受けない）
  const mountTime = useRef(Date.now());
  const startedAt = useRef(new Date().toISOString());
  const frozenElapsed = useRef(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - mountTime.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const handleStop = useCallback(() => {
    frozenElapsed.current = elapsed;
    setIsRunning(false);
    setPhase("confirm");
  }, [elapsed]);

  const handleSave = useCallback(async () => {
    const n = Number(currentPage);
    if (!Number.isInteger(n) || n < 0) {
      setError("有効なページ数を入力してください");
      return;
    }
    setError(null);
    setPhase("saving");

    const result = await saveReadingSession({
      bookId,
      startPage,
      endPage: n,
      startedAt: startedAt.current,
      endedAt: new Date().toISOString(),
      durationSeconds: frozenElapsed.current,
    });

    if (result && "error" in result) {
      setError(result.error);
      setPhase("confirm");
    } else if (result && "success" in result) {
      setSavedResult({ durationSeconds: result.durationSeconds, pagesRead: result.pagesRead });
      setPhase("saved");
    }
  }, [bookId, startPage, currentPage]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="min-h-screen bg-[#0F0D0A] flex flex-col select-none">
      {/* ── Top bar ── */}
      <div className="flex justify-between items-center px-7 py-3 shrink-0">
        <Link
          href={`/books/${bookId}`}
          className="text-white/60 hover:text-white/90 transition-colors"
          aria-label="戻る"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M6 6l10 10M16 6L6 16"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </Link>
        <span className="font-zen text-[10px] tracking-[0.22em] text-white/40 uppercase">
          Now Reading
        </span>
        <div className="w-[22px]" />
      </div>

      {/* ── Book info ── */}
      <div className="text-center px-7 pt-6">
        <p className="font-zen text-[11px] tracking-[0.22em] text-white/35 uppercase mb-2 truncate">
          {bookAuthor}
        </p>
        <p className="font-shippori text-[22px] font-medium tracking-[0.05em] line-clamp-2" style={{ color: BRIGHT }}>
          {bookTitle}
        </p>
      </div>

      {/* ── Timer hero ── */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <p className="font-zen text-[10px] tracking-[0.22em] text-white/35 uppercase mb-5">
          Elapsed
        </p>

        <div className="flex items-baseline gap-1">
          <span
            className="font-cormorant text-[96px] font-light leading-none tracking-[-0.03em]"
            style={{ color: BRIGHT }}
          >
            {minutes}
          </span>
          <span
            className="font-cormorant text-[36px] font-light leading-none tracking-[-0.02em]"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            :{String(seconds).padStart(2, "0")}
          </span>
        </div>

        <p className="font-zen text-[10px] tracking-[0.28em] text-white/30 mt-2.5">
          MINUTES · SECONDS
        </p>

        {/* Pulse indicator */}
        <div className="flex items-center gap-2 mt-7">
          <div
            className={`w-[7px] h-[7px] rounded-full transition-all ${
              isRunning
                ? "bg-white/70 animate-pulse shadow-[0_0_12px_rgba(255,255,255,0.5)]"
                : "bg-white/20"
            }`}
          />
          <span className="font-zen text-[10px] tracking-[0.22em] text-white/40 uppercase">
            {isRunning ? "Reading" : "Paused"}
          </span>
        </div>
      </div>

      {/* ── Bottom section ── */}
      <div className="px-7 pb-8 shrink-0">
        <div
          className="pt-5 pb-5 mb-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Pages row */}
          <div className="flex justify-between items-end">
            {/* Start page */}
            <div>
              <p className="font-zen text-[10px] tracking-[0.22em] text-white/35 uppercase mb-2">
                Started At
              </p>
              <span
                className="font-cormorant text-[22px] font-light"
                style={{ color: DIM }}
              >
                p. {startPage}
              </span>
            </div>

            {/* Arrow */}
            <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <path
                d="M1 6h18M13 1l6 5-6 5"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Current page (editable) */}
            <div className="text-right">
              <p className="font-zen text-[10px] tracking-[0.22em] text-white/35 uppercase mb-2">
                {phase === "confirm" || phase === "saving" ? "終了ページ" : "Current"}
              </p>
              <div className="flex items-baseline gap-0.5 justify-end">
                <span
                  className="font-cormorant text-[16px] font-light"
                  style={{ color: "rgba(255,255,255,0.35)" }}
                >
                  p.
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  disabled={phase === "saving"}
                  className="w-16 bg-transparent outline-none text-right font-cormorant text-[28px] font-light tracking-[-0.02em] pb-0.5 disabled:opacity-60"
                  style={{
                    color: BRIGHT,
                    borderBottom: "1px solid rgba(255,255,255,0.3)",
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <p className="font-zen text-[12px] text-[#C8624E] text-center mb-3">
            {error}
          </p>
        )}

        {/* Confirm hint */}
        {phase === "confirm" && (
          <p className="font-zen text-[11px] text-white/30 text-center mb-3">
            終了ページを確認して「記録する」を押してください
          </p>
        )}

        {/* Action button */}
        {phase === "running" && (
          <button
            onClick={handleStop}
            className="w-full h-[52px] bg-paper rounded-sm font-zen text-[13px] tracking-[0.15em] text-ink font-medium"
          >
            読書をおわる
          </button>
        )}
        {(phase === "confirm" || phase === "saving") && (
          <button
            onClick={handleSave}
            disabled={phase === "saving"}
            className="w-full h-[52px] bg-paper rounded-sm font-zen text-[13px] tracking-[0.15em] text-ink font-medium disabled:opacity-50 transition-opacity"
          >
            {phase === "saving" ? "保存中..." : "記録する"}
          </button>
        )}
      </div>

      {/* ── Session saved modal ── */}
      {phase === "saved" && savedResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-8 bg-[#0F0D0A]/80">
          <div className="w-full max-w-[320px] bg-paper rounded-sm px-7 py-8 flex flex-col items-center gap-0">
            <p className="font-zen text-[10px] tracking-[0.28em] text-muted uppercase mb-5">
              Session Saved
            </p>
            <div className="w-full border-t border-line mb-5" />

            <div className="w-full flex flex-col gap-3 mb-5">
              <div className="flex justify-between items-baseline">
                <span className="font-zen text-[11px] tracking-[0.12em] text-muted">時間</span>
                <span className="font-cormorant text-[20px] text-ink">
                  {savedResult.durationSeconds >= 3600
                    ? `${Math.floor(savedResult.durationSeconds / 3600)}h ${Math.floor((savedResult.durationSeconds % 3600) / 60)}m`
                    : `${Math.floor(savedResult.durationSeconds / 60)}m ${savedResult.durationSeconds % 60}s`}
                </span>
              </div>
              <div className="flex justify-between items-baseline">
                <span className="font-zen text-[11px] tracking-[0.12em] text-muted">ページ</span>
                <span className="font-cormorant text-[20px] text-ink">
                  +{savedResult.pagesRead}p
                </span>
              </div>
            </div>

            <div className="w-full border-t border-line mb-6" />

            <button
              onClick={() => router.push(`/books/${bookId}`)}
              className="w-full h-[44px] bg-ink font-zen text-[12px] tracking-[0.2em] text-paper rounded-sm"
            >
              完了
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
