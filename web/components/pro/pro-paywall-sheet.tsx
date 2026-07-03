"use client";

import { useState } from "react";
import { FREE_LIMITS } from "@/lib/limits";

const COMPARISON = [
  { label: "本棚の冊数", free: `${FREE_LIMITS.books}冊`, pro: "無制限" },
  { label: "タグ", free: `${FREE_LIMITS.tags}個`, pro: "無制限" },
  { label: "セッション履歴", free: `${FREE_LIMITS.sessionsPerBook}件`, pro: "無制限" },
  { label: "統計の表示期間", free: `${FREE_LIMITS.statsMonths}ヶ月`, pro: "全期間" },
];

type Props = {
  open: boolean;
  canPurchase: boolean;
  onClose: () => void;
  onPurchase: (plan: "monthly" | "yearly") => Promise<void>;
  onRefresh: () => Promise<void>;
};

export function ProPaywallSheet({ open, canPurchase, onClose, onPurchase, onRefresh }: Props) {
  const [buying, setBuying] = useState<"monthly" | "yearly" | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  if (!open) return null;

  const busy = buying !== null || refreshing;

  async function handlePurchase(plan: "monthly" | "yearly") {
    setBuying(plan);
    await onPurchase(plan);
    setBuying(null);
    onClose();
  }

  async function handleRefresh() {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <button
        aria-label="閉じる"
        onClick={() => { if (!busy) onClose(); }}
        className="absolute inset-0 bg-black/40 cursor-default"
      />

      {/* Sheet */}
      <div className="relative w-full max-w-md mx-auto bg-paper rounded-t-[20px] px-7 pt-7 pb-12">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <span className="bg-ink text-paper font-zen text-[10px] tracking-[0.25em] px-2.5 py-[3px] rounded-full mb-3">
            PRO
          </span>
          <h2 className="font-shippori text-[24px] text-ink mb-1.5">Yondle Pro</h2>
          <p className="font-zen text-[12px] text-muted">読書体験をもっと自由に</p>
        </div>

        {/* Free vs Pro comparison */}
        <div className="mb-6">
          <div className="flex pb-2 border-b border-line">
            <div className="flex-[1.3]" />
            <span className="flex-1 font-zen text-[10px] tracking-[0.15em] text-muted-2 text-center uppercase">無料</span>
            <span className="flex-1 font-zen text-[10px] tracking-[0.15em] text-ink text-center uppercase">PRO</span>
          </div>
          {COMPARISON.map((row) => (
            <div key={row.label} className="flex items-center py-3 border-b border-line-2">
              <span className="flex-[1.3] font-zen text-[12px] text-ink-2">{row.label}</span>
              <span className="flex-1 font-cormorant text-[14px] text-muted text-center">{row.free}</span>
              <span className="flex-1 font-zen text-[14px] font-medium text-ink text-center">{row.pro}</span>
            </div>
          ))}
        </div>

        {canPurchase ? (
          <>
            {/* Yearly (recommended) */}
            <button
              onClick={() => handlePurchase("yearly")}
              disabled={busy}
              className="w-full h-[54px] bg-ink rounded flex items-center justify-center gap-2.5 mb-2.5 disabled:opacity-50"
            >
              {buying === "yearly" ? (
                <span className="font-zen text-[13px] text-paper">処理中...</span>
              ) : (
                <>
                  <span className="font-zen text-[15px] font-medium tracking-[0.06em] text-paper">年額 ¥2,400</span>
                  <span className="bg-white/20 text-paper font-zen text-[10px] px-2 py-0.5 rounded-full">2ヶ月分お得</span>
                </>
              )}
            </button>

            {/* Monthly */}
            <button
              onClick={() => handlePurchase("monthly")}
              disabled={busy}
              className="w-full h-[50px] border border-line rounded flex items-center justify-center mb-4 disabled:opacity-50"
            >
              <span className="font-zen text-[13px] tracking-[0.06em] text-ink">
                {buying === "monthly" ? "処理中..." : "月額 ¥360"}
              </span>
            </button>
          </>
        ) : (
          <p className="font-zen text-[12px] text-muted leading-relaxed text-center mb-4">
            Web でのご購入は現在準備中です。
            <br />
            モバイルアプリで Pro をご購入いただくと、
            同じアカウントで Web でも Pro が有効になります。
          </p>
        )}

        {/* Refresh entitlement */}
        <button
          onClick={handleRefresh}
          disabled={busy}
          className="w-full flex justify-center disabled:opacity-50"
        >
          <span className="font-zen text-[11px] text-muted-2 underline">
            {refreshing ? "確認中..." : "購入状態を更新"}
          </span>
        </button>
      </div>
    </div>
  );
}
