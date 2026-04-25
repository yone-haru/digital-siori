import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import { BottomNav } from "@/components/ui/bottom-nav";
import { splitDuration, formatDuration } from "@/lib/utils";

/* ── 今週（月〜日）の開始日（UTC+9 を考慮して日付文字列で判定） ── */
function getWeekBounds() {
  const now = new Date();
  const jstOffset = 9 * 60; // JST = UTC+9
  const localNow = new Date(now.getTime() + jstOffset * 60 * 1000);
  const todayStr = localNow.toISOString().slice(0, 10); // YYYY-MM-DD

  const dow = localNow.getUTCDay(); // 0=Sun ... 6=Sat
  const daysFromMon = dow === 0 ? 6 : dow - 1;

  const weekStart = new Date(localNow);
  weekStart.setUTCDate(localNow.getUTCDate() - daysFromMon);
  const weekStartStr = weekStart.toISOString().slice(0, 10);

  return { todayStr, weekStartStr };
}

/* ── 連続読書日数を計算 ── */
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

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default async function StatsPage() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { todayStr, weekStartStr } = getWeekBounds();

  /* ── データ並列取得 ── */
  const [{ data: books }, { data: sessions }, { data: weekSessions }] =
    await Promise.all([
      supabase
        .from("books")
        .select("status, current_page")
        .eq("user_id" as never, user.id),
      supabase
        .from("reading_sessions")
        .select("started_at, duration_seconds, start_page, end_page")
        .eq("user_id" as never, user.id),
      supabase
        .from("reading_sessions")
        .select("started_at, duration_seconds")
        .eq("user_id" as never, user.id)
        .gte("started_at", weekStartStr + "T00:00:00+09:00"),
    ]);

  /* ── 集計 ── */
  const finishedCount =
    books?.filter((b) => b.status === "finished").length ?? 0;
  const readingCount =
    books?.filter((b) => b.status === "reading").length ?? 0;

  const totalSeconds =
    sessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0;
  const { hours, minutes } = splitDuration(totalSeconds);

  const totalPages =
    sessions?.reduce(
      (s, r) => s + Math.max(0, (r.end_page ?? 0) - (r.start_page ?? 0)),
      0
    ) ?? 0;

  // 平均（セッションがある日数）
  const sessionDates =
    sessions?.map((s) => s.started_at.slice(0, 10)) ?? [];
  const uniqueDays = new Set(sessionDates).size;
  const avgMinPerDay =
    uniqueDays > 0 ? Math.round(totalSeconds / 60 / uniqueDays) : 0;

  const streak = calcStreak(sessionDates, todayStr);

  /* ── 今週のバーチャート用データ ── */
  const weekMinsByDay: number[] = Array(7).fill(0); // index 0=Mon
  for (const s of weekSessions ?? []) {
    // JST 変換して曜日を取得
    const d = new Date(s.started_at);
    const jstDay = new Date(d.getTime() + 9 * 60 * 60 * 1000).getUTCDay();
    const idx = jstDay === 0 ? 6 : jstDay - 1;
    weekMinsByDay[idx] += Math.round((s.duration_seconds ?? 0) / 60);
  }
  const weekTotalSec =
    weekSessions?.reduce((s, r) => s + (r.duration_seconds ?? 0), 0) ?? 0;

  // 今日が Mon(0)~Sun(6) の何番目か
  const todayDate = new Date(todayStr + "T00:00:00Z");
  const todayDow = todayDate.getUTCDay();
  const todayIdx = todayDow === 0 ? 6 : todayDow - 1;

  const maxMins = Math.max(...weekMinsByDay, 1);
  const BAR_MAX_H = 52;

  return (
    <div className="min-h-screen bg-paper flex flex-col pb-20">
      {/* Header */}
      <div className="px-7 pt-12 pb-0">
        <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-1">
          Reading Record
        </p>
        <h1 className="font-shippori text-[32px] font-medium text-ink">
          読書手帖
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto px-7 pt-6">
        {/* ── Hero: Total Reading Time ── */}
        <div className="mb-7">
          <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2.5">
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
              className={`font-cormorant font-light text-ink-2 leading-none tracking-[-0.02em] ${hours > 0 ? "text-[48px]" : "text-[80px]"}`}
            >
              {minutes}
            </span>
            <span className="font-cormorant text-[28px] font-light text-muted">
              m
            </span>
          </div>
          <p className="font-zen text-[11px] text-muted-2 mt-1.5">
            1日平均 {avgMinPerDay} 分
          </p>
        </div>

        {/* ── 4-grid stats ── */}
        <div
          className="grid grid-cols-2 gap-px mb-7 rounded-sm overflow-hidden"
          style={{ background: "var(--color-line)" }}
        >
          {[
            {
              label: "Finished",
              value: finishedCount,
              unit: "books",
              sub: "読了した本",
            },
            {
              label: "Reading",
              value: readingCount,
              unit: "books",
              sub: "読書中の本",
            },
            {
              label: "Pages",
              value: totalPages.toLocaleString("ja-JP"),
              unit: "",
              sub: "読んだページ",
            },
            {
              label: "Streak",
              value: streak,
              unit: "days",
              sub: "連続読書日数",
            },
          ].map(({ label, value, unit, sub }) => (
            <div key={label} className="bg-paper px-[18px] py-4">
              <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase mb-2">
                {label}
              </p>
              <div className="flex items-baseline gap-1">
                <span className="font-cormorant text-[34px] font-light text-ink leading-none tracking-[-0.02em]">
                  {value}
                </span>
                {unit && (
                  <span className="font-zen text-[12px] text-muted">{unit}</span>
                )}
              </div>
              <p className="font-zen text-[11px] text-muted-2 mt-1">{sub}</p>
            </div>
          ))}
        </div>

        {/* ── This Week bar chart ── */}
        <div className="mb-10">
          <div className="flex justify-between items-baseline mb-4">
            <p className="font-zen text-[10px] tracking-[0.25em] text-muted uppercase">
              This Week
            </p>
            <span className="font-cormorant text-[13px] text-muted">
              合計 {formatDuration(weekTotalSec)}
            </span>
          </div>

          <div
            className="flex justify-between items-end"
            style={{ height: BAR_MAX_H + 32 }}
          >
            {DAY_LABELS.map((label, i) => {
              const mins = weekMinsByDay[i];
              const barH =
                mins > 0 ? Math.max(4, Math.round((mins / maxMins) * BAR_MAX_H)) : 0;
              const isToday = i === todayIdx;

              return (
                <div
                  key={i}
                  className="flex flex-col items-center gap-1.5"
                  style={{ width: 32 }}
                >
                  <div
                    className="flex flex-col justify-end"
                    style={{ width: 32, height: BAR_MAX_H }}
                  >
                    {mins > 0 && (
                      <div
                        className="w-full rounded-t-[1px]"
                        style={{
                          height: barH,
                          background: isToday ? "var(--color-ink)" : "var(--color-muted-2)",
                          opacity: isToday ? 1 : 0.55,
                        }}
                      />
                    )}
                  </div>
                  <span
                    className={
                      isToday
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
      </div>

      <BottomNav />
    </div>
  );
}
