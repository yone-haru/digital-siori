export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0s';
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  if (h > 0) return m > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${h}h`;
  if (m > 0) return s > 0 ? `${m}m ${String(s).padStart(2, '0')}s` : `${m}m`;
  return `${s}s`;
}

export function splitDuration(totalSeconds: number): { hours: number; minutes: number } {
  const total = Math.max(0, Math.floor(totalSeconds / 60));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

export function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${month}月${day}日（${dow}）`;
}

const BOOK_COLORS = [
  '#2B3A2E', '#7C2B28', '#1B2A3A', '#3A2B1E',
  '#2A2A3A', '#2B3A3A', '#3A2A2B', '#1E3A2A',
  '#6B4226', '#1A3A4A',
];

export function bookColor(title: string): string {
  let h = 0;
  for (const c of title) h = ((h << 5) - h + c.charCodeAt(0)) >>> 0;
  return BOOK_COLORS[h % BOOK_COLORS.length];
}

export function toJSTDate(isoString: string): string {
  return new Date(new Date(isoString).getTime() + 9 * 3600 * 1000)
    .toISOString()
    .slice(0, 10);
}

export function makeDayLabel(dateStr: string, todayStr: string): string {
  if (dateStr === todayStr) return '今日';
  const prev = new Date(todayStr + 'T00:00:00Z');
  prev.setUTCDate(prev.getUTCDate() - 1);
  if (dateStr === prev.toISOString().slice(0, 10)) return '昨日';
  const d = new Date(dateStr + 'T00:00:00Z');
  return `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
}

export function calcStreak(sessionDates: string[], todayStr: string): number {
  const unique = [...new Set(sessionDates)].sort().reverse();
  let streak = 0;
  let check = todayStr;
  for (const d of unique) {
    if (d === check) {
      streak++;
      const prev = new Date(check + 'T00:00:00Z');
      prev.setUTCDate(prev.getUTCDate() - 1);
      check = prev.toISOString().slice(0, 10);
    } else if (d < check) {
      break;
    }
  }
  return streak;
}
