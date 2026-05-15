"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    id: "library",
    label: "LIBRARY",
    href: "/shelf",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="2" width="7" height="18" rx="1" stroke="currentColor" strokeWidth="1.4" />
        <rect x="12" y="5" width="7" height="15" rx="1" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
  {
    id: "add",
    label: "ADD",
    href: "/books/add",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="11" r="9" stroke="currentColor" strokeWidth="1.4" />
        <path d="M11 7v8M7 11h8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "stats",
    label: "STATS",
    href: "/stats",
    icon: (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="3" y="12" width="4" height="8" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="9" y="7" width="4" height="13" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="15" y="3" width="4" height="17" rx="0.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-paper border-t border-line z-50"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="max-w-sm mx-auto flex">
        {items.map((item) => {
          const isActive =
            item.href === "/shelf"
              ? pathname === "/shelf"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.id}
              href={item.href}
              className="flex-1 flex flex-col items-center justify-center gap-1 py-3 min-h-[56px]"
            >
              <span className={isActive ? "text-ink" : "text-muted-2"}>
                {item.icon}
              </span>
              <span
                className={`font-zen text-[9px] tracking-[0.2em] ${
                  isActive ? "text-ink" : "text-muted-2"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
