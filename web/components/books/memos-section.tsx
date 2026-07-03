"use client";

import { useState, useTransition } from "react";
import { DialInput } from "@/components/ui/dial-input";
import { addBookMemo, updateBookMemo, deleteBookMemo } from "@/app/books/[id]/actions";

export type BookMemo = {
  id: string;
  page_number: number;
  content: string;
  created_at: string;
};

export function MemosSection({
  bookId,
  currentPage,
  totalPages,
  initialMemos,
}: {
  bookId: string;
  currentPage: number;
  totalPages?: number;
  initialMemos: BookMemo[];
}) {
  const [memos, setMemos] = useState<BookMemo[]>(initialMemos);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(currentPage);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<BookMemo | null>(null);
  const [, startTransition] = useTransition();

  function openAdd() {
    setEditingId(null);
    setPage(currentPage);
    setText("");
    setError(null);
    setSheetOpen(true);
  }

  function openEdit(memo: BookMemo) {
    setEditingId(memo.id);
    setPage(memo.page_number);
    setText(memo.content);
    setError(null);
    setSheetOpen(true);
  }

  function closeSheet() {
    if (saving) return;
    setSheetOpen(false);
    setEditingId(null);
    setText("");
    setError(null);
  }

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    setError(null);

    if (editingId) {
      const res = await updateBookMemo(editingId, bookId, {
        pageNumber: page,
        content: text,
      });
      setSaving(false);
      if ("error" in res) {
        setError(res.error);
        return; // シートを開いたままにして入力を失わせない
      }
      setMemos((prev) =>
        prev.map((m) =>
          m.id === editingId ? { ...m, page_number: page, content: text.trim() } : m
        )
      );
    } else {
      const res = await addBookMemo(bookId, { pageNumber: page, content: text });
      setSaving(false);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setMemos((prev) => [...prev, res.memo]);
    }

    setSheetOpen(false);
    setEditingId(null);
    setText("");
  }

  function confirmDeleteMemo() {
    if (!deleting) return;
    const target = deleting;
    setMemos((prev) => prev.filter((m) => m.id !== target.id));
    setDeleting(null);
    startTransition(async () => {
      const res = await deleteBookMemo(target.id, bookId);
      if (res && "error" in res) {
        // 失敗したら元に戻す
        setMemos((prev) =>
          [...prev, target].sort((a, b) => a.created_at.localeCompare(b.created_at))
        );
      }
    });
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-2.5">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
          Memos
        </p>
        <button
          onClick={openAdd}
          className="font-zen text-[11px] text-muted-2 hover:text-ink transition-colors"
        >
          + 追加
        </button>
      </div>

      {memos.length === 0 ? (
        <p className="font-zen text-[12px] text-muted-2">メモなし</p>
      ) : (
        <ul>
          {memos.map((memo) => (
            <li
              key={memo.id}
              className="flex items-start gap-2.5 border-t border-line py-3"
            >
              <span className="font-cormorant text-[13px] text-muted-2 shrink-0 pt-px">
                p.{memo.page_number}
              </span>
              <span className="flex-1 font-zen text-[13px] text-ink-2 leading-[1.7]">
                {memo.content}
              </span>
              <div className="flex items-center gap-3 pt-0.5 shrink-0">
                <button
                  onClick={() => openEdit(memo)}
                  aria-label="メモを編集"
                  className="text-muted-2 hover:text-ink transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
                <button
                  onClick={() => setDeleting(memo)}
                  aria-label="メモを削除"
                  className="text-muted-2 hover:text-ink transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path
                      d="M2 2l10 10M12 2L2 12"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* メモ追加/編集シート */}
      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={closeSheet} />
          <div className="relative bg-paper rounded-t-sm px-7 pt-6 pb-10 shadow-[0_-8px_40px_rgba(0,0,0,0.2)]">
            <div className="w-10 h-[3px] bg-line rounded-full mx-auto mb-6" />

            <p className="font-shippori text-[18px] text-ink mb-5">
              {editingId ? "メモを編集" : "メモを追加"}
            </p>

            <div className="mb-4">
              <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                Page
              </label>
              <div className="flex items-baseline gap-1 border-b border-line pb-1.5">
                <span className="font-cormorant text-[14px] text-muted-2">p.</span>
                <DialInput
                  value={page}
                  onChange={setPage}
                  min={0}
                  max={totalPages && totalPages > 0 ? totalPages : undefined}
                  className="w-full font-cormorant text-[24px] text-ink leading-none tracking-[-0.02em]"
                />
              </div>
            </div>

            <div className="mb-5">
              <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                Note
              </label>
              <textarea
                autoFocus
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="メモを入力..."
                rows={4}
                className="w-full bg-transparent outline-none resize-none font-zen text-[14px] text-ink leading-[1.8] border-b border-line pb-2 placeholder:text-muted-2"
              />
            </div>

            {error && (
              <p className="font-zen text-[11px] text-[#7C2B28] mb-4">{error}</p>
            )}

            <button
              onClick={handleSave}
              disabled={saving || !text.trim()}
              className="w-full h-[50px] bg-ink font-zen text-[13px] tracking-[0.15em] text-paper rounded-sm disabled:opacity-40 mb-2.5"
            >
              {saving ? "..." : editingId ? "更新" : "保存"}
            </button>
            <button
              onClick={closeSheet}
              className="w-full h-[50px] border border-line font-zen text-[13px] tracking-[0.15em] text-ink rounded-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* メモ削除確認シート */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setDeleting(null)} />
          <div className="relative bg-paper rounded-t-sm px-7 pt-6 pb-10 shadow-[0_-8px_40px_rgba(0,0,0,0.2)]">
            <div className="w-10 h-[3px] bg-line rounded-full mx-auto mb-6" />

            <p className="font-shippori text-[20px] text-ink leading-[1.6] mb-4">
              メモを削除しますか？
            </p>

            <div className="flex gap-2.5 items-start bg-bg rounded-sm p-3.5 mb-6">
              <span className="font-cormorant text-[13px] text-muted-2 shrink-0 pt-px">
                p.{deleting.page_number}
              </span>
              <span className="font-zen text-[13px] text-ink-2 leading-[1.7] line-clamp-3">
                {deleting.content}
              </span>
            </div>

            <button
              onClick={confirmDeleteMemo}
              className="w-full h-[50px] bg-[#C77B6F] font-zen text-[13px] tracking-[0.15em] text-white rounded-sm mb-2.5"
            >
              削除する
            </button>
            <button
              onClick={() => setDeleting(null)}
              className="w-full h-[50px] border border-line font-zen text-[13px] tracking-[0.15em] text-ink rounded-sm"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
