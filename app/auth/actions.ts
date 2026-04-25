"use server";

import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";

type AuthState = { error?: string };

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "メールアドレスまたはパスワードが正しくありません。" };
  }

  redirect("/shelf");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createServerClient();
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "このメールアドレスはすでに登録済みです。" };
    }
    if (error.message.includes("Password should be")) {
      return { error: "パスワードは6文字以上で設定してください。" };
    }
    return { error: "登録に失敗しました。もう一度お試しください。" };
  }

  redirect("/shelf");
}

export async function logout() {
  const supabase = await createServerClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}
