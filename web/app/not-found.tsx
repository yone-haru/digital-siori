import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-7 text-center">
      <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-4">
        404
      </p>
      <h1 className="font-shippori text-[28px] font-medium text-ink mb-3 leading-snug">
        ページが見つかりません
      </h1>
      <p className="font-zen text-[13px] text-muted mb-8 leading-[1.8]">
        お探しのページは存在しないか、
        <br />
        移動した可能性があります。
      </p>
      <Link
        href="/shelf"
        className="px-6 py-2.5 bg-ink text-paper font-zen text-[12px] tracking-[0.15em] rounded-sm hover:opacity-85 transition-opacity"
      >
        本棚へ戻る
      </Link>
    </div>
  );
}
