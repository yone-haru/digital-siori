import { redirect } from "next/navigation";

// /timer は /reading に移動しました
export default async function TimerRedirectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/books/${id}/reading`);
}
