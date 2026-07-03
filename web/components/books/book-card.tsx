import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";

type Props = {
  id: string;
  title: string;
  coverUrl?: string | null;
  currentPage?: number;
  totalPages?: number;
  showProgress?: boolean;
  /** 選択モード中かどうか */
  selectionMode?: boolean;
  /** 選択モード中、この本が選択されているか */
  selected?: boolean;
  /** 選択モード中のタップで選択状態をトグルする */
  onToggleSelect?: (id: string) => void;
  /** 通常モードで長押し相当（右クリック）した際に選択モードへ入る */
  onEnterSelectionMode?: (id: string) => void;
};

export function BookCard({
  id,
  title,
  coverUrl,
  currentPage = 0,
  totalPages = 0,
  showProgress = false,
  selectionMode = false,
  selected = false,
  onToggleSelect,
  onEnterSelectionMode,
}: Props) {
  const pct =
    totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  function handleClick(e: React.MouseEvent) {
    if (selectionMode) {
      e.preventDefault();
      onToggleSelect?.(id);
    }
  }

  function handleContextMenu(e: React.MouseEvent) {
    if (!selectionMode && onEnterSelectionMode) {
      e.preventDefault();
      onEnterSelectionMode(id);
    }
  }

  return (
    <Link
      href={`/books/${id}`}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className="flex flex-col gap-2 active:opacity-70 transition-opacity"
    >
      <div className="relative">
        <BookCover title={title} coverUrl={coverUrl} width={104} height={152} />

        {/* 選択モード中の暗オーバーレイ */}
        {selected && (
          <div className="absolute inset-0 rounded-[1px] bg-ink/30 pointer-events-none" />
        )}

        {/* チェックサークル（右上） */}
        {selectionMode && (
          <div className="absolute top-1.5 right-1.5 w-[22px] h-[22px] pointer-events-none">
            <div className="absolute inset-0 rounded-full border-[1.8px] border-white/85 bg-black/20" />
            {selected && (
              <div className="absolute inset-0 rounded-full bg-ink flex items-center justify-center">
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path
                    d="M2 5.5l2.8 2.8L9 3"
                    stroke="var(--color-paper)"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            )}
          </div>
        )}
      </div>

      {showProgress && totalPages > 0 && (
        <div>
          <div className="h-[2px] bg-line-2 rounded-[1px] mb-[7px]">
            <div
              className="h-full bg-ink rounded-[1px] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="flex justify-between items-baseline">
            <span className="font-cormorant text-[15px] text-ink-2">
              {pct}
              <span className="text-[10px] text-muted-2">%</span>
            </span>
            <span className="font-cormorant text-[13px] text-muted tracking-[0.02em]">
              p.{currentPage}
            </span>
          </div>
        </div>
      )}
    </Link>
  );
}
