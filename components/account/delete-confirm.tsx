"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAccount } from "@/app/account/actions";

const DARK_CARD = "#1A1815";
const DARK_LINE = "rgba(255,255,255,0.08)";
const W_92 = "rgba(255,255,255,0.92)";
const W_70 = "rgba(255,255,255,0.70)";
const W_55 = "rgba(255,255,255,0.55)";
const W_35 = "rgba(255,255,255,0.35)";
const DANGER = "#C77B6F";
const DARK_BG = "#0F0D0A";

export function DeleteConfirm({
  bookCount,
  sessionCount,
  totalHours,
  totalMinutes,
}: {
  bookCount: number;
  sessionCount: number;
  totalHours: number;
  totalMinutes: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteAccount();
    });
  }

  const timeLabel =
    totalHours > 0 ? `${totalHours} h ${totalMinutes} m` : `${totalMinutes} m`;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: DARK_BG }}>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 28px" }}>
        <button onClick={() => router.back()} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", color: W_55 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L6 11l8 7" stroke={W_55} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 10, letterSpacing: "0.28em", color: W_55 }}>
          DELETE ACCOUNT
        </span>
        <div style={{ width: 22 }} />
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: "28px 28px 0", overflowY: "auto" }}>
        <h2 style={{
          margin: "0 0 18px", fontFamily: "Shippori Mincho, serif",
          fontSize: 24, fontWeight: 500, color: W_92, lineHeight: 1.55, letterSpacing: "0.02em",
        }}>
          このアカウントを<br />削除しますか？
        </h2>
        <p style={{
          margin: "0 0 28px", fontFamily: "Zen Kaku Gothic New, sans-serif",
          fontSize: 13, color: W_55, lineHeight: 1.9,
        }}>
          すべての本棚・読書履歴・読書時間の記録が、復元できない形で消えます。
        </p>

        {/* Stats card */}
        <div style={{ background: DARK_CARD, borderRadius: 2, padding: "20px 22px", marginBottom: 28 }}>
          <div style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: W_35, marginBottom: 14 }}>
            WILL BE LOST
          </div>
          {[
            { label: "登録した本", value: String(bookCount), unit: "冊" },
            { label: "読書セッション", value: String(sessionCount), unit: "件" },
            { label: "累計読書時間", value: timeLabel, unit: "" },
          ].map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "baseline",
              padding: "10px 0",
              borderTop: i === 0 ? "none" : `1px solid ${DARK_LINE}`,
            }}>
              <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 13, color: W_70 }}>
                {row.label}
              </span>
              <span>
                <span style={{ fontFamily: "Cormorant Garamond, serif", fontSize: 18, color: W_92, fontWeight: 300 }}>
                  {row.value}
                </span>
                {row.unit && (
                  <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 11, color: W_55, marginLeft: 4 }}>
                    {row.unit}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 36, fontFamily: "Shippori Mincho, serif", fontSize: 14, color: W_70, lineHeight: 1.9 }}>
          この操作は取り消せません。
        </div>
      </div>

      {/* Sticky actions */}
      <div style={{ padding: "20px 28px 32px", borderTop: `1px solid ${DARK_LINE}` }}>
        <button
          onClick={handleDelete}
          disabled={isPending}
          style={{
            width: "100%", height: 52, border: "none", borderRadius: 2,
            background: DANGER, color: DARK_BG,
            fontFamily: "Zen Kaku Gothic New, sans-serif",
            fontSize: 13, letterSpacing: "0.18em", fontWeight: 500,
            cursor: "pointer", marginBottom: 10,
            opacity: isPending ? 0.5 : 1,
          }}
        >
          {isPending ? "削除中..." : "アカウントを削除する"}
        </button>
        <button
          onClick={() => router.back()}
          disabled={isPending}
          style={{
            width: "100%", height: 52, border: `1px solid ${DARK_LINE}`, borderRadius: 2,
            background: "transparent", color: W_92,
            fontFamily: "Zen Kaku Gothic New, sans-serif",
            fontSize: 13, letterSpacing: "0.18em", cursor: "pointer",
          }}
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
