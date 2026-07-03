import { redirect } from "next/navigation";
import Link from "next/link";
import { createServerClient } from "@/lib/supabase/server";
import { BookSearch } from "@/components/books/book-search";
import { BottomNav } from "@/components/ui/bottom-nav";

export default async function AddBookPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  // 無料プランの冊数上限チェック用（Pro 判定自体はクライアント側の useSubscription で行う）
  const { count: bookCount } = await supabase
    .from("books")
    .select("id", { count: "exact", head: true });

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Top bar */}
      <div className="flex justify-between items-center px-7 py-3 shrink-0">
        <Link
          href="/shelf"
          className="text-muted hover:text-ink transition-colors"
          aria-label="戻る"
        >
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path
              d="M6 6l10 10M16 6L6 16"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
        </Link>
        <span className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
          Add a Book
        </span>
        <div className="w-[22px]" />
      </div>

      {/* Search content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <BookSearch bookCount={bookCount ?? 0} />
      </div>

      <BottomNav />
    </div>
  );
}
