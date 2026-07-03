"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function updateDisplayName(name: string) {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 20) return { error: "1〜20文字で入力してください" };

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({
    data: { display_name: trimmed },
  });

  if (error) return { error: "保存に失敗しました" };
  revalidatePath("/account");
  return { success: true };
}

export async function updatePassword(password: string) {
  if (password.length < 6) {
    return { error: "パスワードは6文字以上で設定してください。" };
  }

  const supabase = await createServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) return { error: "パスワードの変更に失敗しました。もう一度お試しください。" };
  return { success: true };
}

export async function deleteAccount() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "ログインが必要です" };

  await supabase.from("reading_sessions").delete().eq("user_id", user.id);
  await supabase.from("books").delete().eq("user_id", user.id);
  await supabase.auth.signOut();

  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const admin = createAdminClient();
      await admin.auth.admin.deleteUser(user.id);
    } catch {
      // service role unavailable — data already cleared
    }
  }

  redirect("/auth/login");
}
