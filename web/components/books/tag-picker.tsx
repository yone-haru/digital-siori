"use client";

import { useState, useTransition, useRef } from "react";
import {
  addTagToBook,
  removeTagFromBook,
  createTag,
} from "@/app/books/[id]/actions";
import { useSubscription } from "@/components/providers/subscription-provider";
import { FREE_LIMITS } from "@/lib/limits";

export type Tag = { id: string; name: string };

export function TagPicker({
  bookId,
  bookTags,
  allTags,
}: {
  bookId: string;
  bookTags: Tag[];
  allTags: Tag[];
}) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const { isPro, openPaywall } = useSubscription();

  const bookTagIds = new Set(bookTags.map((t) => t.id));
  const availableTags = allTags.filter((t) => !bookTagIds.has(t.id));

  function handleAdd(tagId: string) {
    startTransition(async () => {
      await addTagToBook(bookId, tagId);
      setOpen(false);
    });
  }

  function handleRemove(tagId: string) {
    startTransition(async () => {
      await removeTagFromBook(bookId, tagId);
    });
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    if (!isPro && allTags.length >= FREE_LIMITS.tags) {
      openPaywall();
      return;
    }
    setNewName("");
    startTransition(async () => {
      await createTag(bookId, name);
      setOpen(false);
    });
  }

  return (
    <div>
      <div className="flex items-baseline gap-2 mb-3">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
          分類タグ
        </p>
        <p className="font-zen text-[10px] text-muted-2">本をカテゴリーで整理できます</p>
      </div>

      {/* Current tags + add button */}
      <div className="flex flex-wrap gap-2">
        {bookTags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => handleRemove(tag.id)}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1 bg-ink text-paper rounded-full font-zen text-[11px] tracking-[0.04em] disabled:opacity-50"
          >
            {tag.name}
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
              <path
                d="M1 1l6 6M7 1L1 7"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ))}
        <button
          onClick={() => {
            setOpen((v) => !v);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="flex items-center gap-1 px-3 py-1 border border-line rounded-full font-zen text-[11px] text-muted-2 hover:border-ink hover:text-ink transition-colors"
        >
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
            <path
              d="M4.5 1v7M1 4.5h7"
              stroke="currentColor"
              strokeWidth="1.3"
              strokeLinecap="round"
            />
          </svg>
          追加
        </button>
      </div>

      {/* Picker panel */}
      {open && (
        <div className="mt-3 border border-line rounded-sm p-3 flex flex-col gap-2.5">
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => handleAdd(tag.id)}
                  disabled={isPending}
                  className="px-2.5 py-1 border border-line rounded-full font-zen text-[11px] text-muted hover:bg-ink hover:text-paper hover:border-ink transition-colors disabled:opacity-50"
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={handleCreate}
            className={`flex items-center gap-2 ${availableTags.length > 0 ? "border-t border-line pt-2.5" : ""}`}
          >
            <input
              ref={inputRef}
              value={newName}
              onChange={(e) => setNewName(e.target.value.slice(0, 20))}
              placeholder="新しいタグを作成..."
              className="flex-1 bg-transparent font-zen text-[12px] text-ink placeholder:text-muted-2 outline-none"
            />
            <button
              type="submit"
              disabled={!newName.trim() || isPending}
              className="font-zen text-[11px] text-muted disabled:opacity-30 hover:text-ink transition-colors whitespace-nowrap"
            >
              作成
            </button>
          </form>

          <button
            onClick={() => setOpen(false)}
            className="font-zen text-[10px] text-muted-2 text-right hover:text-muted transition-colors"
          >
            閉じる
          </button>
        </div>
      )}
    </div>
  );
}
