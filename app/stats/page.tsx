import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { StatsClient } from "@/components/stats/stats-client";
import type { DayStat, OverallStats, BookDayStat } from "@/components/stats/stats-client";
import { splitDuration } from "@/lib/utils";

function toJSTDate(isoString: string): string {
  return new Date(new Date(isoString).getTime() + 9 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
}

function makeDayLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return "今日";
  const prev = new Date(todayStr + "T00:00:00Z");
  prev.setUTCDate(prev.getUTCDate() - 1);
  if (dateStr === prev.toISOString().slice(0, 10)) return "昨日";
  const d = new Date(dateStr + "T00:00:00Z");
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function calcStreak(sessionDates: string[], todayStr: string): number {
  const unique = [...new Set(sessionDates)].sort().reverse();
  let streak = 0;
  let check = todayStr;
  for (const d of unique) {
    if (d === check) {
      streak++;
      const prev = new Date(check + "T00:00:00Z");
      prev.setUTCDate(prev.getUTCDate() - 1);
      check = prev.toISOString().slice(0, 10);
    } else if (d < check) {
      break;
    }
  }
  return streak;
}

export default async function StatsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const todayStr = new Date(new Date().getTime() + 9 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);

  const [{ data: books }, { data: sessions }] = await Promise.all([
    supabase
      .from("books")
      .select("id, title, author, cover_url, current_page, total_pages, status"),
    supabase
      .from("reading_sessions")
      .select("id, book_id, started_at, start_page, end_page, duration_seconds")
      .eq("user_id" as never, user.id)
      .order("started_at", { ascending: false }),
  ]);

  const bookMap = new Map((books ?? []).map((b) => [b.id, b]));

  type DayBookAgg = { dayPages: number; dayMinutes: number; daySessions: number };
  const byDate = new Map<string, Map<string, DayBookAgg>>();

  for (const s of sessions ?? []) {
    const dateStr = toJSTDate(s.started_at);
    if (!byDate.has(dateStr)) byDate.set(dateStr, new Map());
    const byBook = byDate.get(dateStr)!;
    if (!byBook.has(s.book_id)) {
      byBook.set(s.book_id, { dayPages: 0, dayMinutes: 0, daySessions: 0 });
    }
    const agg = byBook.get(s.book_id)!;
    agg.dayPages += Math.max(0, (s.end_page ?? 0) - (s.start_page ?? 0));
    agg.dayMinutes += Math.round((s.duration_seconds ?? 0) / 60);
    agg.daySessions += 1;
  }

  if (!byDate.has(todayStr)) byDate.set(todayStr, new Map());

  const dayStats: DayStat[] = [...byDate.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dateStr, byBook]) => {
      const bookDayStats: BookDayStat[] = [...byBook.entries()]
        .map(([bookId, agg]) => {
          const book = bookMap.get(bookId);
          if (!book) return null;
          return {
            bookId,
            title: book.title,
            author: book.author,
            coverUrl: book.cover_url,
            currentPage: book.current_page,
            totalPages: book.total_pages,
            ...agg,
          } satisfies BookDayStat;
        })
        .filter(Boolean) as BookDayStat[];

      const totalMinutes = bookDayStats.reduce((s, b) => s + b.dayMinutes, 0);
      const totalDayPages = bookDayStats.reduce((s, b) => s + b.dayPages, 0);
      const totalSessions = bookDayStats.reduce((s, b) => s + b.daySessions, 0);

      return {
        date: dateStr,
        label: makeDayLabel(dateStr, todayStr),
        minutes: totalMinutes,
        pages: totalDayPages,
        sessions: totalSessions,
        books: bookDayStats,
      };
    });

  const allSessionDates = (sessions ?? []).map((s) => toJSTDate(s.started_at));
  const uniqueDays = new Set(allSessionDates).size;
  const totalSeconds = (sessions ?? []).reduce(
    (s, r) => s + (r.duration_seconds ?? 0),
    0
  );
  const { hours, minutes } = splitDuration(totalSeconds);
  const avgMinPerDay =
    uniqueDays > 0 ? Math.round(totalSeconds / 60 / uniqueDays) : 0;
  const finishedCount = (books ?? []).filter((b) => b.status === "finished").length;
  const readingCount = (books ?? []).filter((b) => b.status === "reading").length;
  const totalPages = (sessions ?? []).reduce(
    (s, r) => s + Math.max(0, (r.end_page ?? 0) - (r.start_page ?? 0)),
    0
  );
  const streak = calcStreak(allSessionDates, todayStr);

  const overall: OverallStats = {
    hours,
    minutes,
    avgMinPerDay,
    finishedCount,
    readingCount,
    totalPages,
    streak,
  };

  return <StatsClient dayStats={dayStats} overall={overall} />;
}
