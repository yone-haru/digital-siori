import type { GoogleBook } from '../types';

type VolumeItem = {
  id: string;
  volumeInfo?: {
    title?: string;
    authors?: string[];
    publishedDate?: string;
    pageCount?: number;
    description?: string;
    industryIdentifiers?: { type: string; identifier: string }[];
    imageLinks?: { thumbnail?: string };
  };
};

export class GoogleBooksError extends Error {
  constructor(public status: number) {
    super(
      status === 429
        ? '検索が混み合っています。しばらく待ってからお試しください。'
        : '検索に失敗しました。通信環境を確認してください。',
    );
  }
}

function parseItem(item: VolumeItem): GoogleBook {
  const info = item.volumeInfo ?? {};
  const isbn = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13')?.identifier
    ?? info.industryIdentifiers?.[0]?.identifier
    ?? null;
  const thumbnail = info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null;
  const authors = info.authors ?? [];
  return {
    googleId: item.id,
    title: info.title ?? '不明',
    author: authors.join(' / ') || '不明',
    publishedYear: info.publishedDate ? String(info.publishedDate).slice(0, 4) : '',
    pageCount: info.pageCount ?? 0,
    thumbnail,
    isbn,
    description: info.description ?? null,
  };
}

async function fetchVolumes(query: string, restrictJa: boolean): Promise<GoogleBook[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? '';
  const url = `https://www.googleapis.com/books/v1/volumes`
    + `?q=${encodeURIComponent(query)}&maxResults=20`
    + (restrictJa ? '&langRestrict=ja' : '')
    + (apiKey ? `&key=${apiKey}` : '');
  const res = await fetch(url);
  if (!res.ok) throw new GoogleBooksError(res.status);
  const data = await res.json();
  return ((data.items ?? []) as VolumeItem[]).map(parseItem);
}

export async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  const q = query.trim();
  if (!q) return [];
  const jaResults = await fetchVolumes(q, true);
  if (jaResults.length > 0) return jaResults;
  // 和書でヒットしなければ言語制限なしで再検索（洋書対応）
  return fetchVolumes(q, false);
}
