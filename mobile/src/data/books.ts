import { supabase } from '../lib/supabase';
import type { Book, BookStatus } from '../types';

/** 書き込み系の結果型。呼び出し側は ok を必ず確認し、失敗時は UI を巻き戻すこと */
export type Result<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; message: string };

const fail = (message: string): { ok: false; message: string } => ({ ok: false, message });

export type BookUpdates = Partial<Pick<Book,
  'status' | 'current_page' | 'started_at' | 'finished_at' | 'read_count' | 'rating' | 'review'
>>;

export async function updateBook(bookId: string, updates: BookUpdates): Promise<Result> {
  const { error } = await supabase.from('books').update(updates).eq('id', bookId);
  if (error) return fail('保存に失敗しました。通信環境を確認してください。');
  return { ok: true, data: undefined };
}

/**
 * 「読書をはじめる」時のステータス遷移。
 * finished → rereading（最初のページから）/ to_read → reading。
 * 返り値の startPage をタイマーに渡す。
 */
export async function startReading(
  book: Pick<Book, 'id' | 'status' | 'current_page'>,
): Promise<Result<{ startPage: number }>> {
  if (book.status === 'finished') {
    const r = await updateBook(book.id, {
      status: 'rereading',
      current_page: 0,
      started_at: new Date().toISOString(),
    });
    if (!r.ok) return r;
    return { ok: true, data: { startPage: 0 } };
  }
  if (book.status === 'to_read') {
    const r = await updateBook(book.id, {
      status: 'reading',
      started_at: new Date().toISOString(),
    });
    if (!r.ok) return r;
  }
  return { ok: true, data: { startPage: book.current_page } };
}

/** 「読了にする」。read_count を加算し、ページを最後まで進める */
export async function finishBook(
  book: Pick<Book, 'id' | 'read_count' | 'total_pages' | 'current_page'>,
): Promise<Result<BookUpdates>> {
  const updates: BookUpdates = {
    status: 'finished',
    finished_at: new Date().toISOString(),
    read_count: (book.read_count ?? 0) + 1,
    current_page: book.total_pages > 0 ? book.total_pages : book.current_page,
  };
  const r = await updateBook(book.id, updates);
  if (!r.ok) return r;
  return { ok: true, data: updates };
}

export type RecordSessionInput = {
  bookId: string;
  userId: string;
  startedAt: string;
  endedAt: string;
  startPage: number;
  endPage: number;
  durationSeconds: number;
};

/**
 * 読書セッションを記録し、本のステータス・現在ページを更新する。
 * タイマー終了と手動追加の両方からここを通すこと（ロジックを分岐させない）。
 */
export async function recordSession(
  input: RecordSessionInput,
): Promise<Result<{ finished: boolean }>> {
  // 本の最新状態を取得（route params や画面 state は古い可能性がある）
  const { data: book, error: bookErr } = await supabase
    .from('books')
    .select('status,current_page,total_pages,read_count')
    .eq('id', input.bookId)
    .single();
  if (bookErr || !book) return fail('本の情報の取得に失敗しました。');

  const { error: sessionErr } = await supabase.from('reading_sessions').insert({
    book_id: input.bookId,
    user_id: input.userId,
    started_at: input.startedAt,
    ended_at: input.endedAt,
    start_page: input.startPage,
    end_page: input.endPage,
    duration_seconds: input.durationSeconds,
  });
  if (sessionErr) return fail('記録の保存に失敗しました。通信環境を確認してください。');

  const status = book.status as BookStatus;
  const isNowFinished = book.total_pages > 0 && input.endPage >= book.total_pages;
  const updates: BookUpdates = {};

  if (isNowFinished) {
    updates.status = 'finished';
    updates.finished_at = input.endedAt;
    updates.read_count = (book.read_count ?? 0) + 1;
    updates.current_page = input.endPage;
  } else if (status === 'to_read') {
    updates.status = 'reading';
    updates.started_at = input.startedAt;
    if (input.endPage > book.current_page) updates.current_page = input.endPage;
  } else if (status === 'finished') {
    updates.status = 'rereading';
    updates.started_at = input.startedAt;
    updates.current_page = input.endPage;
  } else if (input.endPage > book.current_page) {
    updates.current_page = input.endPage;
  }

  if (Object.keys(updates).length > 0) {
    const { error } = await supabase.from('books').update(updates).eq('id', input.bookId);
    if (error) return fail('記録は保存されましたが、進捗の更新に失敗しました。');
  }
  return { ok: true, data: { finished: isNowFinished } };
}
