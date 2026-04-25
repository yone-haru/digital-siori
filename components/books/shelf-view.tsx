"use client";

import { useState, useMemo } from "react";
import { BookCard } from "@/components/books/book-card";
import type { BookStatus } from "@/lib/supabase/types";

type Book = {
  id: string;
  title: string;
  author: string;
  cover_url: string | null;
  current_page: number;
  total_pages: number;
  status: BookStatus;
  created_at: string;
  updated_at: string;
};

type FilterTab = "all" | BookStatus;
type SortKey = "updated_at" | "created_at" | "title";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "reading", label: "読書中" },
  { key: "to_read", label: "積読" },
  { key: "finished", label: "読了" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated_at", label: "更新日順" },
  { key: "created_at", label: "登録日順" },
  { key: "title", label: "タイトル順" },
];

const STATUS_SECTIONS: { status: BookStatus; label: string }[] = [
  { status: "reading", label: "Reading" },
  { status: "to_read", label: "To Read" },
  { status: "finished", label: "Finished" },
];

function sorted(books: Book[], key: SortKey): Book[] {
  return [...books].sort((a, b) => {
    if (key === "title") return a.title.localeCompare(b.title, "ja");
    return new Date(b[key]).getTime() - new Date(a[key]).getTime();
  });
}

export function ShelfView({ books }: { books: Book[] }) {
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: books.length };
    for (const b of books) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [books]);

  const filteredBooks = useMemo(() => {
    const base = filter === "all" ? books : books.filter((b) => b.status === filter);
    return sorted(base, sortKey);
  }, [books, filter, sortKey]);

  if (books.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-7">
        <p className="font-shippori text-[22px] text-ink-2 mb-2">本棚はまだ空です</p>
        <p className="font-zen text-[13px] text-muted">下の + ボタンから本を追加してください</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Filter tabs */}
      <div className="flex gap-2 px-7 pt-4 pb-0 overflow-x-auto scrollbar-none">
        {FILTER_TABS.map((tab) => {
          const active = filter === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-nowrap transition-colors ${
                active
                  ? "bg-ink border-ink"
                  : "bg-transparent border-line hover:border-ink"
              }`}
            >
              <span
                className={`font-zen text-[12px] font-medium ${
                  active ? "text-paper" : "text-muted"
                }`}
              >
                {tab.label}
              </span>
              <span
                className={`font-cormorant text-[12px] ${
                  active ? "text-paper/60" : "text-muted-2"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sort row */}
      <div className="flex justify-end gap-4 px-7 py-3">
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setSortKey(opt.key)}
            className={`font-zen text-[11px] tracking-[0.04em] transition-colors ${
              sortKey === opt.key ? "text-ink" : "text-muted-2 hover:text-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Books grid */}
      <div className="px-7 pb-28">
        {filter === "all" ? (
          // Grouped by status
          STATUS_SECTIONS.map(({ status, label }) => {
            const group = filteredBooks.filter((b) => b.status === status);
            if (group.length === 0) return null;
            return (
              <section key={status} className="mb-8">
                <div className="flex items-center gap-2.5 mb-4">
                  <span className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
                    {label}
                  </span>
                  <span className="font-cormorant text-[13px] text-muted-2">
                    — {group.length}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {group.map((book) => (
                    <BookCard
                      key={book.id}
                      id={book.id}
                      title={book.title}
                      coverUrl={book.cover_url}
                      currentPage={book.current_page}
                      totalPages={book.total_pages}
                      showProgress={book.status === "reading"}
                    />
                  ))}
                </div>
              </section>
            );
          })
        ) : (
          // Flat filtered list
          <div className="grid grid-cols-3 gap-3 pt-2">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                id={book.id}
                title={book.title}
                coverUrl={book.cover_url}
                currentPage={book.current_page}
                totalPages={book.total_pages}
                showProgress={book.status === "reading"}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
