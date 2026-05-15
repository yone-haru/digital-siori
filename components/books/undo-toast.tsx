"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { deleteBook } from "@/app/books/[id]/actions";

export function UndoToast({ bookId, title }: { bookId: string; title: string }) {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(async () => {
      await deleteBook(bookId);
      router.replace("/shelf");
    }, 5000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bookId, router]);

  function handleUndo() {
    if (timerRef.current) clearTimeout(timerRef.current);
    router.replace("/shelf");
  }

  return (
    <div
      className="fixed left-5 right-5 z-[60] bg-ink rounded-sm flex items-center justify-between gap-3.5 px-[18px] py-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.25)]"
      style={{ bottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 12px)" }}
    >
      <p className="font-shippori text-[13px] text-paper leading-snug flex-1 min-w-0 truncate">
        「{title}」を削除しました
      </p>
      <button
        onClick={handleUndo}
        className="font-zen text-[11px] tracking-[0.18em] text-paper border-b border-paper pb-px whitespace-nowrap shrink-0"
      >
        元に戻す
      </button>
    </div>
  );
}
