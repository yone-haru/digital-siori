"use client";

import { useSubscription } from "@/components/providers/subscription-provider";
import { FREE_LIMITS } from "@/lib/limits";
import { ManualSessionForm } from "@/components/books/manual-session-form";
import { formatDuration, formatSessionDate } from "@/lib/utils";

export type SessionRow = {
  id: string;
  started_at: string;
  start_page: number;
  end_page: number;
  duration_seconds: number;
};

export function SessionHistorySection({
  bookId,
  sessions,
  currentPage,
  totalPages,
  sessionDates,
}: {
  bookId: string;
  sessions: SessionRow[];
  currentPage: number;
  totalPages?: number;
  sessionDates?: string[];
}) {
  const { isPro, openPaywall } = useSubscription();

  // 非Proは最新 sessionsPerBook 件までに絞る（フェッチ自体はサーバー側で全件済み）
  const visibleSessions = isPro
    ? sessions
    : sessions.slice(0, FREE_LIMITS.sessionsPerBook);
  const showProBanner = !isPro && sessions.length >= FREE_LIMITS.sessionsPerBook;

  return (
    <div>
      <ManualSessionForm
        bookId={bookId}
        currentPage={currentPage}
        totalPages={totalPages}
        sessionDates={sessionDates}
      />
      {sessions.length > 0 ? (
        <ul>
          {visibleSessions.map((s) => {
            const pagesRead = (s.end_page ?? 0) - (s.start_page ?? 0);
            return (
              <li key={s.id} className="border-t border-line py-3.5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-shippori text-[14px] text-ink-2 mb-0.5">
                      {formatSessionDate(s.started_at)}
                    </p>
                    <p className="font-zen text-[11px] text-muted-2">
                      p.{s.start_page} → p.{s.end_page}
                      {pagesRead > 0 && ` · ${pagesRead}ページ`}
                    </p>
                  </div>
                  <span className="font-cormorant text-[16px] text-muted tracking-[0.02em]">
                    {formatDuration(s.duration_seconds)}
                  </span>
                </div>
              </li>
            );
          })}
          <li className="border-t border-line" />
        </ul>
      ) : (
        <p className="font-zen text-[12px] text-muted-2">記録なし</p>
      )}

      {showProBanner && (
        <button
          onClick={openPaywall}
          className="w-full mt-3 py-3 border border-line rounded-sm font-zen text-[11px] text-muted-2 hover:border-ink hover:text-ink transition-colors text-center"
        >
          Proプランで全履歴を表示
        </button>
      )}
    </div>
  );
}
