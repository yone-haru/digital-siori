import Link from "next/link";
import { BookCover } from "@/components/books/book-cover";

type Props = {
  id: string;
  title: string;
  coverUrl?: string | null;
  currentPage?: number;
  totalPages?: number;
  showProgress?: boolean;
};

export function BookCard({
  id,
  title,
  coverUrl,
  currentPage = 0,
  totalPages = 0,
  showProgress = false,
}: Props) {
  const pct =
    totalPages > 0 ? Math.min(100, Math.round((currentPage / totalPages) * 100)) : 0;

  return (
    <Link href={`/books/${id}`} className="flex flex-col gap-2 active:opacity-70 transition-opacity">
      <BookCover title={title} coverUrl={coverUrl} width={104} height={152} />

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
