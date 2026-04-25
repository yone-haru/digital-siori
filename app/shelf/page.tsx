import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ShelfView } from "@/components/books/shelf-view";
import { LogoutButton } from "@/components/ui/logout-button";
import { BottomNav } from "@/components/ui/bottom-nav";

export default async function ShelfPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: books } = await supabase
    .from("books")
    .select(
      "id, title, author, cover_url, current_page, total_pages, status, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

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
          <LogoutButton className="w-8 h-8 rounded-full bg-ink flex items-center justify-center font-cormorant text-[14px] text-paper font-semibold">
            {initial}
          </LogoutButton>
        </div>
      </div>

      <ShelfView books={books ?? []} />

      <BottomNav />
    </div>
  );
}
