"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { logout } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/client";
import { useSubscription } from "@/components/providers/subscription-provider";

const DARK_BG = "#0F0D0A";
const DARK_CARD = "#16140F";
const DARK_LINE = "rgba(255,255,255,0.08)";
const W_92 = "rgba(255,255,255,0.92)";
const W_55 = "rgba(255,255,255,0.55)";
const W_35 = "rgba(255,255,255,0.35)";
const W_25 = "rgba(255,255,255,0.25)";
const DANGER = "#C77B6F";

function ChevronIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3l4 4-4 4" stroke={W_25} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M9 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H9" stroke={DANGER} strokeWidth="1.3" strokeLinecap="round" />
      <path d="M11 5l3 3-3 3M6 8h8" stroke={DANGER} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 4.5h10M6 4.5V3A1 1 0 0 1 7 2h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.5A1 1 0 0 0 6 14h4a1 1 0 0 0 1-1l.6-8.5"
        stroke={DANGER} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function CameraIcon({ color = W_92, size = 16 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h1.7l1-1.4a1 1 0 0 1 .8-.4h2a1 1 0 0 1 .8.4l1 1.4h1.7A1.5 1.5 0 0 1 14 5.5v6.5A1.5 1.5 0 0 1 12.5 13.5h-9A1.5 1.5 0 0 1 2 12V5.5z"
        stroke={color} strokeWidth="1.2" strokeLinejoin="round" />
      <circle cx="8" cy="8.5" r="2.4" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

function Avatar({
  size, color, letter, imageUrl, editable = false, loading = false,
}: {
  size: number; color: string; letter: string; imageUrl?: string | null;
  editable?: boolean; loading?: boolean;
}) {
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: color, display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 16px rgba(0,0,0,0.3)", overflow: "hidden",
      }}>
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <span style={{
            fontFamily: "Cormorant Garamond, Georgia, serif",
            fontSize: size * 0.42, fontWeight: 300, color: W_92,
            letterSpacing: "0.02em", lineHeight: 1,
          }}>{letter}</span>
        )}
        {loading && (
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            background: "rgba(0,0,0,0.45)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{
              width: size * 0.2, height: size * 0.2, borderRadius: "50%",
              border: "2px solid rgba(255,255,255,0.9)", borderTopColor: "transparent",
              animation: "account-avatar-spin 0.8s linear infinite",
            }} />
          </div>
        )}
      </div>
      {editable && (
        <div style={{
          position: "absolute", bottom: -2, right: -2,
          width: 30, height: 30, borderRadius: "50%",
          background: "#F7F5EF",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
          border: `2px solid ${DARK_BG}`,
        }}>
          <CameraIcon color="#0A0A0A" size={14} />
        </div>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "0 28px 12px",
      fontFamily: "Zen Kaku Gothic New, sans-serif",
      fontSize: 10, letterSpacing: "0.22em", fontWeight: 500,
      color: W_35, textTransform: "uppercase",
    }}>{children}</div>
  );
}

function Row({
  label, value, sub, danger = false, chevron = true,
  onClick, rightIcon, href,
}: {
  label: string; value?: string; sub?: string; danger?: boolean;
  chevron?: boolean; onClick?: () => void; rightIcon?: React.ReactNode; href?: string;
}) {
  const labelColor = danger ? DANGER : W_92;
  const inner = (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "18px 28px", borderTop: `1px solid ${DARK_LINE}`, gap: 16,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 14, color: labelColor, letterSpacing: "0.02em" }}>
          {label}
        </div>
        {sub && (
          <div style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 11, color: W_35, marginTop: 4, letterSpacing: "0.02em" }}>
            {sub}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
        {value && (
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 14, color: W_55, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {value}
          </div>
        )}
        {rightIcon ?? (chevron && <ChevronIcon />)}
      </div>
    </div>
  );

  if (href) return <Link href={href} style={{ display: "block" }}>{inner}</Link>;
  if (onClick) return <button onClick={onClick} style={{ width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}>{inner}</button>;
  return <div>{inner}</div>;
}

export function AccountClient({
  userId,
  email,
  displayName,
  initial,
  avatarColor,
  avatarUrl: initialAvatarUrl,
}: {
  userId: string;
  email: string;
  displayName: string;
  initial: string;
  avatarColor: string;
  avatarUrl: string | null;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isPro, openPaywall } = useSubscription();

  function handleLogout() {
    startTransition(() => logout());
  }

  // mobile の AccountScreen (handlePickAvatar) と完全に同じ保存方式:
  // avatars バケットの `${userId}/avatar.${ext}` に upsert し、
  // 公開URLを user_metadata.avatar_url に保存する。
  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 同じファイルを連続選択できるようにリセット
    if (!file) return;

    setAvatarError(null);
    setUploadingAvatar(true);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const mimeType = ext === "png" ? "image/png" : "image/jpeg";
      const path = `${userId}/avatar.${ext}`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { contentType: mimeType, upsert: true });
      if (error || !data) throw new Error(error?.message ?? "upload failed");

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(data.path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: url } });
      if (updateError) throw new Error(updateError.message);

      setAvatarUrl(url);
      setSheetOpen(false);
    } catch {
      setAvatarError("アイコンの更新に失敗しました。");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <style>{`@keyframes account-avatar-spin { to { transform: rotate(360deg); } }`}</style>
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 28px" }}>
        <Link href="/shelf" style={{ color: W_55, display: "flex" }} aria-label="本棚に戻る">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M14 4L6 11l8 7" stroke={W_55} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 10, letterSpacing: "0.28em", color: W_55 }}>
          ACCOUNT
        </span>
        <div style={{ width: 22 }} />
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", paddingTop: 8 }}>
        {/* Hero */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14, padding: "24px 28px 36px" }}>
          <button onClick={() => setSheetOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <Avatar size={96} color={avatarColor} letter={initial} imageUrl={avatarUrl} editable loading={uploadingAvatar} />
          </button>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Shippori Mincho, serif", fontSize: 22, fontWeight: 600, color: W_92, lineHeight: 1.3, marginBottom: 6, letterSpacing: "0.02em" }}>
              {displayName}
            </div>
            <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 13, color: W_55, letterSpacing: "0.02em" }}>
              {email}
            </div>
          </div>
          {!isPro && (
            <button
              onClick={openPaywall}
              style={{
                marginTop: 2, padding: "8px 18px", borderRadius: 99,
                background: W_92, border: "none", cursor: "pointer",
                fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 11,
                letterSpacing: "0.12em", color: DARK_BG,
              }}
            >
              PRO プランを見る
            </button>
          )}
        </div>

        {/* Profile */}
        <SectionLabel>Profile</SectionLabel>
        <div>
          <Row
            label="アイコン"
            onClick={() => setSheetOpen(true)}
            rightIcon={
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar size={28} color={avatarColor} letter={initial} imageUrl={avatarUrl} />
                <ChevronIcon />
              </div>
            }
          />
          <Row
            label="表示名"
            sub="本棚やレビューに表示されます"
            value={displayName}
            href="/account/name"
          />
        </div>

        {/* Security */}
        <div style={{ paddingTop: 32 }} />
        <SectionLabel>Security</SectionLabel>
        <div>
          <Row label="メールアドレス" value={email} chevron={false} />
          <Row label="パスワードを変更" sub="パスワードを変更する場合はこちら" href="/account/password" />
        </div>

        {/* Plan */}
        <div style={{ paddingTop: 32 }} />
        <SectionLabel>Plan</SectionLabel>
        <div>
          {isPro ? (
            <Row label="プラン" value="Pro（有効）" chevron={false} />
          ) : (
            <>
              <Row label="プラン" value="無料" chevron={false} />
              <Row label="アップグレード" value="Pro プランを見る" onClick={openPaywall} />
            </>
          )}
        </div>

        {/* Danger zone */}
        <div style={{ paddingTop: 36 }} />
        <div>
          <Row
            label="ログアウト"
            danger
            chevron={false}
            rightIcon={isPending ? <span style={{ fontFamily: "Cormorant Garamond", fontSize: 14, color: DANGER }}>...</span> : <LogoutIcon />}
            onClick={handleLogout}
          />
          <Row
            label="アカウントを削除"
            sub="本棚や読書履歴も含めて完全に消えます"
            danger
            chevron={false}
            rightIcon={<TrashIcon />}
            href="/account/delete"
          />
        </div>

        {/* Footer */}
        <div style={{ borderTop: `1px solid ${DARK_LINE}`, padding: "24px 28px 32px", textAlign: "center" }}>
          <div style={{ fontFamily: "Cormorant Garamond, Georgia, serif", fontSize: 11, color: W_25, letterSpacing: "0.2em" }}>
            DIGITAL BOOKMARK · v 1.0.0
          </div>
        </div>
      </div>

      {/* Icon picker sheet */}
      {sheetOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} onClick={() => setSheetOpen(false)} />
          <div style={{
            position: "relative",
            background: DARK_CARD,
            borderRadius: "16px 16px 0 0",
            padding: "12px 0 32px",
            boxShadow: "0 -16px 40px rgba(0,0,0,0.6)",
          }}>
            <div style={{ width: 40, height: 3, background: W_25, borderRadius: 2, margin: "0 auto 22px" }} />
            <div style={{ padding: "0 28px 16px" }}>
              <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 10, letterSpacing: "0.22em", color: W_35 }}>CHANGE AVATAR</span>
              <h2 style={{ margin: "6px 0 0", fontFamily: "Shippori Mincho, serif", fontSize: 20, fontWeight: 500, color: W_92, letterSpacing: "0.02em" }}>
                アイコンを変更
              </h2>
            </div>
            <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 32px" }}>
              <Avatar size={104} color={avatarColor} letter={initial} imageUrl={avatarUrl} loading={uploadingAvatar} />
            </div>
            {avatarError && (
              <p style={{
                margin: "0 0 16px", padding: "0 28px",
                fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 11, color: DANGER, textAlign: "center",
              }}>
                {avatarError}
              </p>
            )}
            <div style={{ borderTop: `1px solid ${DARK_LINE}`, borderBottom: `1px solid ${DARK_LINE}` }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 28px", width: "100%", background: "none", border: "none", cursor: uploadingAvatar ? "default" : "pointer", opacity: uploadingAvatar ? 0.5 : 1 }}
              >
                <CameraIcon color={W_55} />
                <span style={{ fontFamily: "Zen Kaku Gothic New, sans-serif", fontSize: 14, color: W_92 }}>
                  {uploadingAvatar ? "アップロード中..." : "写真から選ぶ"}
                </span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <div style={{ padding: "24px 28px 0" }}>
              <button
                onClick={() => setSheetOpen(false)}
                disabled={uploadingAvatar}
                style={{
                  width: "100%", height: 50, border: `1px solid ${DARK_LINE}`, borderRadius: 2,
                  background: "transparent", color: W_92,
                  fontFamily: "Zen Kaku Gothic New, sans-serif",
                  fontSize: 13, letterSpacing: "0.15em", cursor: uploadingAvatar ? "default" : "pointer",
                  opacity: uploadingAvatar ? 0.5 : 1,
                }}
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
