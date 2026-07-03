"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BookCard } from "@/components/books/book-card";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/providers/auth-provider";
import { getActiveSession, clearActiveSession, type ActiveSession } from "@/lib/active-session";
import type { BookStatus } from "@/lib/supabase/types";

type Tag = { id: string; name: string };

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
  tagIds: string[];
};

type FilterTab = "all" | BookStatus;
type SortKey = "updated_at" | "created_at" | "title";

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: "all", label: "すべて" },
  { key: "reading", label: "読書中" },
  { key: "rereading", label: "再読中" },
  { key: "to_read", label: "未読" },
  { key: "finished", label: "読書完了" },
];

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "updated_at", label: "更新日順" },
  { key: "created_at", label: "登録日順" },
  { key: "title", label: "タイトル順" },
];

const STATUS_SECTIONS: { status: BookStatus; label: string }[] = [
  { status: "reading", label: "Reading" },
  { status: "rereading", label: "Re-Reading" },
  { status: "to_read", label: "To Read" },
  { status: "finished", label: "Finished" },
];

function sorted(books: Book[], key: SortKey): Book[] {
  return [...books].sort((a, b) => {
    if (key === "title") return a.title.localeCompare(b.title, "ja");
    return new Date(b[key]).getTime() - new Date(a[key]).getTime();
  });
}

export function ShelfView({ books, tags }: { books: Book[]; tags: Tag[] }) {
  const router = useRouter();
  const { user } = useAuth();

  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortKey, setSortKey] = useState<SortKey>("updated_at");
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  // 選択モード（一括削除・一括タグ付け）
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [bulkBusy, setBulkBusy] = useState(false);
  // サーバーの再フェッチが終わるまでの間、削除済みの本を即座に隠しておくための集合
  const [bulkDeletedIds, setBulkDeletedIds] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  // 強制終了などで残った読書セッションがあれば復元を提案する
  const [recoverSession, setRecoverSession] = useState<ActiveSession | null>(null);
  useEffect(() => {
    setRecoverSession(getActiveSession());
  }, []);

  useEffect(() => {
    if (!message) return;
    const id = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(id);
  }, [message]);

  const visibleBooks = useMemo(
    () => books.filter((b) => !bulkDeletedIds.has(b.id)),
    [books, bulkDeletedIds]
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: visibleBooks.length };
    for (const b of visibleBooks) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [visibleBooks]);

  const filteredBooks = useMemo(() => {
    let base = filter === "all" ? visibleBooks : visibleBooks.filter((b) => b.status === filter);
    if (tagFilter) base = base.filter((b) => b.tagIds.includes(tagFilter));
    return sorted(base, sortKey);
  }, [visibleBooks, filter, sortKey, tagFilter]);

  function enterSelectionMode(id: string) {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    if (selectedIds.size === 0 || bulkBusy) return;
    const ok = window.confirm(
      `${selectedIds.size}冊を削除\nこの操作は取り消せません。`
    );
    if (!ok) return;

    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    const supabase = createClient();
    const { error } = await supabase.from("books").delete().in("id", ids);
    setBulkBusy(false);

    if (error) {
      setMessage("削除に失敗しました。通信環境を確認してください");
      return;
    }
    setBulkDeletedIds((prev) => new Set([...prev, ...ids]));
    exitSelectionMode();
    router.refresh();
  }

  async function handleBulkTag(tagId: string) {
    if (!user || selectedIds.size === 0 || bulkBusy) return;

    setBulkBusy(true);
    const ids = Array.from(selectedIds);
    const rows = ids.map((bookId) => ({ book_id: bookId, tag_id: tagId, user_id: user.id }));
    const supabase = createClient();
    const { error } = await supabase
      .from("book_tags")
      .upsert(rows, { onConflict: "book_id,tag_id" });
    setBulkBusy(false);

    if (error) {
      setMessage("タグ付けに失敗しました");
      return;
    }
    setTagSheetOpen(false);
    exitSelectionMode();
    setMessage(`${ids.length}冊にタグを追加しました`);
    router.refresh();
  }

  if (visibleBooks.length === 0 && !recoverSession) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-7">
        <p className="font-shippori text-[22px] text-ink-2 mb-2">本棚はまだ空です</p>
        <p className="font-zen text-[13px] text-muted">下の + ボタンから本を追加してください</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* 読書セッション復元バナー（強制終了時などの保険） */}
      {recoverSession && (
        <div className="mx-7 mt-4 flex items-center gap-3 rounded-sm border border-line bg-line-2 px-4 py-3">
          <Link
            href={`/books/${recoverSession.bookId}/timer`}
            className="flex-1 min-w-0"
            onClick={() => setRecoverSession(null)}
          >
            <p className="font-zen text-[10px] tracking-[0.2em] text-muted uppercase mb-1">
              Session Interrupted
            </p>
            <p className="font-shippori text-[14px] text-ink mb-0.5 truncate">
              読書セッションが中断されています
            </p>
            <p className="font-zen text-[11px] text-muted-2 truncate">
              「{recoverSession.bookTitle}」の続きから再開できます
            </p>
          </Link>
          <button
            onClick={() => {
              clearActiveSession();
              setRecoverSession(null);
            }}
            aria-label="閉じる"
            className="shrink-0 text-muted-2 hover:text-ink transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      )}

      {/* 選択モード切替 */}
      {visibleBooks.length > 0 && (
        <div className="flex justify-end px-7 pt-4">
          {selectionMode ? (
            <button
              onClick={exitSelectionMode}
              className="font-zen text-[11px] tracking-[0.1em] text-muted-2 hover:text-ink transition-colors"
            >
              キャンセル
            </button>
          ) : (
            <button
              onClick={() => setSelectionMode(true)}
              className="font-zen text-[11px] tracking-[0.1em] text-muted-2 hover:text-ink transition-colors"
            >
              選択
            </button>
          )}
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 px-7 pt-2 pb-0 overflow-x-auto scrollbar-none">
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

      {/* Tag filter row */}
      {tags.length > 0 && (
        <div className="px-7 pt-3 pb-0">
          <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
            タグで絞り込む
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {tags.map((tag) => {
            const active = tagFilter === tag.id;
            return (
              <button
                key={tag.id}
                onClick={() => setTagFilter(active ? null : tag.id)}
                className={`px-2.5 py-1 rounded-full border text-nowrap transition-colors ${
                  active
                    ? "bg-ink border-ink"
                    : "bg-transparent border-line hover:border-ink"
                }`}
              >
                <span
                  className={`font-zen text-[11px] ${
                    active ? "text-paper" : "text-muted-2"
                  }`}
                >
                  {tag.name}
                </span>
              </button>
            );
          })}
          </div>
        </div>
      )}

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
                      showProgress={book.status === "reading" || book.status === "rereading"}
                      selectionMode={selectionMode}
                      selected={selectedIds.has(book.id)}
                      onToggleSelect={toggleSelection}
                      onEnterSelectionMode={enterSelectionMode}
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
                showProgress={book.status === "reading" || book.status === "rereading"}
                selectionMode={selectionMode}
                selected={selectedIds.has(book.id)}
                onToggleSelect={toggleSelection}
                onEnterSelectionMode={enterSelectionMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* 選択モード アクションバー */}
      {selectionMode && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[55] bg-ink flex items-center px-4 py-3 gap-2"
          style={{ paddingBottom: "calc(12px + env(safe-area-inset-bottom, 0px))" }}
        >
          <button
            onClick={exitSelectionMode}
            className="font-zen text-[11px] tracking-[0.05em] text-paper/50 px-1 shrink-0"
          >
            キャンセル
          </button>
          <span className="flex-1 text-center font-zen text-[11px] text-paper/70">
            {selectedIds.size}冊選択中
          </span>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => selectedIds.size && setTagSheetOpen(true)}
              disabled={!selectedIds.size || bulkBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-white/20 disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2z"
                  stroke="var(--color-paper)"
                  strokeWidth="1.3"
                  strokeLinejoin="round"
                />
                <circle cx="5" cy="5" r="1" fill="var(--color-paper)" />
              </svg>
              <span className="font-zen text-[11px] text-paper tracking-[0.05em]">
                タグ付け
              </span>
            </button>
            <button
              onClick={handleBulkDelete}
              disabled={!selectedIds.size || bulkBusy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm border border-[rgba(199,123,111,0.5)] disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M3 4.5h10M6 4.5V3A1 1 0 0 1 7 2h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.5A1 1 0 0 0 6 14h4a1 1 0 0 0 1-1l.6-8.5"
                  stroke="#fff"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="font-zen text-[11px] text-paper tracking-[0.05em]">
                削除
              </span>
            </button>
          </div>
        </div>
      )}

      {/* タグ選択シート */}
      {tagSheetOpen && (
        <div className="fixed inset-0 z-[70] flex flex-col justify-end">
          <button
            aria-label="閉じる"
            onClick={() => setTagSheetOpen(false)}
            className="absolute inset-0 bg-black/50 cursor-default"
          />
          <div className="relative bg-paper rounded-t-[20px] px-7 pt-7 pb-10 shadow-[0_-8px_40px_rgba(0,0,0,0.2)]">
            <div className="w-10 h-[3px] bg-line rounded-full mx-auto mb-6" />
            <p className="font-shippori text-[20px] text-ink mb-1.5">タグを選択</p>
            <p className="font-zen text-[11px] text-muted mb-5">
              {selectedIds.size}冊にまとめて追加します
            </p>
            {tags.length === 0 ? (
              <p className="font-zen text-[13px] text-muted-2 text-center py-5">
                タグがまだありません
              </p>
            ) : (
              <div>
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => handleBulkTag(tag.id)}
                    disabled={bulkBusy}
                    className="w-full flex items-center justify-between py-4 border-b border-line disabled:opacity-50"
                  >
                    <span className="font-zen text-[14px] text-ink">{tag.name}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 4l4 4-4 4"
                        stroke="var(--color-muted-2)"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 一括操作の結果メッセージ */}
      {message && (
        <div
          className="fixed left-5 right-5 z-[60] bg-ink rounded-sm px-[18px] py-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.25)]"
          style={{ bottom: "calc(56px + env(safe-area-inset-bottom, 0px) + 12px)" }}
        >
          <p className="font-shippori text-[13px] text-paper text-center">{message}</p>
        </div>
      )}
    </div>
  );
}
