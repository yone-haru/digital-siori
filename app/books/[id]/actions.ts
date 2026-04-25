"use server";

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import type { BookStatus } from "@/lib/supabase/types";

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
