import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { StatsClient } from "@/components/stats/stats-client";

// 集計・無料プランの期間フィルタはクライアント側（StatsClient）で行う。
// ここでは全期間分をそのままフェッチするだけでよい。
export default async function StatsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const [{ data: books }, { data: sessions }] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, author, cover_url, current_page, total_pages, status"),
    supabase
      .from("reading_sessions")
      .select("id, book_id, started_at, start_page, end_page, duration_seconds")
      .eq("user_id" as never, user.id)
      .order("started_at", { ascending: false }),
  ]);

  return <StatsClient books={books ?? []} sessions={sessions ?? []} />;
}
