"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

type SaveSessionInput = {
  bookId: string;
  startPage: number;
  endPage: number;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
};

export async function saveReadingSession(
  input: SaveSessionInput
): Promise<{ error: string } | never> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインが必要です" };

  const { data: book } = await supabase
    .from("books")
    .select("status, started_at")
    .eq("id", input.bookId)
    .single();

  // reading_sessions に記録
  const { error: sessionError } = await supabase
    .from("reading_sessions")
    .insert({
      book_id: input.bookId,
      user_id: user.id,
      started_at: input.startedAt,
      ended_at: input.endedAt,
      start_page: input.startPage,
      end_page: input.endPage,
      duration_seconds: input.durationSeconds,
    });

  if (sessionError) return { error: "セッションの記録に失敗しました" };

  // books の current_page・status・started_at を更新
  const updates: Record<string, unknown> = { current_page: input.endPage };

  if (book?.status === "to_read") {
    updates.status = "reading";
  }
  if (book?.status !== "finished" && !book?.started_at) {
    updates.started_at = input.startedAt;
  }

  await supabase.from("books").update(updates).eq("id", input.bookId);

  revalidatePath(`/books/${input.bookId}`);
  revalidatePath("/shelf");
  redirect(`/books/${input.bookId}`);
}
