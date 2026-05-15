"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

export type AddBookInput = {
  title: string;
  author: string;
  cover_url?: string | null;
  total_pages: number;
  isbn?: string | null;
  description?: string | null;
};

export async function addBook(
  input: AddBookInput
): Promise<{ error: string } | never> {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "ログインが必要です" };

  const { data, error } = await supabase
    .from("books")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      author: input.author.trim(),
      cover_url: input.cover_url ?? null,
      total_pages: input.total_pages,
      isbn: input.isbn ?? null,
      description: input.description ?? null,
      status: "to_read",
    })
    .select("id")
    .single();

  if (error) return { error: "登録に失敗しました。もう一度お試しください。" };

  redirect(`/books/${data.id}`);
}
