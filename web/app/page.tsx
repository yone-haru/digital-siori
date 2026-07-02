import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { LandingPage } from "@/components/landing/landing-page";

export const metadata: Metadata = {
  title: "Yondle — 読書の記録を、しおりのように。",
  description:
    "紙の本の「どこまで読んだか忘れた」をなくす、静かな読書記録アプリ。書籍情報の自動取得、進捗の記録、読書タイマー、読了予測まで。",
  openGraph: {
    title: "Yondle — 読書の記録を、しおりのように。",
    description:
      "紙の本のためのデジタル本棚。進捗の記録、読書タイマー、読了予測で、あなたの読書を次のページへ。",
    images: [{ url: "/lp/og.png", width: 1024, height: 500 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default async function RootPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/shelf");
  }

  return <LandingPage />;
}
