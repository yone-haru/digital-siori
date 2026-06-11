import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'active_reading_session_v1';

/** アプリ強制終了時に読書セッションを復元するためのスナップショット */
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

export async function saveActiveSession(session: ActiveSession): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(session));
  } catch {
    // 保存失敗は致命的ではない（復元ができなくなるだけ）
  }
}

export async function getActiveSession(): Promise<ActiveSession | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as ActiveSession;
    if (Date.now() - new Date(session.startedAt).getTime() > MAX_AGE_MS) {
      await AsyncStorage.removeItem(KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function clearActiveSession(): Promise<void> {
  try {
    await AsyncStorage.removeItem(KEY);
  } catch {
    // noop
  }
}
