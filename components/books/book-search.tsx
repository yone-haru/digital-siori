"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { searchGoogleBooks, type GoogleBook } from "@/lib/google-books";
import { addBook } from "@/app/books/add/actions";
import { ManualAddForm } from "@/components/books/manual-add-form";

type SearchState = "idle" | "loading" | "done" | "error";

export function BookSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [showManual, setShowManual] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearchState("loading");
    setResults([]);
    setShowManual(false);
    try {
      const books = await searchGoogleBooks(query);
      setResults(books);
      setSearchState("done");
    } catch (err) {
      console.error("Book search failed:", err);
      setSearchState("error");
    }
  }

  function handleAdd(book: GoogleBook) {
    setAddError(null);
    setAddingId(book.googleId);
    startTransition(async () => {
      const result = await addBook({
        title: book.title,
        author: book.author,
        cover_url: book.thumbnail,
        total_pages: book.pageCount,
        isbn: book.isbn,
        description: book.description,
      });
      if (result && "error" in result) {
        setAddError(result.error);
        setAddingId(null);
      }
    });
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="px-7 pt-4 pb-0">
        <h1 className="font-shippori text-[28px] font-medium text-ink mb-1">
          本を棚に加える
        </h1>
        <p className="font-zen text-[12px] text-muted mb-6">
          タイトルや著者で検索してください
        </p>

        {/* Search form */}
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-2.5 border-b-[1.5px] border-ink pb-2.5 mb-7">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="text-muted-2 shrink-0"
            >
              <circle
                cx="6.5"
                cy="6.5"
                r="5"
                stroke="currentColor"
                strokeWidth="1.3"
              />
              <path
                d="M10.5 10.5L14 14"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
              />
            </svg>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="例：海辺のカフカ"
              autoFocus
              className="flex-1 bg-transparent outline-none font-zen text-[16px] text-ink placeholder:text-muted-2 min-w-0"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setSearchState("idle");
                  inputRef.current?.focus();
                }}
                className="text-muted-2 shrink-0"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4l8 8M12 4l-8 8"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* States */}
      <div className="flex-1 overflow-y-auto px-7 pb-32">
        {/* Loading */}
        {searchState === "loading" && (
          <div className="flex items-center justify-center py-16">
            <span className="font-zen text-[11px] tracking-[0.2em] text-muted-2 uppercase animate-pulse">
              Searching...
            </span>
          </div>
        )}

        {/* Error */}
        {searchState === "error" && (
          <p className="text-center font-zen text-[12px] text-[#7C2B28] py-8">
            検索に失敗しました。もう一度お試しください。
          </p>
        )}

        {/* Results */}
        {searchState === "done" && (
          <>
            {/* Results header */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
                  Results
                </span>
                <span className="font-cormorant text-[13px] text-muted-2">
                  · {results.length}
                </span>
              </div>
              <span className="font-zen text-[10px] text-muted-2 tracking-[0.05em]">
                Google Books
              </span>
            </div>

            {/* Add error */}
            {addError && (
              <p className="font-zen text-[12px] text-[#7C2B28] mb-4 text-center">
                {addError}
              </p>
            )}

            {/* Result rows */}
            {results.length > 0 ? (
              <ul>
                {results.map((book) => (
                  <li
                    key={book.googleId}
                    className="border-t border-line py-3.5 flex items-center gap-3.5"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-[68px] rounded-[1px] overflow-hidden bg-line-2 shrink-0 shadow-[1px_1px_4px_rgba(0,0,0,0.15)]">
                      {book.thumbnail ? (
                        <Image
                          src={book.thumbnail}
                          alt={book.title}
                          width={48}
                          height={68}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-end p-1">
                          <span className="font-zen text-[7px] text-muted-2 leading-[1.3] break-all">
                            {book.title.slice(0, 6)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-shippori text-[15px] text-ink mb-0.5 truncate">
                        {book.title}
                      </p>
                      <p className="font-zen text-[12px] text-muted mb-0.5 truncate">
                        {book.author}
                      </p>
                      <p className="font-cormorant text-[12px] text-muted-2">
                        {book.publishedYear}
                        {book.publishedYear && book.pageCount > 0 && " · "}
                        {book.pageCount > 0 && `${book.pageCount}p`}
                      </p>
                    </div>

                    {/* Add button */}
                    <button
                      onClick={() => handleAdd(book)}
                      disabled={addingId === book.googleId || isPending}
                      className="w-9 h-9 rounded-full border border-line flex items-center justify-center text-muted shrink-0 hover:border-ink hover:text-ink transition-colors disabled:opacity-40"
                      aria-label={`${book.title}を追加`}
                    >
                      {addingId === book.googleId ? (
                        <span className="font-cormorant text-[11px]">…</span>
                      ) : (
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            d="M7 2v10M2 7h10"
                            stroke="currentColor"
                            strokeWidth="1.4"
                            strokeLinecap="round"
                          />
                        </svg>
                      )}
                    </button>
                  </li>
                ))}
                <li className="border-t border-line" />
              </ul>
            ) : (
              <p className="font-zen text-[13px] text-muted text-center py-8">
                「{query}」の検索結果が見つかりませんでした
              </p>
            )}

            {/* Manual add prompt */}
            {!showManual && (
              <div className="text-center py-6">
                <p className="font-zen text-[12px] text-muted mb-1">
                  見つからない場合は
                </p>
                <button
                  onClick={() => setShowManual(true)}
                  className="font-zen text-[12px] text-ink underline underline-offset-2"
                >
                  手動で登録する
                </button>
              </div>
            )}
          </>
        )}

        {/* Idle state — manual add shortcut */}
        {searchState === "idle" && (
          <div className="text-center py-8">
            <p className="font-zen text-[12px] text-muted mb-1">
              見つからない場合は
            </p>
            <button
              onClick={() => setShowManual(true)}
              className="font-zen text-[12px] text-ink underline underline-offset-2"
            >
              手動で登録する
            </button>
          </div>
        )}

        {/* Manual add form */}
        {showManual && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
                Manual Entry
              </span>
              <button
                onClick={() => setShowManual(false)}
                className="font-zen text-[11px] text-muted-2 hover:text-ink transition-colors"
              >
                キャンセル
              </button>
            </div>
            <ManualAddForm />
          </div>
        )}
      </div>
    </div>
  );
}
