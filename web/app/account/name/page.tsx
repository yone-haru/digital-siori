"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDisplayName } from "@/app/account/actions";

const DARK_LINE = "rgba(255,255,255,0.08)";
const W_92 = "rgba(255,255,255,0.92)";
const W_55 = "rgba(255,255,255,0.55)";
const W_35 = "rgba(255,255,255,0.35)";

export default function DisplayNamePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await updateDisplayName(name);
      if (res && "error" in res) {
        setError(res.error ?? null);
      } else {
        router.push("/account");
      }
    });
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#0F0D0A" }}>
      {/* Top bar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "12px 28px",
      }}>
        <button
          onClick={() => router.back()}
          style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 13, color: W_55, background: "none", border: "none", cursor: "pointer" }}
        >
          キャンセル
        </button>
        <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 10, letterSpacing: "0.28em", color: W_55 }}>
          DISPLAY NAME
        </span>
        <button
          onClick={handleSave}
          disabled={isPending || !name.trim()}
          style={{
            fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 13,
            color: (!name.trim() || isPending) ? "rgba(255,255,255,0.25)" : W_92,
            fontWeight: 500, background: "none", border: "none", cursor: "pointer",
          }}
        >
          {isPending ? "..." : "保存"}
        </button>
      </div>

      {/* Input */}
      <div style={{ padding: "40px 28px 0" }}>
        <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: W_35 }}>
          NAME
        </span>
        <div style={{ marginTop: 14, paddingBottom: 14, borderBottom: `1.5px solid ${W_92}` }}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 20))}
            maxLength={20}
            placeholder="表示名を入力"
            style={{
              width: "100%", background: "none", border: "none", outline: "none",
              fontFamily: "Shippori Mincho, serif", fontSize: 28, fontWeight: 500,
              color: W_92, letterSpacing: "0.04em",
            }}
          />
        </div>
        <div style={{
          display: "flex", justifyContent: "space-between", marginTop: 14,
          fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 11, color: W_35,
        }}>
          <span>本棚やレビューに表示されます</span>
          <span style={{ fontFamily: "Cormorant Garamond, serif" }}>{name.length} / 20</span>
        </div>
        {error && (
          <p style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 11, color: "#C77B6F", marginTop: 12 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
