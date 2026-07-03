/** 無料プランの上限。mobile/src/lib/limits.ts と必ず同じ値にすること */
export const FREE_LIMITS = {
  /** 本棚の最大冊数 */
  books: 20,
  /** タグの最大数 */
  tags: 3,
  /** 本詳細に表示するセッション履歴の最大件数 */
  sessionsPerBook: 10,
  /** 統計の表示期間（ヶ月） */
  statsMonths: 3,
} as const;
