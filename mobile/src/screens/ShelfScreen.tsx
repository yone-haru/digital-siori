import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, RefreshControl, ActivityIndicator, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { C, F } from '../lib/colors';
import { bookColor } from '../lib/utils';
import type { BookStatus } from '../types';
import type { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Book = {
  id: string; title: string; author: string; cover_url: string | null;
  current_page: number; total_pages: number; status: BookStatus;
  created_at: string; updated_at: string; tagIds: string[];
};
type Tag = { id: string; name: string };
type FilterTab = 'all' | BookStatus;
type SortKey = 'updated_at' | 'created_at' | 'title';

const FILTERS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: 'すべて' },
  { key: 'reading', label: '読書中' },
  { key: 'rereading', label: '再読中' },
  { key: 'to_read', label: '未読' },
  { key: 'finished', label: '読書完了' },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'updated_at', label: '更新日順' },
  { key: 'created_at', label: '登録日順' },
  { key: 'title', label: 'タイトル順' },
];

const SECTIONS: { status: BookStatus; label: string }[] = [
  { status: 'reading', label: 'Reading' },
  { status: 'rereading', label: 'Re-Reading' },
  { status: 'to_read', label: 'To Read' },
  { status: 'finished', label: 'Finished' },
];

const H_PAD = 28;
const CARD_GAP = 8;

export default function ShelfScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const { width: screenWidth } = useWindowDimensions();
  const cardW = Math.floor((screenWidth - H_PAD * 2 - CARD_GAP * 2) / 3);

  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [tagFilter, setTagFilter] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: bData }, { data: btRows }, { data: tagRows }] = await Promise.all([
      supabase.from('books')
        .select('id,title,author,cover_url,current_page,total_pages,status,created_at,updated_at')
        .order('updated_at', { ascending: false }),
      supabase.from('book_tags').select('book_id,tag_id'),
      supabase.from('tags').select('id,name').eq('user_id', user.id).order('created_at'),
    ]);
    const tagMap: Record<string, string[]> = {};
    for (const r of btRows ?? []) {
      tagMap[r.book_id] = [...(tagMap[r.book_id] ?? []), r.tag_id];
    }
    setBooks((bData ?? []).map((b) => ({ ...b, tagIds: tagMap[b.id] ?? [] })));
    setTags(tagRows ?? []);
  }, [user]);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: books.length };
    for (const b of books) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [books]);

  const sorted = useMemo(() => {
    let base = filter === 'all' ? books : books.filter((b) => b.status === filter);
    if (tagFilter) base = base.filter((b) => b.tagIds.includes(tagFilter));
    return [...base].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title, 'ja');
      return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime();
    });
  }, [books, filter, sortKey, tagFilter]);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ActivityIndicator color={C.ink} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const initial = (user?.email ?? '?')[0].toUpperCase();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <View>
          <Text style={s.headerLabel}>Library</Text>
          <Text style={s.headerTitle}>本棚</Text>
        </View>
        <TouchableOpacity
          style={s.avatar}
          onPress={() => nav.navigate('Account')}
          activeOpacity={0.7}
        >
          <Text style={s.avatarText}>{initial}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.muted} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Filter tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}
          style={{ paddingTop: 16 }} contentContainerStyle={{ paddingHorizontal: H_PAD, gap: CARD_GAP }}>
          {FILTERS.map((tab) => {
            const active = filter === tab.key;
            return (
              <TouchableOpacity key={tab.key}
                style={[s.filterTab, active && s.filterTabActive]}
                onPress={() => setFilter(tab.key)} activeOpacity={0.7}>
                <Text style={[s.filterTabText, active && s.filterTabTextActive]}>{tab.label}</Text>
                <Text style={[s.filterTabCount, active && s.filterTabCountActive]}>
                  {counts[tab.key] ?? 0}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tag filter */}
        {tags.length > 0 && (
          <View style={{ paddingHorizontal: H_PAD, paddingTop: 12 }}>
            <Text style={s.tagFilterLabel}>タグで絞り込む</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: CARD_GAP, paddingTop: 8 }}>
              {tags.map((tag) => {
                const active = tagFilter === tag.id;
                return (
                  <TouchableOpacity key={tag.id}
                    style={[s.tagPill, active && s.tagPillActive]}
                    onPress={() => setTagFilter(active ? null : tag.id)} activeOpacity={0.7}>
                    <Text style={[s.tagPillText, active && s.tagPillTextActive]}>{tag.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Sort */}
        <View style={s.sortRow}>
          {SORTS.map((opt) => (
            <TouchableOpacity key={opt.key} onPress={() => setSortKey(opt.key)}>
              <Text style={[s.sortOpt, sortKey === opt.key && s.sortOptActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Books */}
        {books.length === 0 ? (
          <View style={s.empty}>
            <Text style={s.emptyTitle}>本棚はまだ空です</Text>
            <Text style={s.emptySub}>下の + ボタンから本を追加してください</Text>
          </View>
        ) : filter === 'all' ? (
          SECTIONS.map(({ status, label }) => {
            const group = sorted.filter((b) => b.status === status);
            if (!group.length) return null;
            return (
              <View key={status} style={s.section}>
                <View style={s.sectionHead}>
                  <Text style={s.sectionLabel}>{label}</Text>
                  <Text style={s.sectionCount}>— {group.length}</Text>
                </View>
                <BooksGrid
                  books={group}
                  cardW={cardW}
                  onPress={(id) => nav.navigate('BookDetail', { bookId: id })}
                />
              </View>
            );
          })
        ) : (
          <View style={[s.section, { paddingTop: 8 }]}>
            <BooksGrid
              books={sorted}
              cardW={cardW}
              onPress={(id) => nav.navigate('BookDetail', { bookId: id })}
            />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function BooksGrid({
  books, cardW, onPress,
}: { books: Book[]; cardW: number; onPress: (id: string) => void }) {
  const rows: Book[][] = [];
  for (let i = 0; i < books.length; i += 3) rows.push(books.slice(i, i + 3));
  return (
    <View>
      {rows.map((row, ri) => (
        <View key={ri} style={[s.row, { gap: CARD_GAP }]}>
          {row.map((b) => (
            <BookCard key={b.id} book={b} cardW={cardW} onPress={() => onPress(b.id)} />
          ))}
          {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => (
            <View key={i} style={{ width: cardW }} />
          ))}
        </View>
      ))}
    </View>
  );
}

function BookCard({
  book, cardW, onPress,
}: { book: Book; cardW: number; onPress: () => void }) {
  const showProgress = book.status === 'reading' || book.status === 'rereading';
  const pct = book.total_pages > 0
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) : 0;
  const coverH = Math.round(cardW * 1.46);
  const bg = bookColor(book.title);
  const fontSize = Math.max(8, Math.round(cardW * 0.11));

  return (
    <TouchableOpacity
      style={{ width: cardW, marginBottom: CARD_GAP }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[s.cover, { width: cardW, height: coverH }]}>
        {book.cover_url
          ? <Image source={{ uri: book.cover_url }} style={s.coverImg} resizeMode="cover" />
          : (
            <View style={[s.coverFallback, { backgroundColor: bg }]}>
              <View style={s.coverLine} />
              <Text style={[s.coverTitle, { fontSize }]} numberOfLines={3}>
                {book.title.slice(0, 12)}
              </Text>
            </View>
          )}
      </View>
      {showProgress && book.total_pages > 0 && (
        <View style={{ marginTop: 6 }}>
          <View style={s.progBg}>
            <View style={[s.progFill, { width: `${pct}%` as any }]} />
          </View>
          <View style={s.progLabels}>
            <Text style={s.progPct}>{pct}<Text style={s.progPctUnit}>%</Text></Text>
            <Text style={s.progPage}>p.{book.current_page}</Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
    paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 0,
  },
  headerLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5,
    color: C.muted, textTransform: 'uppercase', marginBottom: 4,
  },
  headerTitle: { fontFamily: F.shippori, fontSize: 30, color: C.ink },
  avatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontFamily: F.cormorant, fontSize: 14, color: C.paper, fontWeight: '600' },
  filterTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 99, borderWidth: 1, borderColor: C.line,
  },
  filterTabActive: { backgroundColor: C.ink, borderColor: C.ink },
  filterTabText: { fontFamily: F.zen, fontSize: 12, color: C.muted },
  filterTabTextActive: { color: C.paper },
  filterTabCount: { fontFamily: F.cormorant, fontSize: 12, color: C.muted2 },
  filterTabCountActive: { color: 'rgba(247,245,239,0.6)' },
  tagFilterLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5,
    color: C.muted, textTransform: 'uppercase',
  },
  tagPill: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1, borderColor: C.line,
  },
  tagPillActive: { backgroundColor: C.ink, borderColor: C.ink },
  tagPillText: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  tagPillTextActive: { color: C.paper },
  sortRow: {
    flexDirection: 'row', justifyContent: 'flex-end', gap: 16,
    paddingHorizontal: H_PAD, paddingVertical: 12,
  },
  sortOpt: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  sortOptActive: { color: C.ink },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 64, paddingHorizontal: H_PAD },
  emptyTitle: { fontFamily: F.shippori, fontSize: 22, color: C.ink2, marginBottom: 8 },
  emptySub: { fontFamily: F.zen, fontSize: 13, color: C.muted, textAlign: 'center' },
  section: { paddingHorizontal: H_PAD, marginBottom: 24 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  sectionLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase' },
  sectionCount: { fontFamily: F.cormorant, fontSize: 13, color: C.muted2 },
  row: { flexDirection: 'row', marginBottom: 0 },
  cover: {
    borderRadius: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 1, height: 2 },
    shadowOpacity: 0.18, shadowRadius: 4, elevation: 4,
  },
  coverImg: { width: '100%', height: '100%' },
  coverFallback: { flex: 1, padding: 6, justifyContent: 'space-between' },
  coverLine: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)' },
  coverTitle: { fontFamily: F.shippori, color: 'rgba(255,255,255,0.6)', lineHeight: 14 },
  progBg: { height: 2, backgroundColor: C.line2, borderRadius: 1, marginBottom: 4 },
  progFill: { height: 2, backgroundColor: C.ink, borderRadius: 1 },
  progLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  progPct: { fontFamily: F.cormorant, fontSize: 14, color: C.ink2 },
  progPctUnit: { fontFamily: F.zen, fontSize: 9, color: C.muted2 },
  progPage: { fontFamily: F.cormorant, fontSize: 12, color: C.muted },
});
