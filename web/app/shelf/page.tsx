import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { ShelfView } from "@/components/books/shelf-view";
import { BottomNav } from "@/components/ui/bottom-nav";
import { UndoToast } from "@/components/books/undo-toast";

export default async function ShelfPage({
  searchParams,
}: {
  searchParams: Promise<{ deleted?: string; title?: string }>;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { deleted: deletedId, title: deletedTitle } = await searchParams;

  let booksQuery = supabase
    .from("books")
    .select(
      "id, title, author, cover_url, current_page, total_pages, status, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (deletedId) {
    booksQuery = booksQuery.neq("id", deletedId);
  }

  const [{ data: books }, { data: bookTagRows }, { data: allTagRows }] =
    await Promise.all([
      booksQuery,
      supabase.from("book_tags").select("book_id, tag_id"),
      supabase.from("tags").select("id, name").eq("user_id", user.id).order("created_at"),
    ]);

  const bookTagMap: Record<string, string[]> = {};
  for (const row of bookTagRows ?? []) {
    if (!bookTagMap[row.book_id]) bookTagMap[row.book_id] = [];
    bookTagMap[row.book_id].push(row.tag_id);
  }

  const enrichedBooks = (books ?? []).map((b) => ({
    ...b,
    tagIds: bookTagMap[b.id] ?? [],
  }));

  const initial = (user.email ?? "?")[0].toUpperCase();

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-end px-7 pt-12 pb-0">
        <div>
          <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1">
            Library
          </p>
          <h1 className="font-shippori text-[32px] font-medium text-ink tracking-[-0.01em]">
            本棚
          </h1>
        </div>
        <div className="flex items-center gap-4 pb-1">
          <Link
            href="/account"
            className="w-8 h-8 rounded-full bg-ink flex items-center justify-center font-cormorant text-[14px] text-paper font-semibold hover:opacity-70 transition-opacity"
            aria-label="アカウント設定"
          >
            {initial}
          </Link>
        </div>
      </div>

      <ShelfView books={enrichedBooks} tags={allTagRows ?? []} />

      {deletedId && deletedTitle && (
        <UndoToast
          bookId={deletedId}
          title={decodeURIComponent(deletedTitle)}
        />
      )}

      <BottomNav />
    </div>
  );
}
