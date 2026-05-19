import type { GoogleBook } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseItem(item: any): GoogleBook {
  const info = item.volumeInfo ?? {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isbn = info.industryIdentifiers?.find((id: any) => id.type === 'ISBN_13')?.identifier
    ?? info.industryIdentifiers?.[0]?.identifier
    ?? null;
  const thumbnail = info.imageLinks?.thumbnail?.replace('http://', 'https://') ?? null;
  const authors: string[] = info.authors ?? [];
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

export async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  if (!query.trim()) return [];
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? '';
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query.trim())}&maxResults=20&langRestrict=ja${apiKey ? `&key=${apiKey}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Search API error: ${res.status}`);
  const data = await res.json();
  if (!data.items) return [];
  return data.items.map(parseItem);
}
