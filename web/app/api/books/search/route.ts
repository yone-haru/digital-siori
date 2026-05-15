import { NextRequest, NextResponse } from "next/server";

const GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q?.trim()) {
    return NextResponse.json({ items: [] });
  }

  const url = new URL(GOOGLE_BOOKS_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("maxResults", "40");
  url.searchParams.set("printType", "books");
  // API キーがあればレート制限が大幅に緩和される（無料・取得5分）
  if (process.env.GOOGLE_BOOKS_API_KEY) {
    url.searchParams.set("key", process.env.GOOGLE_BOOKS_API_KEY);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      next: { revalidate: 300 }, // 同じ検索語は5分間キャッシュ
    });
  } catch {
    return NextResponse.json({ error: "network error" }, { status: 502 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: `upstream ${res.status}` },
      { status: res.status }
    );
  }

  const data = await res.json();

  return NextResponse.json(data, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
    },
  });
}
