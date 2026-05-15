export type GoogleBook = {
  googleId: string;
  title: string;
  author: string;
  publishedYear: string;
  pageCount: number;
  thumbnail: string | null;
  isbn: string | null;
  description: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseItem(item: any): GoogleBook {
  const info = item.volumeInfo ?? {};

  const isbn =
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info.industryIdentifiers?.find((id: any) => id.type === "ISBN_13")
      ?.identifier ??
    info.industryIdentifiers?.[0]?.identifier ??
    null;

  const thumbnail =
    info.imageLinks?.thumbnail?.replace("http://", "https://") ?? null;

  const authors: string[] = info.authors ?? [];

  return {
    googleId: item.id,
    title: info.title ?? "不明",
    author: authors.join(" / ") || "不明",
    publishedYear: info.publishedDate ? String(info.publishedDate).slice(0, 4) : "",
    pageCount: info.pageCount ?? 0,
    thumbnail,
    isbn,
    description: info.description ?? null,
  };
}

/** クライアントコンポーネントから呼ぶ（/api/books/search 経由でサーバー側がキャッシュ） */
export async function searchGoogleBooks(query: string): Promise<GoogleBook[]> {
  if (!query.trim()) return [];

  const res = await fetch(
    `/api/books/search?q=${encodeURIComponent(query.trim())}`
  );

  if (!res.ok) throw new Error(`Search API error: ${res.status}`);

  const data = await res.json();
  if (!data.items) return [];

  return data.items.map(parseItem);
}
