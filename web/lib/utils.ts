/** 秒数 → "45s" / "42m 18s" / "1h 08m" */
export function formatDuration(totalSeconds: number): string {
  if (totalSeconds <= 0) return "0s";
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);

  if (h > 0) {
    return m > 0 ? `${h}h ${String(m).padStart(2, "0")}m` : `${h}h`;
  }
  if (m > 0) {
    return s > 0 ? `${m}m ${String(s).padStart(2, "0")}s` : `${m}m`;
  }
  return `${s}s`;
}

/** 秒数 → { hours, minutes } — Stats ページのヒーロー数字用 */
export function splitDuration(totalSeconds: number): { hours: number; minutes: number } {
  const total = Math.max(0, Math.floor(totalSeconds / 60));
  return { hours: Math.floor(total / 60), minutes: total % 60 };
}

/** ISO 文字列 → "11月14日（木）" */
export function formatSessionDate(iso: string): string {
  const d = new Date(iso);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = ["日", "月", "火", "水", "木", "金", "土"][d.getDay()];
  return `${month}月${day}日（${dow}）`;
}

const BOOK_COLORS = [
  "#2B3A2E",
  "#7C2B28",
  "#1B2A3A",
  "#3A2B1E",
  "#2A2A3A",
  "#2B3A3A",
  "#3A2A2B",
  "#1E3A2A",
  "#6B4226",
  "#1A3A4A",
];

/** タイトルから一貫した背景色を返す */
export function bookColor(title: string): string {
  let h = 0;
  for (const c of title) h = ((h << 5) - h + c.charCodeAt(0)) >>> 0;
  return BOOK_COLORS[h % BOOK_COLORS.length];
}
