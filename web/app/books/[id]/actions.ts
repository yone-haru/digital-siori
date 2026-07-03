"use server";

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
  revalidatePath("/stats");
  return { success: true };
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

  const { data: book } = await supabase
    .from("books")
    .select("status, started_at, read_count")
    .eq("id", bookId)
    .single();

  const updates: Record<string, unknown> = { status };

  if (status === "reading") {
    if (book && !book.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (book?.status === "finished") {
      updates.current_page = 0;
      updates.started_at = new Date().toISOString();
    }
  } else if (status === "rereading") {
    updates.current_page = 0;
    updates.started_at = new Date().toISOString();
  } else if (status === "finished") {
    updates.finished_at = new Date().toISOString();
    if (book?.status === "reading") {
      updates.read_count = (book.read_count ?? 0) + 1;
    }
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

export async function updateBookReview(bookId: string, review: string) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("books")
    .update({ review: review.trim() || null })
    .eq("id", bookId);
  if (error) return { error: "更新に失敗しました" };
  revalidatePath(`/books/${bookId}`);
  return { success: true };
}

export async function updateBookRating(bookId: string, rating: number | null) {
  const supabase = await createServerClient();
  const { error } = await supabase
    .from("books")
    .update({ rating })
    .eq("id", bookId);
  if (error) return { error: "更新に失敗しました" };
  revalidatePath(`/books/${bookId}`);
  return { success: true };
}

export async function addTagToBook(bookId: string, tagId: string) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  await supabase
    .from("book_tags")
    .insert({ book_id: bookId, tag_id: tagId, user_id: user.id });

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/shelf");
  return { success: true };
}

export async function removeTagFromBook(bookId: string, tagId: string) {
  const supabase = await createServerClient();
  await supabase
    .from("book_tags")
    .delete()
    .eq("book_id", bookId)
    .eq("tag_id", tagId);

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/shelf");
  return { success: true };
}

export async function createTag(bookId: string, name: string) {
  const trimmed = name.trim().slice(0, 20);
  if (!trimmed) return { error: "タグ名を入力してください" };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: tag, error } = await supabase
    .from("tags")
    .insert({ name: trimmed, user_id: user.id })
    .select("id")
    .single();

  if (error || !tag) return { error: "タグの作成に失敗しました" };

  await supabase
    .from("book_tags")
    .insert({ book_id: bookId, tag_id: tag.id, user_id: user.id });

  revalidatePath(`/books/${bookId}`);
  revalidatePath("/shelf");
  return { success: true };
}

export async function initBookRead(
  bookId: string,
  { prevReadCount, startPage }: { prevReadCount: number; startPage: number }
): Promise<{ error: string } | { success: true }> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { error } = await supabase
    .from("books")
    .update({
      read_count: prevReadCount,
      current_page: startPage,
      status: "reading",
      started_at: new Date().toISOString(),
    })
    .eq("id", bookId);

  if (error) return { error: "更新に失敗しました" };
  revalidatePath(`/books/${bookId}`);
  revalidatePath("/shelf");
  return { success: true };
}

/* ── 本メモ（book_memos） ── */
type BookMemoResult =
  | { error: string }
  | { success: true; memo: { id: string; page_number: number; content: string; created_at: string } };

export async function addBookMemo(
  bookId: string,
  data: { pageNumber: number; content: string }
): Promise<BookMemoResult> {
  const content = data.content.trim();
  if (!content) return { error: "メモを入力してください" };

  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  const { data: memo, error } = await supabase
    .from("book_memos")
    .insert({
      book_id: bookId,
      user_id: user.id,
      page_number: data.pageNumber,
      content,
    })
    .select("id, page_number, content, created_at")
    .single();

  if (error || !memo) return { error: "メモの保存に失敗しました" };

  revalidatePath(`/books/${bookId}`);
  return { success: true, memo };
}

export async function updateBookMemo(
  memoId: string,
  bookId: string,
  data: { pageNumber: number; content: string }
): Promise<{ error: string } | { success: true }> {
  const content = data.content.trim();
  if (!content) return { error: "メモを入力してください" };

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("book_memos")
    .update({ page_number: data.pageNumber, content })
    .eq("id", memoId);

  if (error) return { error: "メモの更新に失敗しました" };
  revalidatePath(`/books/${bookId}`);
  return { success: true };
}

export async function deleteBookMemo(
  memoId: string,
  bookId: string
): Promise<{ error: string } | { success: true }> {
  const supabase = await createServerClient();
  const { error } = await supabase.from("book_memos").delete().eq("id", memoId);

  if (error) return { error: "メモの削除に失敗しました" };
  revalidatePath(`/books/${bookId}`);
  return { success: true };
}
