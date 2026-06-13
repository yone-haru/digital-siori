import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarPicker } from '../components/CalendarPicker';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useToast } from '../lib/toast';
import { C, F } from '../lib/colors';
import {
  formatDuration, splitDuration,
  makeDayLabel, calcStreak,
} from '../lib/utils';
import { todayStr, dateStrOf } from '../lib/date';
import { fetchStatsRaw, queryKeys } from '../data/queries';
import { BookCover } from '../components/BookCover';

type BookDayStat = {
  bookId: string; title: string; author: string; coverUrl: string | null;
  currentPage: number; totalPages: number;
  dayPages: number; dayMinutes: number; daySessions: number;
};
type DayStat = {
  date: string; label: string; minutes: number; pages: number; sessions: number; books: BookDayStat[];
};
type OverallStats = {
  hours: number; minutes: number; avgMinPerDay: number;
  finishedCount: number; readingCount: number; totalPages: number; streak: number;
};

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const BAR_MAX_H = 48;

export default function StatsScreen() {
  const { user } = useAuth();
  const { isPro, openPaywall } = useSubscription();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'today' | 'all'>('today');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: queryKeys.stats(user?.id ?? '', isPro),
    queryFn: () => fetchStatsRaw(user!.id, isPro),
    enabled: !!user,
  });

  useEffect(() => {
    if (isError) showToast('統計の読み込みに失敗しました', 'error');
  }, [isError, showToast]);

  // 他画面での記録を反映（キャッシュ表示→裏で再取得）
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['stats'] });
  }, [queryClient]));

  const { dayStats, overall } = useMemo((): { dayStats: DayStat[]; overall: OverallStats | null } => {
    if (!data) return { dayStats: [], overall: null };
    const today = todayStr();
    const { books, sessions } = data;

    const bookMap = new Map(books.map((b) => [b.id, b]));

    type DayBookAgg = { dayPages: number; dayMinutes: number; daySessions: number };
    const byDate = new Map<string, Map<string, DayBookAgg>>();

    for (const s of sessions ?? []) {
      const dateStr = dateStrOf(s.started_at);
      if (!byDate.has(dateStr)) byDate.set(dateStr, new Map());
      const byBook = byDate.get(dateStr)!;
      if (!byBook.has(s.book_id)) byBook.set(s.book_id, { dayPages: 0, dayMinutes: 0, daySessions: 0 });
      const agg = byBook.get(s.book_id)!;
      agg.dayPages += Math.max(0, (s.end_page ?? 0) - (s.start_page ?? 0));
      agg.dayMinutes += Math.round((s.duration_seconds ?? 0) / 60);
      agg.daySessions += 1;
    }

    if (!byDate.has(today)) byDate.set(today, new Map());

    const dStats: DayStat[] = [...byDate.entries()]
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([dateStr, byBook]) => {
        const bookDayStats: BookDayStat[] = [...byBook.entries()].map(([bookId, agg]) => {
          const book = bookMap.get(bookId);
          if (!book) return null;
          return { bookId, title: book.title, author: book.author, coverUrl: book.cover_url,
            currentPage: book.current_page, totalPages: book.total_pages, ...agg };
        }).filter(Boolean) as BookDayStat[];
        const totalMin = bookDayStats.reduce((s, b) => s + b.dayMinutes, 0);
        const totalPg = bookDayStats.reduce((s, b) => s + b.dayPages, 0);
        const totalSess = bookDayStats.reduce((s, b) => s + b.daySessions, 0);
        return { date: dateStr, label: makeDayLabel(dateStr, today), minutes: totalMin, pages: totalPg, sessions: totalSess, books: bookDayStats };
      });

    const allDates = sessions.map((s) => dateStrOf(s.started_at));
    const uniqueDays = new Set(allDates).size;
    const totalSeconds = sessions.reduce((s, r) => s + (r.duration_seconds ?? 0), 0);
    const { hours, minutes } = splitDuration(totalSeconds);
    const avgMin = uniqueDays > 0 ? Math.round(totalSeconds / 60 / uniqueDays) : 0;
    const totalPages = sessions.reduce((s, r) => s + Math.max(0, (r.end_page ?? 0) - (r.start_page ?? 0)), 0);
    // streak は無料プランの表示期間に関係なく全期間の日付で計算する
    const streakDates = data.allSessionStarts.map(dateStrOf);

    return {
      dayStats: dStats,
      overall: {
        hours, minutes, avgMinPerDay: avgMin,
        finishedCount: books.filter((b) => b.status === 'finished').length,
        readingCount: books.filter((b) => b.status === 'reading').length,
        totalPages, streak: calcStreak(streakDates, today),
      },
    };
  }, [data]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  if (isLoading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ActivityIndicator color={C.ink} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerLabel}>Reading Record</Text>
        <Text style={s.headerTitle}>読書手帖</Text>
        <View style={s.tabBar}>
          {(['today', 'all'] as const).map((key) => (
            <TouchableOpacity key={key} style={s.tabBtn} onPress={() => setTab(key)}>
              <Text style={[s.tabText, tab === key && s.tabTextActive]}>
                {key === 'today' ? '今日' : '全体'}
              </Text>
              {tab === key && <View style={s.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {!isPro && (
        <TouchableOpacity style={s.freeBanner} onPress={openPaywall} activeOpacity={0.8}>
          <Text style={s.freeBannerText}>直近3ヶ月を表示中</Text>
          <Text style={s.freeBannerLink}>Proで全期間表示 →</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.muted} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        {tab === 'today'
          ? <TodayTab dayStats={dayStats} />
          : overall && <OverallTab overall={overall} />}
      </ScrollView>
    </SafeAreaView>
  );
}

function TodayTab({ dayStats }: { dayStats: DayStat[] }) {
  const today = todayStr();
  const [selectedDate, setSelectedDate] = useState(dayStats[0]?.date ?? today);
  const dayIdx = dayStats.findIndex((d) => d.date === selectedDate);
  const day: DayStat = dayIdx !== -1 ? dayStats[dayIdx] : {
    date: selectedDate, label: makeDayLabel(selectedDate, today),
    minutes: 0, pages: 0, sessions: 0, books: [],
  };

  // Week chart data
  const d = new Date(day.date + 'T00:00:00Z');
  const dow = d.getUTCDay();
  const activeIdx = dow === 0 ? 6 : dow - 1;
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - activeIdx);
  const minsByDay: number[] = Array(7).fill(0);
  const weekDates: string[] = Array(7).fill('');
  let weekTotal = 0;
  for (let i = 0; i < 7; i++) {
    const wd = new Date(monday);
    wd.setUTCDate(monday.getUTCDate() + i);
    weekDates[i] = wd.toISOString().slice(0, 10);
    const found = dayStats.find((s) => s.date === weekDates[i]);
    if (found) { minsByDay[i] = found.minutes; weekTotal += found.minutes; }
  }
  const maxMins = Math.max(...minsByDay, 1);

  function prevDay() {
    if (dayIdx < dayStats.length - 1) setSelectedDate(dayStats[dayIdx + 1].date);
  }
  function nextDay() {
    if (dayIdx > 0) setSelectedDate(dayStats[dayIdx - 1].date);
  }

  return (
    <View>
      {/* Date navigator */}
      <View style={t.dateNav}>
        <TouchableOpacity onPress={prevDay} disabled={dayIdx >= dayStats.length - 1} hitSlop={8}>
          <Text style={[t.navArrow, dayIdx >= dayStats.length - 1 && t.navArrowDisabled]}>‹</Text>
        </TouchableOpacity>
        <CalendarPicker
          value={selectedDate}
          onChange={setSelectedDate}
          max={todayStr()}
          markedDates={dayStats.filter(d => d.sessions > 0).map(d => d.date)}
          trigger={
            <View style={t.dateCenter}>
              <Text style={t.dateLabel}>{day.label}</Text>
              <Text style={t.dateSub}>{day.date}</Text>
            </View>
          }
        />
        <TouchableOpacity onPress={nextDay} disabled={dayIdx <= 0} hitSlop={8}>
          <Text style={[t.navArrow, dayIdx <= 0 && t.navArrowDisabled]}>›</Text>
        </TouchableOpacity>
      </View>

      {/* Reading time */}
      <View style={t.heroSection}>
        <Text style={t.heroLabel}>Reading Time</Text>
        <View style={t.heroRow}>
          <Text style={t.heroNum}>{day.minutes}</Text>
          <Text style={t.heroUnit}>min</Text>
        </View>
      </View>

      {/* Pages + Sessions */}
      <View style={t.statCards}>
        {[
          { label: 'Pages', value: day.pages, sub: '読んだページ' },
          { label: 'Sessions', value: day.sessions, sub: 'セッション数' },
        ].map((item) => (
          <View key={item.label} style={t.statCard}>
            <Text style={t.statLabel}>{item.label}</Text>
            <Text style={t.statValue}>{item.value}</Text>
            <Text style={t.statSub}>{item.sub}</Text>
          </View>
        ))}
      </View>

      {/* Week chart */}
      <View style={t.weekSection}>
        <View style={t.weekHeader}>
          <Text style={t.weekLabel}>This Week</Text>
          <Text style={t.weekTotal}>合計 {formatDuration(weekTotal * 60)}</Text>
        </View>
        <View style={t.chart}>
          {DAY_LABELS.map((label, i) => {
            const mins = minsByDay[i];
            const barH = mins > 0 ? Math.max(4, Math.round((mins / maxMins) * BAR_MAX_H)) : 0;
            const isActive = i === activeIdx;
            const isFuture = weekDates[i] > today;
            return (
              // バーをタップしてその日の記録に移動できる
              <TouchableOpacity
                key={i} style={t.barCol}
                disabled={isFuture}
                onPress={() => setSelectedDate(weekDates[i])}
                activeOpacity={0.6}
                hitSlop={4}
              >
                <View style={[t.barContainer, { height: BAR_MAX_H + 16 }]}>
                  {mins > 0 && (
                    <Text style={[t.barMinLabel, { color: isActive ? C.ink : C.muted2, opacity: isActive ? 1 : 0.7 }]}>
                      {mins}m
                    </Text>
                  )}
                  {mins > 0 && (
                    <View style={[t.bar, { height: barH, backgroundColor: isActive ? C.ink : C.muted2, opacity: isActive ? 1 : 0.55 }]} />
                  )}
                </View>
                <Text style={[isActive ? t.dayLabelActive : t.dayLabel, isFuture && { opacity: 0.35 }]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Books */}
      <View style={t.booksSection}>
        <Text style={t.booksLabel}>{dayIdx === 0 ? "Today's Books" : "This Day's Books"}</Text>
        {day.books.length === 0 ? (
          <Text style={t.noBooks}>記録なし</Text>
        ) : (
          day.books.map((book) => <BookDayCard key={book.bookId} book={book} />)
        )}
      </View>
    </View>
  );
}

function BookDayCard({ book }: { book: BookDayStat }) {
  const pct = book.totalPages > 0 ? Math.min(100, Math.round((book.currentPage / book.totalPages) * 100)) : 0;
  return (
    <View style={bc.item}>
      <BookCover title={book.title} coverUrl={book.coverUrl} width={44} height={63} />
      <View style={bc.info}>
        <Text style={bc.title} numberOfLines={1}>{book.title}</Text>
        <Text style={bc.author} numberOfLines={1}>{book.author}</Text>
        <View style={bc.miniStats}>
          {[
            { v: book.dayPages, u: 'p', l: 'ページ' },
            { v: book.dayMinutes, u: 'min', l: '時間' },
            { v: book.daySessions, u: '', l: 'セッション' },
          ].map((item, i) => (
            <View key={i} style={[bc.miniStatCol, i > 0 && bc.miniStatBorder]}>
              <View style={bc.miniStatRow}>
                <Text style={bc.miniStatNum}>{item.v}</Text>
                {item.u ? <Text style={bc.miniStatUnit}>{item.u}</Text> : null}
              </View>
              <Text style={bc.miniStatLabel}>{item.l}</Text>
            </View>
          ))}
        </View>
        {book.totalPages > 0 && (
          <View style={bc.progRow}>
            <View style={bc.progBg}>
              <View style={[bc.progFill, { width: `${pct}%` as any }]} />
            </View>
            <Text style={bc.progText}>{book.currentPage}/{book.totalPages}p</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function OverallTab({ overall }: { overall: OverallStats }) {
  return (
    <View>
      <View style={ov.heroSection}>
        <Text style={ov.heroLabel}>Total Reading Time</Text>
        <View style={ov.heroRow}>
          {overall.hours > 0 && (
            <>
              <Text style={ov.heroNum}>{overall.hours}</Text>
              <Text style={ov.heroUnit}>h</Text>
            </>
          )}
          <Text style={[ov.heroNum, overall.hours > 0 && { fontSize: 48 }]}>{overall.minutes}</Text>
          <Text style={ov.heroUnit}>m</Text>
        </View>
        <Text style={ov.heroSub}>1日平均 {overall.avgMinPerDay}分</Text>
      </View>
      <View style={ov.grid}>
        {[
          { label: 'Finished', value: overall.finishedCount, sub: '読書完了した本' },
          { label: 'Reading', value: overall.readingCount, sub: '読書中の本' },
          { label: 'Pages', value: overall.totalPages.toLocaleString('ja-JP'), sub: '読んだページ' },
          { label: 'Streak', value: overall.streak, sub: '連続読書日数' },
        ].map((item) => (
          <View key={item.label} style={ov.card}>
            <Text style={ov.cardLabel}>{item.label}</Text>
            <Text style={ov.cardValue}>{item.value}</Text>
            <Text style={ov.cardSub}>{item.sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  header: { paddingHorizontal: 28, paddingTop: 10, paddingBottom: 0 },
  freeBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 28, marginTop: 8, marginBottom: 2,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 2, borderWidth: 1, borderColor: C.line,
  },
  freeBannerText: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  freeBannerLink: { fontFamily: F.zen, fontSize: 11, color: C.ink, textDecorationLine: 'underline' },
  headerLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  headerTitle: { fontFamily: F.shippori, fontSize: 28, color: C.ink, marginBottom: 16 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: C.line },
  tabBtn: { marginRight: 28, paddingVertical: 10, position: 'relative' },
  tabText: { fontFamily: F.zen, fontSize: 11, letterSpacing: 1.5, color: C.muted2 },
  tabTextActive: { color: C.ink },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 1.5, backgroundColor: C.ink },
});

const t = StyleSheet.create({
  dateNav: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  navArrow: { fontFamily: F.cormorant, fontSize: 28, color: C.muted },
  navArrowDisabled: { opacity: 0.2 },
  dateCenter: { alignItems: 'center', paddingHorizontal: 16 },
  dateLabel: { fontFamily: F.shippori, fontSize: 18, color: C.ink },
  dateSub: { fontFamily: F.zen, fontSize: 10, color: C.muted2, letterSpacing: 1, marginTop: 4 },
  heroSection: { paddingHorizontal: 28, paddingTop: 24 },
  heroLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase', marginBottom: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  heroNum: { fontFamily: F.cormorantLight, fontSize: 72, color: C.ink, lineHeight: 76 },
  heroUnit: { fontFamily: F.cormorantLight, fontSize: 28, color: C.muted },
  statCards: { flexDirection: 'row', gap: 12, paddingHorizontal: 28, paddingTop: 16 },
  statCard: { flex: 1, backgroundColor: C.line2, borderRadius: 2, padding: 14 },
  statLabel: { fontFamily: F.zen, fontSize: 9, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 8 },
  statValue: { fontFamily: F.cormorantLight, fontSize: 30, color: C.ink, lineHeight: 32 },
  statSub: { fontFamily: F.zen, fontSize: 10, color: C.muted2, marginTop: 4 },
  weekSection: { paddingHorizontal: 28, paddingTop: 32 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 },
  weekLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase' },
  weekTotal: { fontFamily: F.cormorant, fontSize: 13, color: C.muted },
  chart: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  barCol: { alignItems: 'center', gap: 6, width: 36 },
  barContainer: { width: 36, justifyContent: 'flex-end', alignItems: 'center' },
  barMinLabel: { fontFamily: F.cormorant, fontSize: 10, marginBottom: 4 },
  bar: { width: '100%', borderRadius: 1 },
  dayLabel: { fontFamily: F.zen, fontSize: 10, color: C.muted2, letterSpacing: 0.8 },
  dayLabelActive: { fontFamily: F.cormorant, fontSize: 13, fontWeight: '600', color: C.ink, borderBottomWidth: 1, borderBottomColor: C.ink },
  booksSection: { paddingHorizontal: 28, paddingTop: 32 },
  booksLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  noBooks: { fontFamily: F.zen, fontSize: 12, color: C.muted2, paddingTop: 12 },
});

const bc = StyleSheet.create({
  item: {
    flexDirection: 'row', gap: 12, paddingVertical: 14,
    borderTopWidth: 1, borderTopColor: C.line,
  },
  info: { flex: 1 },
  title: { fontFamily: F.shippori, fontSize: 14, color: C.ink, marginBottom: 2 },
  author: { fontFamily: F.zen, fontSize: 11, color: C.muted, marginBottom: 10 },
  miniStats: { flexDirection: 'row', marginBottom: 12 },
  miniStatCol: { flex: 1, paddingRight: 8 },
  miniStatBorder: { borderLeftWidth: 1, borderLeftColor: C.line, paddingLeft: 12 },
  miniStatRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  miniStatNum: { fontFamily: F.cormorantLight, fontSize: 19, color: C.ink, lineHeight: 22 },
  miniStatUnit: { fontFamily: F.zen, fontSize: 9, color: C.muted },
  miniStatLabel: { fontFamily: F.zen, fontSize: 9, color: C.muted2, marginTop: 2 },
  progRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  progBg: { flex: 1, height: 1.5, backgroundColor: C.line, borderRadius: 1, overflow: 'hidden' },
  progFill: { height: '100%', backgroundColor: C.ink, borderRadius: 1 },
  progText: { fontFamily: F.cormorant, fontSize: 10, color: C.muted2, flexShrink: 0 },
});

const ov = StyleSheet.create({
  heroSection: { paddingHorizontal: 28, paddingTop: 24 },
  heroLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase', marginBottom: 8 },
  heroRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  heroNum: { fontFamily: F.cormorantLight, fontSize: 72, color: C.ink, lineHeight: 76 },
  heroUnit: { fontFamily: F.cormorantLight, fontSize: 28, color: C.muted },
  heroSub: { fontFamily: F.zen, fontSize: 11, color: C.muted2, marginTop: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 28, paddingTop: 16 },
  card: { width: '47%', backgroundColor: C.line2, borderRadius: 2, padding: 14 },
  cardLabel: { fontFamily: F.zen, fontSize: 9, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 8 },
  cardValue: { fontFamily: F.cormorantLight, fontSize: 30, color: C.ink, lineHeight: 32 },
  cardSub: { fontFamily: F.zen, fontSize: 10, color: C.muted2, marginTop: 4 },
});
