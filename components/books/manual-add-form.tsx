"use client";

import { useActionState } from "react";
import { addBook } from "@/app/books/add/actions";

type ManualState = { error?: string };

async function addManualBook(
  _prevState: ManualState,
  formData: FormData
): Promise<ManualState> {
  const title = (formData.get("title") as string)?.trim();
  const author = (formData.get("author") as string)?.trim();
  const totalPages = Number(formData.get("total_pages"));

  if (!title || !author) return { error: "タイトルと著者は必須です。" };
  if (totalPages < 1) return { error: "総ページ数を正しく入力してください。" };

  return addBook({ title, author, total_pages: totalPages });
}

export function ManualAddForm() {
  const [state, formAction, isPending] = useActionState(addManualBook, {});

  return (
    <form action={formAction} className="flex flex-col gap-6 pb-8">
      {/* Title */}
      <div>
        <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
          Title <span className="text-[#7C2B28]">*</span>
        </label>
        <input
          type="text"
          name="title"
          required
          placeholder="書名を入力"
          className="w-full bg-transparent border-b border-line pb-2.5 outline-none font-shippori text-[17px] text-ink placeholder:text-muted-2 focus:border-ink transition-colors"
        />
      </div>

      {/* Author */}
      <div>
        <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
          Author <span className="text-[#7C2B28]">*</span>
        </label>
        <input
          type="text"
          name="author"
          required
          placeholder="著者名を入力"
          className="w-full bg-transparent border-b border-line pb-2.5 outline-none font-zen text-[16px] text-ink placeholder:text-muted-2 focus:border-ink transition-colors"
        />
      </div>

      {/* Total pages */}
      <div>
        <label className="block font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
          Total Pages <span className="text-[#7C2B28]">*</span>
        </label>
        <input
          type="number"
          name="total_pages"
          required
          min="1"
          placeholder="0"
          className="w-full bg-transparent border-b border-line pb-2.5 outline-none font-cormorant text-[19px] text-ink placeholder:text-muted-2 focus:border-ink transition-colors"
        />
      </div>

      {/* Error */}
      {state?.error && (
        <p className="font-zen text-[12px] text-[#7C2B28] text-center">
          {state.error}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full h-[52px] bg-ink text-paper font-zen text-[13px] tracking-[0.2em] uppercase rounded-sm disabled:opacity-50 transition-opacity"
      >
        {isPending ? "..." : "本棚に追加する"}
      </button>
    </form>
  );
}
