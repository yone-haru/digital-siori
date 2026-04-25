"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-7 text-center">
      <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-4">
        Error
      </p>
      <h1 className="font-shippori text-[28px] font-medium text-ink mb-3 leading-snug">
        問題が発生しました
      </h1>
      <p className="font-zen text-[13px] text-muted mb-8 leading-[1.8]">
        ページの読み込み中にエラーが起きました。
        <br />
        再試行するか、本棚に戻ってください。
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-ink text-paper font-zen text-[12px] tracking-[0.1em] rounded-sm hover:opacity-85 transition-opacity"
        >
          再試行
        </button>
        <Link
          href="/shelf"
          className="px-5 py-2.5 border border-line text-ink font-zen text-[12px] tracking-[0.1em] rounded-sm hover:border-ink transition-colors"
        >
          本棚へ
        </Link>
      </div>
    </div>
  );
}
