"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DialInput } from "@/components/ui/dial-input";
import { initBookRead } from "@/app/books/[id]/actions";

export function StartReadingButton({
  bookId,
  isFirstEver,
  totalPages = 0,
}: {
  bookId: string;
  isFirstEver: boolean;
  totalPages?: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [prevCount, setPrevCount] = useState(0);
  const [startPage, setStartPage] = useState(0);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!isFirstEver) {
      router.push(`/books/${bookId}/reading`);
    } else {
      setOpen(true);
    }
  }

  function goFirstTime() {
    setOpen(false);
    router.push(`/books/${bookId}/reading`);
  }

  function goNotFirstTime() {
    startTransition(async () => {
      await initBookRead(bookId, { prevReadCount: prevCount, startPage });
      setOpen(false);
      router.push(`/books/${bookId}/reading`);
    });
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="flex items-center justify-center gap-2.5 w-full h-[52px] bg-ink text-paper font-zen text-[13px] tracking-[0.15em] rounded-sm mb-7 hover:opacity-90 transition-opacity"
      >
        読書をはじめる
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <polygon points="3,2 12,7 3,12" fill="currentColor" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <div className="relative bg-paper w-full rounded-t-sm px-7 pt-8 pb-12 shadow-[0_-8px_40px_rgba(0,0,0,0.12)]">
            <p className="font-shippori text-[20px] font-medium text-ink leading-[1.4] mb-1">
              この本を読むのは
              <br />はじめてですか？
            </p>
            <p className="font-zen text-[11px] text-muted mb-7 leading-[1.7]">
              以前読んだことがある場合、記録を追加できます。
            </p>

            <button
              onClick={goFirstTime}
              className="w-full h-[48px] bg-ink text-paper font-zen text-[12px] tracking-[0.15em] rounded-sm mb-5 hover:opacity-90 transition-opacity"
            >
              はじめて読む
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-line" />
              <span className="font-zen text-[10px] text-muted tracking-[0.12em]">または</span>
              <div className="flex-1 h-px bg-line" />
            </div>

            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-4">
              以前も読んだことがある
            </p>

            <div className="grid grid-cols-2 gap-5 mb-6">
              <div>
                <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                  読了回数
                </label>
                <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
                  <DialInput
                    value={prevCount}
                    onChange={setPrevCount}
                    min={0}
                    className="w-14 font-cormorant text-[24px] text-ink leading-none tracking-[-0.02em]"
                  />
                  <span className="font-zen text-[13px] text-muted-2">回</span>
                </div>
              </div>
              <div>
                <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                  現在のページ
                </label>
                <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
                  <span className="font-cormorant text-[14px] text-muted-2">p.</span>
                  <DialInput
                    value={startPage}
                    onChange={setStartPage}
                    max={totalPages > 0 ? totalPages : undefined}
                    className="w-full font-cormorant text-[24px] text-ink leading-none tracking-[-0.02em]"
                  />
                </div>
              </div>
            </div>

            <button
              onClick={goNotFirstTime}
              disabled={isPending}
              className="w-full h-[48px] border border-ink font-zen text-[12px] tracking-[0.15em] text-ink hover:bg-ink hover:text-paper transition-colors disabled:opacity-40 rounded-sm"
            >
              {isPending ? "..." : "前回の続きから読む"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
