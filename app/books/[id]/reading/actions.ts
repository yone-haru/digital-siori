"use server";

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

type SaveSessionResult =
  | { error: string }
  | { success: true; durationSeconds: number; pagesRead: number };

export async function saveReadingSession(
  input: SaveSessionInput
): Promise<SaveSessionResult> {
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

  const updates: Record<string, unknown> = { current_page: input.endPage };
  if (book?.status === "to_read") updates.status = "reading";
  if (book?.status !== "finished" && !book?.started_at) {
    updates.started_at = input.startedAt;
  }
  await supabase.from("books").update(updates).eq("id", input.bookId);

  revalidatePath(`/books/${input.bookId}`);
  revalidatePath("/shelf");
  revalidatePath("/stats");

  return {
    success: true,
    durationSeconds: input.durationSeconds,
    pagesRead: Math.max(0, input.endPage - input.startPage),
  };
}
