function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Date → 端末タイムゾーンでの YYYY-MM-DD */
export function localDateStr(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** 端末タイムゾーンでの今日の YYYY-MM-DD */
export function todayStr(): string {
  return localDateStr();
}

/** ISOタイムスタンプ → 端末タイムゾーンでの YYYY-MM-DD */
export function dateStrOf(iso: string): string {
  return localDateStr(new Date(iso));
}
