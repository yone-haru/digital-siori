import { supabase } from '../lib/supabase';
import { FREE_LIMITS } from '../lib/limits';
import type { Book, ReadingSession, Tag, BookMemo, BookStatus } from '../types';

/**
 * React Query のクエリキー。invalidate はプレフィックス一致なので
 * 例: invalidateQueries({ queryKey: ['book', bookId] }) で isPro 違いもまとめて無効化できる。
 */
export const queryKeys = {
  shelf: (userId: string) => ['shelf', userId] as const,
  book: (bookId: string, isPro: boolean) => ['book', bookId, isPro] as const,
  stats: (userId: string, isPro: boolean) => ['stats', userId, isPro] as const,
  bookCount: (userId: string) => ['bookCount', userId] as const,
  existingBooks: (userId: string) => ['existingBooks', userId] as const,
};

export type ShelfBook = {
  id: string; title: string; author: string; cover_url: string | null;
  current_page: number; total_pages: number; status: BookStatus;
  created_at: string; updated_at: string; rating: number | null;
  tagIds: string[];
};
export type ShelfData = { books: ShelfBook[]; tags: Tag[] };

export async function fetchShelf(userId: string): Promise<ShelfData> {
  const [bRes, btRes, tagRes] = await Promise.all([
    supabase.from('books')
      .select('id,title,author,cover_url,current_page,total_pages,status,created_at,updated_at,rating')
      .order('updated_at', { ascending: false }),
    supabase.from('book_tags').select('book_id,tag_id'),
    supabase.from('tags').select('id,name').eq('user_id', userId).order('created_at'),
  ]);
  if (bRes.error || btRes.error || tagRes.error) {
    throw new Error('本棚の読み込みに失敗しました');
  }
  const tagMap: Record<string, string[]> = {};
  for (const r of btRes.data ?? []) {
    tagMap[r.book_id] = [...(tagMap[r.book_id] ?? []), r.tag_id];
  }
  return {
    books: (bRes.data ?? []).map((b) => ({ ...b, tagIds: tagMap[b.id] ?? [] })),
    tags: tagRes.data ?? [],
  };
}

export type BookDetailData = {
  book: Book;
  sessions: ReadingSession[];
  memos: BookMemo[];
  allTags: Tag[];
  bookTagIds: string[];
};

export async function fetchBookDetail(
  bookId: string, userId: string, isPro: boolean,
): Promise<BookDetailData> {
  const sessionQuery = supabase.from('reading_sessions').select('*')
    .eq('book_id', bookId).order('started_at', { ascending: false });
  const [bRes, sRes, btRes, tagRes, memoRes] = await Promise.all([
    supabase.from('books').select('*').eq('id', bookId).single(),
    isPro ? sessionQuery : sessionQuery.limit(FREE_LIMITS.sessionsPerBook),
    supabase.from('book_tags').select('tag_id').eq('book_id', bookId),
    supabase.from('tags').select('id,name').eq('user_id', userId).order('created_at'),
    supabase.from('book_memos').select('id,page_number,content,created_at')
      .eq('book_id', bookId).order('created_at', { ascending: true }),
  ]);
  if (bRes.error || !bRes.data) throw new Error('本の情報の取得に失敗しました');
  return {
    book: bRes.data,
    sessions: sRes.data ?? [],
    memos: memoRes.data ?? [],
    allTags: tagRes.data ?? [],
    bookTagIds: (btRes.data ?? []).map((r) => r.tag_id),
  };
}

export type StatsRaw = {
  books: Pick<Book, 'id' | 'title' | 'author' | 'cover_url' | 'current_page' | 'total_pages' | 'status'>[];
  sessions: Pick<ReadingSession, 'id' | 'book_id' | 'started_at' | 'start_page' | 'end_page' | 'duration_seconds'>[];
  /** streak 計算用。無料プランの表示期間に関係なく全期間の日時を返す */
  allSessionStarts: string[];
};

export async function fetchStatsRaw(userId: string, isPro: boolean): Promise<StatsRaw> {
  let sessionsQuery = supabase.from('reading_sessions')
    .select('id,book_id,started_at,start_page,end_page,duration_seconds')
    .eq('user_id', userId)
    .order('started_at', { ascending: false });
  if (!isPro) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - FREE_LIMITS.statsMonths);
    sessionsQuery = sessionsQuery.gte('started_at', cutoff.toISOString());
  }
  const [booksRes, sessionsRes, streakRes] = await Promise.all([
    supabase.from('books').select('id,title,author,cover_url,current_page,total_pages,status'),
    sessionsQuery,
    supabase.from('reading_sessions').select('started_at').eq('user_id', userId),
  ]);
  if (booksRes.error || sessionsRes.error || streakRes.error) {
    throw new Error('統計の読み込みに失敗しました');
  }
  return {
    books: booksRes.data ?? [],
    sessions: sessionsRes.data ?? [],
    allSessionStarts: (streakRes.data ?? []).map((r) => r.started_at),
  };
}

export async function fetchBookCount(): Promise<number> {
  const { count, error } = await supabase
    .from('books').select('id', { count: 'exact', head: true });
  if (error) throw new Error('登録冊数の取得に失敗しました');
  return count ?? 0;
}

export type ExistingBook = { isbn: string | null; title: string };

export async function fetchExistingBooks(): Promise<ExistingBook[]> {
  const { data, error } = await supabase.from('books').select('isbn,title');
  if (error) throw new Error('既存の本の取得に失敗しました');
  return data ?? [];
}
