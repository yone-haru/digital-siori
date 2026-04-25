"use client";

import { useTransition } from "react";
import { logout } from "@/app/auth/actions";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export function LogoutButton({ className, children }: LogoutButtonProps) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => logout())}
      disabled={isPending}
      className={className}
      title="ログアウト"
    >
      {children ?? (isPending ? "..." : "LOG OUT")}
    </button>
  );
}
