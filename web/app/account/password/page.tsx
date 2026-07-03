"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updatePassword } from "@/app/account/actions";

const W_92 = "rgba(255,255,255,0.92)";
const W_55 = "rgba(255,255,255,0.55)";
const W_35 = "rgba(255,255,255,0.35)";

export default function PasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isValid = password.length >= 6 && confirm.length >= 6;

  function handleSave() {
    setError(null);

    // mobile ResetPasswordScreen と同じバリデーション順序
    if (password.length < 6) {
      setError("パスワードは6文字以上で設定してください。");
      return;
    }
    if (password !== confirm) {
      setError("確認用パスワードが一致しません。");
      return;
    }

    startTransition(async () => {
      const res = await updatePassword(password);
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
          PASSWORD
        </span>
        <button
          onClick={handleSave}
          disabled={isPending || !isValid}
          style={{
            fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 13,
            color: (!isValid || isPending) ? "rgba(255,255,255,0.25)" : W_92,
            fontWeight: 500, background: "none", border: "none", cursor: "pointer",
          }}
        >
          {isPending ? "..." : "保存"}
        </button>
      </div>

      {/* Inputs */}
      <div style={{ padding: "40px 28px 0" }}>
        <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: W_35 }}>
          NEW PASSWORD
        </span>
        <div style={{ marginTop: 14, paddingBottom: 10, borderBottom: `1.5px solid ${W_92}` }}>
          <input
            autoFocus
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="6文字以上"
            style={{
              width: "100%", background: "none", border: "none", outline: "none",
              fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 19, fontWeight: 400,
              color: W_92, letterSpacing: "0.03em",
            }}
          />
        </div>

        <span style={{ display: "block", marginTop: 28, fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: W_35 }}>
          CONFIRM PASSWORD
        </span>
        <div style={{ marginTop: 14, paddingBottom: 10, borderBottom: `1.5px solid ${W_92}` }}>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            autoCapitalize="none"
            autoCorrect="off"
            placeholder="もう一度入力"
            style={{
              width: "100%", background: "none", border: "none", outline: "none",
              fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 19, fontWeight: 400,
              color: W_92, letterSpacing: "0.03em",
            }}
          />
        </div>

        {error && (
          <p style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 11, color: "#C77B6F", marginTop: 16 }}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
