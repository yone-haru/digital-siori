import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { ReadingTimer } from "@/components/books/reading-timer";

export default async function ReadingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: book } = await supabase
    .from("books")
    .select("id, title, author, current_page, total_pages, status")
    .eq("id", id)
    .single();

  if (!book) redirect("/shelf");

  const b = book as {
    id: string;
    title: string;
    author: string;
    current_page: number;
    total_pages: number;
    status: string;
  };

  return (
    <ReadingTimer
      bookId={b.id}
      bookTitle={b.title}
      bookAuthor={b.author}
      startPage={b.current_page}
      totalPages={b.total_pages}
    />
  );
}
