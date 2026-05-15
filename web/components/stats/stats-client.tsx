"use client";

import { useState } from "react";
import { BookCover } from "@/components/books/book-cover";
import { BottomNav } from "@/components/ui/bottom-nav";
import { CalendarPicker } from "@/components/ui/calendar-picker";
import { formatDuration } from "@/lib/utils";

// ── Shared types (also imported by app/stats/page.tsx) ──
export type BookDayStat = {
  bookId: string;
  title: string;
  author: string;
  coverUrl: string | null;
  currentPage: number;
  totalPages: number;
  dayPages: number;
  dayMinutes: number;
  daySessions: number;
};

export type DayStat = {
  date: string;
  label: string;
  minutes: number;
  pages: number;
  sessions: number;
  books: BookDayStat[];
};

export type OverallStats = {
  hours: number;
  minutes: number;
  avgMinPerDay: number;
  finishedCount: number;
  readingCount: number;
  totalPages: number;
  streak: number;
};

// ─────────────────────────────────────────
// 選択日が属する週のデータを dayStats から計算
// ─────────────────────────────────────────
function computeWeekStats(
  dayStats: DayStat[],
  selectedDate: string
): { minsByDay: number[]; totalSec: number; activeIdx: number } {
  const d = new Date(selectedDate + "T00:00:00Z");
  const dow = d.getUTCDay();
  const activeIdx = dow === 0 ? 6 : dow - 1; // 0=Mon...6=Sun

  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - activeIdx);

  const minsByDay: number[] = Array(7).fill(0);
  let totalMin = 0;
  for (let i = 0; i < 7; i++) {
    const wd = new Date(monday);
    wd.setUTCDate(monday.getUTCDate() + i);
    const wdStr = wd.toISOString().slice(0, 10);
    const found = dayStats.find((s) => s.date === wdStr);
    if (found) {
      minsByDay[i] = found.minutes;
      totalMin += found.minutes;
    }
  }

  return { minsByDay, totalSec: totalMin * 60, activeIdx };
}

// ─────────────────────────────────────────
// StatCard
// ─────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub: string;
}) {
  return (
    <div className="bg-line-2 rounded-sm px-4 py-3.5">
      <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
        {label}
      </p>
      <span className="font-cormorant text-[32px] font-light text-ink leading-none tracking-[-0.02em]">
        {value}
      </span>
      <p className="font-zen text-[11px] text-muted-2 mt-1">{sub}</p>
    </div>
  );
}

// ─────────────────────────────────────────
// WeekChart
// ─────────────────────────────────────────
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];
const BAR_MAX_H = 48;

function WeekChart({
  minsByDay,
  totalSec,
  activeIdx,
}: {
  minsByDay: number[];
  totalSec: number;
  activeIdx: number;
}) {
  const maxMins = Math.max(...minsByDay, 1);

  return (
    <div>
      <div className="flex justify-between items-baseline mb-4">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
          This Week
        </p>
        <span className="font-cormorant text-[13px] text-muted">
          合計 {formatDuration(totalSec)}
        </span>
      </div>
      <div className="flex justify-between items-end" style={{ height: BAR_MAX_H + 44 }}>
        {DAY_LABELS.map((label, i) => {
          const mins = minsByDay[i];
          const barH =
            mins > 0 ? Math.max(4, Math.round((mins / maxMins) * BAR_MAX_H)) : 0;
          const isActive = i === activeIdx;

          return (
            <div
              key={i}
              className="flex flex-col items-center gap-1.5"
              style={{ width: 36 }}
            >
              <div
                className="flex flex-col justify-end items-center"
                style={{ width: 36, height: BAR_MAX_H + 16 }}
              >
                {mins > 0 && (
                  <span
                    className="font-cormorant text-[10px] leading-none mb-1"
                    style={{
                      color: isActive ? "var(--color-ink)" : "var(--color-muted-2)",
                      opacity: isActive ? 1 : 0.7,
                    }}
                  >
                    {mins}m
                  </span>
                )}
                {mins > 0 && (
                  <div
                    className="w-full rounded-t-[1px]"
                    style={{
                      height: barH,
                      background: isActive
                        ? "var(--color-ink)"
                        : "var(--color-muted-2)",
                      opacity: isActive ? 1 : 0.55,
                    }}
                  />
                )}
              </div>
              <span
                className={
                  isActive
                    ? "font-cormorant text-[13px] font-semibold text-ink tracking-[0.02em] border-b border-ink pb-px"
                    : "font-zen text-[10px] text-muted-2 tracking-[0.08em]"
                }
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// BookDayCard
// ─────────────────────────────────────────
function BookDayCard({ book }: { book: BookDayStat }) {
  const pct =
    book.totalPages > 0
      ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100))
      : 0;

  const miniStats = [
    { value: book.dayPages, unit: "p", label: "ページ" },
    { value: book.dayMinutes, unit: "min", label: "時間" },
    { value: book.daySessions, unit: "", label: "セッション" },
  ];

  return (
    <div className="flex gap-3 items-start py-3.5 border-t border-line">
      <BookCover
        title={book.title}
        coverUrl={book.coverUrl}
        width={44}
        height={63}
      />
      <div className="flex-1 min-w-0">
        <p className="font-shippori text-[14px] text-ink mb-0.5 truncate">
          {book.title}
        </p>
        <p className="font-zen text-[11px] text-muted mb-2.5 truncate">
          {book.author}
        </p>

        <div className="flex mb-3">
          {miniStats.map((item, i) => (
            <div
              key={i}
              className={`flex-1 ${i > 0 ? "pl-3 border-l border-line" : ""} ${i < 2 ? "pr-1" : ""}`}
            >
              <div className="flex items-baseline gap-0.5">
                <span className="font-cormorant text-[20px] font-light text-ink leading-none tracking-[-0.01em]">
                  {item.value}
                </span>
                {item.unit && (
                  <span className="font-zen text-[9px] text-muted">
                    {item.unit}
                  </span>
                )}
              </div>
              <p className="font-zen text-[9px] text-muted-2 mt-0.5">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {book.totalPages > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex-1 h-[1.5px] bg-line rounded-[1px] overflow-hidden">
              <div
                className="h-full bg-ink rounded-[1px]"
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-cormorant text-[10px] text-muted-2 whitespace-nowrap">
              {book.currentPage}/{book.totalPages}p
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// TodayTab
// ─────────────────────────────────────────
function makeFallbackLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00Z");
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

function TodayTab({ dayStats }: { dayStats: DayStat[] }) {
  const [selectedDate, setSelectedDate] = useState(dayStats[0]?.date ?? "");

  const dayIdx = dayStats.findIndex((d) => d.date === selectedDate);

  const day: DayStat =
    dayIdx !== -1
      ? dayStats[dayIdx]
      : {
          date: selectedDate,
          label: makeFallbackLabel(selectedDate),
          minutes: 0,
          pages: 0,
          sessions: 0,
          books: [],
        };

  const { minsByDay, totalSec, activeIdx } = computeWeekStats(dayStats, day.date);

  return (
    <div>
      {/* Date navigator */}
      <div className="flex items-center justify-between px-7 py-4 border-b border-line">
        <button
          onClick={() => setSelectedDate(dayStats[dayIdx + 1].date)}
          disabled={dayIdx === -1 || dayIdx >= dayStats.length - 1}
          className="font-cormorant text-[28px] text-muted disabled:opacity-20 leading-none px-1 hover:text-ink transition-colors"
          aria-label="前の日"
        >
          ‹
        </button>

        <CalendarPicker
          value={day.date}
          onChange={setSelectedDate}
          max={dayStats[0].date}
          markedDates={dayStats.filter((d) => d.sessions > 0).map((d) => d.date)}
          trigger={
            <div className="text-center px-4 py-1">
              <p className="font-shippori text-[18px] text-ink leading-none">
                {day.label}
              </p>
              <p className="font-zen text-[10px] text-muted-2 tracking-[0.1em] mt-1">
                {day.date}
              </p>
            </div>
          }
        />

        <button
          onClick={() => setSelectedDate(dayStats[dayIdx - 1].date)}
          disabled={dayIdx <= 0}
          className="font-cormorant text-[28px] text-muted disabled:opacity-20 leading-none px-1 hover:text-ink transition-colors"
          aria-label="次の日"
        >
          ›
        </button>
      </div>

      {/* Reading time */}
      <div className="px-7 pt-6">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
          Reading Time
        </p>
        <div className="flex items-baseline gap-1.5">
          <span className="font-cormorant text-[80px] font-light text-ink leading-none tracking-[-0.03em]">
            {day.minutes}
          </span>
          <span className="font-cormorant text-[28px] font-light text-muted">
            min
          </span>
        </div>
      </div>

      {/* Pages + Sessions */}
      <div className="px-7 pt-4 grid grid-cols-2 gap-3">
        <StatCard label="Pages" value={day.pages} sub="読んだページ" />
        <StatCard label="Sessions" value={day.sessions} sub="セッション数" />
      </div>

      {/* This week */}
      <div className="px-7 pt-8">
        <WeekChart minsByDay={minsByDay} totalSec={totalSec} activeIdx={activeIdx} />
      </div>

      {/* Books */}
      <div className="px-7 pt-6 pb-6">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1">
          {dayIdx === 0 ? "Today's Books" : "This Day's Books"}
        </p>
        {day.books.length > 0 ? (
          <>
            {day.books.map((book) => (
              <BookDayCard key={book.bookId} book={book} />
            ))}
            <div className="border-t border-line" />
          </>
        ) : (
          <p className="font-zen text-[12px] text-muted-2 pt-3">記録なし</p>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// OverallTab
// ─────────────────────────────────────────
function OverallTab({ overall }: { overall: OverallStats }) {
  const {
    hours,
    minutes,
    avgMinPerDay,
    finishedCount,
    readingCount,
    totalPages,
    streak,
  } = overall;

  return (
    <div>
      <div className="px-7 pt-6">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
          Total Reading Time
        </p>
        <div className="flex items-baseline gap-1.5">
          {hours > 0 && (
            <>
              <span className="font-cormorant text-[80px] font-light text-ink leading-none tracking-[-0.03em]">
                {hours}
              </span>
              <span className="font-cormorant text-[28px] font-light text-muted">
                h
              </span>
            </>
          )}
          <span
            className={`font-cormorant font-light text-ink-2 leading-none tracking-[-0.02em] ${
              hours > 0 ? "text-[48px]" : "text-[80px]"
            }`}
          >
            {minutes}
          </span>
          <span className="font-cormorant text-[28px] font-light text-muted">
            m
          </span>
        </div>
        <p className="font-zen text-[11px] text-muted-2 mt-1.5">
          1日平均 {avgMinPerDay}分
        </p>
      </div>

      <div className="px-7 pt-4 grid grid-cols-2 gap-3 pb-6">
        <StatCard label="Finished" value={finishedCount} sub="読書完了した本" />
        <StatCard label="Reading" value={readingCount} sub="読書中の本" />
        <StatCard
          label="Pages"
          value={totalPages.toLocaleString("ja-JP")}
          sub="読んだページ"
        />
        <StatCard label="Streak" value={streak} sub="連続読書日数" />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────
// StatsClient (main export)
// ─────────────────────────────────────────
export function StatsClient({
  dayStats,
  overall,
}: {
  dayStats: DayStat[];
  overall: OverallStats;
}) {
  const [tab, setTab] = useState<"today" | "all">("today");

  return (
    <div className="min-h-screen bg-paper flex flex-col pb-20">
      {/* Header */}
      <div className="px-7 pt-10 pb-0 shrink-0">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1">
          Reading Record
        </p>
        <h1 className="font-shippori text-[30px] font-medium text-ink mb-4">
          読書手帖
        </h1>

        {/* Tab bar */}
        <div className="flex -mx-7 px-7 border-b border-line">
          {(
            [
              ["today", "今日"],
              ["all", "全体"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative py-2.5 mr-7 font-zen text-[11px] tracking-[0.15em] transition-colors ${
                tab === key ? "text-ink" : "text-muted-2"
              }`}
            >
              {label}
              {tab === key && (
                <span className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-ink" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "today" ? (
          <TodayTab dayStats={dayStats} />
        ) : (
          <OverallTab overall={overall} />
        )}
      </div>

      <BottomNav />
    </div>
  );
}
