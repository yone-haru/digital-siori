"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveReadingSession } from "@/app/books/[id]/reading/actions";
import { DialInput } from "@/components/ui/dial-input";
import { getActiveSession, saveActiveSession, clearActiveSession } from "@/lib/active-session";

const BRIGHT = "rgba(255,255,255,0.92)";
const DIM = "rgba(255,255,255,0.55)";

type PendingMemo = { pageNumber: number; content: string };

type Props = {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  startPage: number;
  totalPages?: number;
};

type SavedResult = { durationSeconds: number; pagesRead: number };

export function ReadingTimer({ bookId, bookTitle, bookAuthor, startPage, totalPages }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [currentPage, setCurrentPage] = useState(startPage);
  const [phase, setPhase] = useState<"running" | "confirm" | "saving" | "saved">("running");
  const [error, setError] = useState<string | null>(null);
  const [savedResult, setSavedResult] = useState<SavedResult | null>(null);

  // メモ
  const [pendingMemos, setPendingMemos] = useState<PendingMemo[]>([]);
  const [memoOpen, setMemoOpen] = useState(false);
  const [memoPage, setMemoPage] = useState(startPage);
  const [memoText, setMemoText] = useState("");

  const router = useRouter();
  const mountTime = useRef(Date.now());
  const startedAt = useRef(new Date().toISOString());
  const frozenElapsed = useRef(0);

  // 強制終了などで残っていた読書セッションのスナップショットがあれば、その開始時刻から復元する
  // （localStorage は SSR で読めないため、マウント後の useEffect でのみ判定する）
  useEffect(() => {
    const resume = getActiveSession();
    if (resume && resume.bookId === bookId) {
      const initialElapsed = Math.max(
        0,
        Math.floor((Date.now() - new Date(resume.startedAt).getTime()) / 1000)
      );
      startedAt.current = resume.startedAt;
      mountTime.current = Date.now() - initialElapsed * 1000;
      setElapsed(initialElapsed);
    }
    saveActiveSession({
      bookId,
      bookTitle,
      bookAuthor,
      startPage,
      totalPages: totalPages ?? 0,
      startedAt: startedAt.current,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (currentPage < 0) {
      setError("有効なページ数を入力してください");
      return;
    }
    setError(null);
    setPhase("saving");

    const result = await saveReadingSession({
      bookId,
      startPage,
      endPage: currentPage,
      startedAt: startedAt.current,
      endedAt: new Date().toISOString(),
      durationSeconds: frozenElapsed.current,
      memos: pendingMemos,
    });

    if (result && "error" in result) {
      setError(result.error);
      setPhase("confirm");
    } else if (result && "success" in result) {
      // 正常に記録できたので、復元用スナップショットはもう不要
      clearActiveSession();
      setSavedResult({ durationSeconds: result.durationSeconds, pagesRead: result.pagesRead });
      setPhase("saved");
    }
  }, [bookId, startPage, currentPage, pendingMemos]);

  // 記録せずに離脱する場合はスナップショットを破棄する（本棚に復元バナーを残さない）
  function handleDiscard() {
    clearActiveSession();
  }

  function handleOpenMemo() {
    setMemoPage(currentPage);
    setMemoText("");
    setMemoOpen(true);
  }

  function handleSaveMemo() {
    if (memoText.trim()) {
      setPendingMemos((prev) => [...prev, { pageNumber: memoPage, content: memoText.trim() }]);
    }
    setMemoOpen(false);
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <div className="min-h-screen bg-[#0F0D0A] flex flex-col select-none">
      {/* ── Top bar ── */}
      <div className="flex justify-between items-center px-7 py-3 shrink-0">
        <Link
          href={`/books/${bookId}`}
          onClick={handleDiscard}
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
          className="pt-5 pb-5"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          {/* Pages row */}
          <div className="flex justify-between items-end">
            {/* Start page */}
            <div>
              <p className="font-zen text-[10px] tracking-[0.22em] text-white/35 uppercase mb-2">
                Started At
              </p>
              <span className="font-cormorant text-[22px] font-light" style={{ color: DIM }}>
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

            {/* Current page */}
            <div className="text-right">
              <p className="font-zen text-[10px] tracking-[0.22em] text-white/35 uppercase mb-2">
                {phase === "confirm" || phase === "saving" ? "終了ページ" : "Current"}
              </p>
              <div className="flex items-baseline gap-0.5 justify-end">
                <span className="font-cormorant text-[16px] font-light" style={{ color: "rgba(255,255,255,0.35)" }}>
                  p.
                </span>
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.3)" }} className="pb-0.5">
                  <DialInput
                    value={currentPage}
                    onChange={setCurrentPage}
                    min={startPage}
                    max={totalPages && totalPages > 0 ? totalPages : undefined}
                    disabled={phase === "saving"}
                    className="font-cormorant text-[28px] font-light tracking-[-0.02em]"
                    style={{ color: BRIGHT }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* + メモ ボタン（running中のみ） */}
          {phase === "running" && (
            <div className="flex justify-center mt-5">
              <button
                onClick={handleOpenMemo}
                className="flex items-center gap-1.5 font-zen text-[11px] tracking-[0.1em] transition-colors"
                style={{ color: "rgba(255,255,255,0.40)" }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                </svg>
                メモ
                {pendingMemos.length > 0 && (
                  <span className="font-cormorant text-[12px]" style={{ color: "rgba(255,255,255,0.30)" }}>
                    {pendingMemos.length}
                  </span>
                )}
              </button>
            </div>
          )}
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

      {/* ── メモ ボトムシート ── */}
      {memoOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMemoOpen(false)}
          />
          <div className="relative bg-paper rounded-t-sm px-7 pt-6 pb-10 shadow-[0_-8px_40px_rgba(0,0,0,0.2)]">
            {/* ハンドル */}
            <div className="w-10 h-[3px] bg-line rounded-full mx-auto mb-6" />

            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-4">
              Memo
            </p>

            {/* ページ数 */}
            <div className="mb-4">
              <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                Page
              </label>
              <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
                <span className="font-cormorant text-[14px] text-muted-2">p.</span>
                <DialInput
                  value={memoPage}
                  onChange={setMemoPage}
                  min={0}
                  max={totalPages && totalPages > 0 ? totalPages : undefined}
                  className="w-full font-cormorant text-[24px] text-ink leading-none tracking-[-0.02em]"
                />
              </div>
            </div>

            {/* メモテキスト */}
            <div className="mb-5">
              <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                Note
              </label>
              <textarea
                autoFocus
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder="メモを入力..."
                rows={4}
                className="w-full bg-transparent outline-none resize-none font-zen text-[14px] text-ink leading-[1.8] border-b border-line pb-2 placeholder:text-muted-2"
              />
            </div>

            {/* ボタン */}
            <div className="flex gap-3">
              <button
                onClick={() => setMemoOpen(false)}
                className="flex-1 h-[44px] border border-line font-zen text-[12px] tracking-[0.1em] text-muted rounded-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleSaveMemo}
                className="flex-1 h-[44px] bg-ink font-zen text-[12px] tracking-[0.1em] text-paper rounded-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

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
