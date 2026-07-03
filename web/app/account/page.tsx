import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/ui/bottom-nav";
import { AccountClient } from "@/components/account/account-client";

const AVATAR_COLORS = [
  "#2B3A2E", "#7C2B28", "#1B2A3A", "#3D2B1A",
  "#2A2A2A", "#4A3728", "#5C2E2E", "#8B7355",
];

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash * 31) + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export default async function AccountPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const displayName =
    (user.user_metadata?.display_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "User";
  const avatarColor = getAvatarColor(user.id);
  const initial = displayName[0]?.toUpperCase() ?? "?";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;

  return (
    <div className="min-h-screen flex flex-col pb-20" style={{ background: "#0F0D0A" }}>
      <AccountClient
        userId={user.id}
        email={user.email ?? ""}
        displayName={displayName}
        initial={initial}
        avatarColor={avatarColor}
        avatarUrl={avatarUrl}
      />
      <BottomNav />
    </div>
  );
}
