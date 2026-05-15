import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { DeleteConfirm } from "@/components/account/delete-confirm";
import { splitDuration } from "@/lib/utils";

export default async function DeleteAccountPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ count: bookCount }, { data: sessions }] = await Promise.all([
    supabase.from("books").select("*", { count: "exact", head: true }),
    supabase.from("reading_sessions").select("duration_seconds"),
  ]);

  const totalSeconds =
    sessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0;
  const { hours, minutes } = splitDuration(totalSeconds);
  const sessionCount = sessions?.length ?? 0;

  return (
    <DeleteConfirm
      bookCount={bookCount ?? 0}
      sessionCount={sessionCount}
      totalHours={hours}
      totalMinutes={minutes}
    />
  );
}
