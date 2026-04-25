"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import { BookmarkLogo } from "@/components/ui/bookmark-logo";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, {});

  return (
    <div className="flex flex-col flex-1 px-7 pb-8">
      {/* Logo */}
      <div className="mt-9 mb-auto">
        <BookmarkLogo />
      </div>

      {/* Hero + Form */}
      <div className="flex flex-col justify-center pb-8 flex-1">
        {/* Welcome label */}
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-3.5">
          Welcome
        </p>

        {/* Tagline */}
        <h1 className="font-shippori text-[32px] font-medium text-ink-2 leading-[1.55] mb-12">
          あなたの読書を、
          <br />
          次のページへ。
        </h1>

        <form action={formAction} className="flex flex-col">
          {/* Email */}
          <div className="mb-7">
            <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              placeholder="haru@example.com"
              className="w-full bg-transparent border-0 border-b border-line pb-2.5 outline-none font-cormorant text-[19px] text-ink tracking-[0.03em] placeholder:text-muted-2 focus:border-ink transition-colors"
            />
          </div>

          {/* Password */}
          <div className="mb-11">
            <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full bg-transparent border-0 border-b border-line pb-2.5 outline-none font-cormorant text-[19px] text-ink tracking-[0.12em] placeholder:text-muted-2 focus:border-ink transition-colors"
            />
          </div>

          {/* Error */}
          {state?.error && (
            <p className="font-zen text-[12px] text-[#7C2B28] mb-4 text-center">
              {state.error}
            </p>
          )}

          {/* CTA */}
          <button
            type="submit"
            disabled={isPending}
            className="w-full h-[52px] bg-ink text-paper font-zen text-[13px] tracking-[0.25em] font-medium uppercase rounded-sm disabled:opacity-50 transition-opacity mb-6"
          >
            {isPending ? "..." : "LOG IN"}
          </button>

          <p className="text-center font-zen text-[12px] text-muted tracking-[0.03em]">
            はじめての方は{" "}
            <Link
              href="/auth/signup"
              className="underline underline-offset-2 hover:text-ink transition-colors"
            >
              新規登録
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
