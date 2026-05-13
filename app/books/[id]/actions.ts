"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/supabase/types";

export async function addManualSession(
  bookId: string,
  data: { date: string; startPage: number; endPage: number; durationMinutes: number }
) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const durationSeconds = data.durationMinutes * 60;
  const startedAt = new Date(`${data.date}T12:00:00+09:00`).toISOString();
  const endedAt = new Date(new Date(startedAt).getTime() + durationSeconds * 1000).toISOString();

  const { error } = await supabase.from("reading_sessions").insert({
    book_id: bookId,
    user_id: user.id,
    started_at: startedAt,
    ended_at: endedAt,
    start_page: data.startPage,
    end_page: data.endPage,
    duration_seconds: durationSeconds,
  });

  if (error) return { error: "記録の保存に失敗しました" };

  if (data.endPage > 0) {
    await supabase
      .from("books")
      .update({ current_page: data.endPage })
      .eq("id", bookId)
      .lt("current_page", data.endPage);
  }

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/stats");
  return { success: true };
}

export async function deleteBook(bookId: string) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("books")
    .delete()
    .eq("id", bookId)
    .eq("user_id", user.id);

  if (error) return { error: "削除に失敗しました" };
  revalidatePath("/shelf");
  redirect("/shelf");
}

export async function updateCurrentPage(
  bookId: string,
  newPage: number,
  newTotalPages?: number
) {
  const supabase = await createServerClient();
  const updates: Record<string, unknown> = { current_page: newPage };
  if (newTotalPages !== undefined && newTotalPages >= 0) {
    updates.total_pages = newTotalPages;
  }
  const { error } = await supabase
    .from("books")
    .update(updates)
    .eq("id", bookId);

  if (error) return { error: "更新に失敗しました" };
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/shelf");
  return { success: true };
}

export async function updateBookStatus(bookId: string, status: BookStatus) {
  const supabase = await createServerClient();

  const updates: Record<string, unknown> = { status };

  if (status === "reading") {
    // 読書中に変えるとき started_at がなければセット
    const { data: book } = await supabase
      .from("books")
      .select("started_at")
      .eq("id", bookId)
      .single();
    if (book && !book.started_at) {
      updates.started_at = new Date().toISOString();
    }
  } else if (status === "finished") {
    updates.finished_at = new Date().toISOString();
  }

  const { error } = await supabase
    .from("books")
    .update(updates)
    .eq("id", bookId);

  if (error) return { error: "更新に失敗しました" };
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/shelf");
  return { success: true };
}
