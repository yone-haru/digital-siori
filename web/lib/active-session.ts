/**
 * 読書セッションの復元用スナップショット。
 * mobile/src/lib/activeSession.ts と同じ型・同じキー・同じ失効時間（24時間）。
 * Web では AsyncStorage の代わりに localStorage を使う（同期API）。
 */

const KEY = "active_reading_session_v1";

export type ActiveSession = {
  bookId: string;
  bookTitle: string;
  bookAuthor: string;
  startPage: number;
  totalPages: number;
  startedAt: string; // ISO
};

/** これより古い残骸は復元対象にしない */
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function saveActiveSession(session: ActiveSession): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // 保存失敗は致命的ではない（復元ができなくなるだけ）
  }
}

export function getActiveSession(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ActiveSession;
    if (Date.now() - new Date(session.startedAt).getTime() > MAX_AGE_MS) {
      window.localStorage.removeItem(KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
