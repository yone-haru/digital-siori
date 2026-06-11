import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Image, RefreshControl, ActivityIndicator, useWindowDimensions, Alert, Animated, BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../lib/toast';
import { C, F } from '../lib/colors';
import { bookColor } from '../lib/utils';
import { pendingDelete } from '../lib/pendingDelete';
import { getActiveSession, clearActiveSession, type ActiveSession } from '../lib/activeSession';
import { BottomSheet } from '../components/BottomSheet';
import { BookCover } from '../components/BookCover';
import type { BookStatus } from '../types';
import type { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;

type Book = {
  id: string; title: string; author: string; cover_url: string | null;
  current_page: number; total_pages: number; status: BookStatus;
  created_at: string; updated_at: string; tagIds: string[];
  rating: number | null;
};
type Tag = { id: string; name: string };
type FilterTab = 'all' | BookStatus;
type SortKey = 'updated_at' | 'created_at' | 'title' | 'rating';

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
  { key: 'rating', label: '評価順' },
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
  const insets = useSafeAreaInsets();
  const cardW = Math.floor((screenWidth - H_PAD * 2 - CARD_GAP * 2) / 3);

  const [books, setBooks] = useState<Book[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [sortKey, setSortKey] = useState<SortKey>('updated_at');
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [deletedBook, setDeletedBook] = useState<{ bookId: string; bookTitle: string } | null>(null);
  const [recoverSession, setRecoverSession] = useState<ActiveSession | null>(null);
  const { showToast } = useToast();

  // 選択モード
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [tagSheetOpen, setTagSheetOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [bRes, btRes, tagRes] = await Promise.all([
      supabase.from('books')
        .select('id,title,author,cover_url,current_page,total_pages,status,created_at,updated_at,rating')
        .order('updated_at', { ascending: false }),
      supabase.from('book_tags').select('book_id,tag_id'),
      supabase.from('tags').select('id,name').eq('user_id', user.id).order('created_at'),
    ]);
    if (bRes.error || btRes.error || tagRes.error) {
      // 失敗時は前回のデータを保持し、空状態と区別する
      setLoadError(true);
      return;
    }
    setLoadError(false);
    const tagMap: Record<string, string[]> = {};
    for (const r of btRes.data ?? []) {
      tagMap[r.book_id] = [...(tagMap[r.book_id] ?? []), r.tag_id];
    }
    setBooks((bRes.data ?? []).map((b) => ({ ...b, tagIds: tagMap[b.id] ?? [] })));
    setTags(tagRes.data ?? []);
  }, [user]);

  useFocusEffect(useCallback(() => {
    const pending = pendingDelete.get();
    setDeletedBook(pending);
    // 強制終了などで残った読書セッションがあれば復元を提案する
    getActiveSession().then(setRecoverSession);
    fetchData().finally(() => setLoading(false));
  }, [fetchData]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const visibleBooks = useMemo(
    () => deletedBook ? books.filter((b) => b.id !== deletedBook.bookId) : books,
    [books, deletedBook],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: visibleBooks.length };
    for (const b of visibleBooks) c[b.status] = (c[b.status] ?? 0) + 1;
    return c;
  }, [visibleBooks]);

  // 直近に読んでいた本（fetch が updated_at 降順なので先頭一致でよい）
  const continueBook = useMemo(
    () => visibleBooks.find((b) => b.status === 'reading' || b.status === 'rereading') ?? null,
    [visibleBooks],
  );

  const sorted = useMemo(() => {
    let base = filter === 'all' ? visibleBooks : visibleBooks.filter((b) => b.status === filter);
    if (tagFilter) base = base.filter((b) => b.tagIds.includes(tagFilter));
    return [...base].sort((a, b) => {
      if (sortKey === 'title') return a.title.localeCompare(b.title, 'ja');
      if (sortKey === 'rating') {
        const ra = a.rating ?? 0;
        const rb = b.rating ?? 0;
        return rb !== ra ? rb - ra : new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
      return new Date(b[sortKey]).getTime() - new Date(a[sortKey]).getTime();
    });
  }, [visibleBooks, filter, sortKey, tagFilter]);

  // 選択モード中は戻るジェスチャー/ボタンでキャンセル
  useEffect(() => {
    if (!selectionMode) return;
    const handler = BackHandler.addEventListener('hardwareBackPress', () => {
      exitSelectionMode();
      return true;
    });
    return () => handler.remove();
  }, [selectionMode]);

  function enterSelectionMode(id: string) {
    setSelectionMode(true);
    setSelectedIds(new Set([id]));
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function exitSelectionMode() {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }

  async function handleBulkDelete() {
    Alert.alert(
      `${selectedIds.size}冊を削除`,
      'この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除', style: 'destructive',
          onPress: async () => {
            const ids = Array.from(selectedIds);
            const { error } = await supabase.from('books').delete().in('id', ids);
            if (error) {
              showToast('削除に失敗しました。通信環境を確認してください', 'error');
              return;
            }
            setBooks((prev) => prev.filter((b) => !selectedIds.has(b.id)));
            exitSelectionMode();
          },
        },
      ],
    );
  }

  async function handleBulkTag(tagId: string) {
    const ids = Array.from(selectedIds);
    const rows = ids.map((bookId) => ({ book_id: bookId, tag_id: tagId, user_id: user!.id }));
    const { error } = await supabase.from('book_tags').upsert(rows, { onConflict: 'book_id,tag_id' });
    if (error) {
      showToast('タグ付けに失敗しました', 'error');
      return;
    }
    setBooks((prev) => prev.map((b) =>
      selectedIds.has(b.id) && !b.tagIds.includes(tagId)
        ? { ...b, tagIds: [...b.tagIds, tagId] }
        : b,
    ));
    setTagSheetOpen(false);
    exitSelectionMode();
    showToast(`${ids.length}冊にタグを追加しました`);
  }

  const handleCardPress = useCallback((id: string) => {
    if (selectionMode) toggleSelection(id);
    else nav.navigate('BookDetail', { bookId: id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode, nav]);

  const handleCardLongPress = useCallback((id: string) => {
    if (!selectionMode) enterSelectionMode(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectionMode]);

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ActivityIndicator color={C.ink} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const initial = (user?.email ?? '?')[0].toUpperCase();
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

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
          {avatarUrl
            ? <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
            : <Text style={s.avatarText}>{initial}</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.muted} />}
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
      >
        {/* 続きから再開（最重要動作を1タップに） */}
        {continueBook && !selectionMode && (
          <TouchableOpacity
            style={s.continueCard}
            activeOpacity={0.85}
            onPress={() => nav.navigate('ReadingTimer', {
              bookId: continueBook.id,
              bookTitle: continueBook.title,
              bookAuthor: continueBook.author,
              startPage: continueBook.current_page,
              totalPages: continueBook.total_pages,
            })}
          >
            <BookCover title={continueBook.title} coverUrl={continueBook.cover_url} width={40} height={58} />
            <View style={{ flex: 1 }}>
              <Text style={s.continueLabel}>Continue Reading</Text>
              <Text style={s.continueTitle} numberOfLines={1}>{continueBook.title}</Text>
              <Text style={s.continuePage}>p.{continueBook.current_page} から再開</Text>
            </View>
            <View style={s.continuePlay}>
              <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <Path d="M3 2l7 4-7 4V2z" fill={C.paper} />
              </Svg>
            </View>
          </TouchableOpacity>
        )}

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
            <TouchableOpacity key={opt.key} onPress={() => setSortKey(opt.key)} hitSlop={10}>
              <Text style={[s.sortOpt, sortKey === opt.key && s.sortOptActive]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Books */}
        {visibleBooks.length === 0 ? (
          loadError ? (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>読み込みに失敗しました</Text>
              <Text style={s.emptySub}>通信環境を確認して、下に引っ張って再読み込みしてください</Text>
            </View>
          ) : (
            <View style={s.empty}>
              <Text style={s.emptyTitle}>本棚はまだ空です</Text>
              <Text style={s.emptySub}>下の + ボタンから本を追加してください</Text>
            </View>
          )
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
                  selectionMode={selectionMode}
                  selectedIds={selectedIds}
                  onPress={handleCardPress}
                  onLongPress={handleCardLongPress}
                />
              </View>
            );
          })
        ) : (
          <View style={[s.section, { paddingTop: 8 }]}>
            <BooksGrid
              books={sorted}
              cardW={cardW}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onPress={handleCardPress}
              onLongPress={handleCardLongPress}
            />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* 選択モード アクションバー */}
      {selectionMode && (
        <View style={s.actionBar}>
          <TouchableOpacity onPress={exitSelectionMode} hitSlop={8} style={s.actionBarCancel}>
            <Text style={s.actionBarCancelText}>キャンセル</Text>
          </TouchableOpacity>
          <Text style={s.actionBarCount}>{selectedIds.size}冊選択中</Text>
          <View style={s.actionBarButtons}>
            <TouchableOpacity
              style={[s.actionBarBtn, !selectedIds.size && { opacity: 0.4 }]}
              onPress={() => selectedIds.size && setTagSheetOpen(true)}
              activeOpacity={0.7}
            >
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path d="M2 2h5.5l6.5 6.5-5.5 5.5L2 7.5V2z" stroke={C.paper} strokeWidth="1.3" strokeLinejoin="round" />
                <Circle cx="5" cy="5" r="1" fill={C.paper} />
              </Svg>
              <Text style={s.actionBarBtnText}>タグ付け</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.actionBarBtn, s.actionBarBtnDanger, !selectedIds.size && { opacity: 0.4 }]}
              onPress={() => selectedIds.size && handleBulkDelete()}
              activeOpacity={0.7}
            >
              <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <Path d="M3 4.5h10M6 4.5V3A1 1 0 0 1 7 2h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.5A1 1 0 0 0 6 14h4a1 1 0 0 0 1-1l.6-8.5" stroke="#fff" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </Svg>
              <Text style={s.actionBarBtnText}>削除</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* タグ選択シート */}
      <BottomSheet visible={tagSheetOpen} onClose={() => setTagSheetOpen(false)} sheetStyle={ts.sheet}>
        <Text style={ts.heading}>タグを選択</Text>
        <Text style={ts.sub}>{selectedIds.size}冊にまとめて追加します</Text>
        {tags.length === 0 ? (
          <Text style={ts.empty}>タグがまだありません</Text>
        ) : (
          <View style={ts.tagList}>
            {tags.map((tag) => (
              <TouchableOpacity key={tag.id} style={ts.tagRow} onPress={() => handleBulkTag(tag.id)} activeOpacity={0.7}>
                <Text style={ts.tagName}>{tag.name}</Text>
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Path d="M6 4l4 4-4 4" stroke={C.muted2} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </Svg>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </BottomSheet>

      {deletedBook && (
        <UndoToast
          title={deletedBook.bookTitle}
          bottom={49 + insets.bottom + 12}
          onTimeout={async () => {
            const { error } = await supabase.from('books').delete().eq('id', deletedBook.bookId);
            pendingDelete.clear();
            setDeletedBook(null);
            if (error) {
              // 削除失敗時は本がリストに戻るので、その旨を伝える
              showToast('削除に失敗したため、本を元に戻しました', 'error');
            }
          }}
          onUndo={() => {
            pendingDelete.clear();
            setDeletedBook(null);
            nav.navigate('BookDetail', { bookId: deletedBook.bookId });
          }}
        />
      )}

      {/* 読書セッション復元シート（アプリ強制終了時の保険） */}
      <BottomSheet
        visible={!!recoverSession}
        onClose={() => setRecoverSession(null)}
        sheetStyle={ts.sheet}
      >
        {recoverSession && (
          <>
            <Text style={ts.heading}>前回の読書が記録されていません</Text>
            <Text style={ts.sub}>
              「{recoverSession.bookTitle}」の読書セッションが途中で終了しています。続きから再開しますか？
            </Text>
            <TouchableOpacity
              style={rs.resumeBtn}
              activeOpacity={0.8}
              onPress={() => {
                const session = recoverSession;
                setRecoverSession(null);
                nav.navigate('ReadingTimer', {
                  bookId: session.bookId,
                  bookTitle: session.bookTitle,
                  bookAuthor: session.bookAuthor,
                  startPage: session.startPage,
                  totalPages: session.totalPages,
                  resumeStartedAt: session.startedAt,
                });
              }}
            >
              <Text style={rs.resumeBtnText}>続きから再開する</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={rs.discardBtn}
              activeOpacity={0.7}
              onPress={() => {
                clearActiveSession();
                setRecoverSession(null);
              }}
            >
              <Text style={rs.discardBtnText}>破棄する</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

function UndoToast({
  title, bottom, onTimeout, onUndo,
}: { title: string; bottom: number; onTimeout: () => void; onUndo: () => void }) {
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const id = setTimeout(() => onTimeoutRef.current(), 5000);
    return () => clearTimeout(id);
  }, []);

  return (
    <View style={[s.undoToast, { bottom }]}>
      <Text style={s.undoToastText} numberOfLines={1}>「{title}」を削除しました</Text>
      <TouchableOpacity onPress={onUndo} hitSlop={8}>
        <Text style={s.undoBtn}>元に戻す</Text>
      </TouchableOpacity>
    </View>
  );
}

function BooksGrid({
  books, cardW, onPress, onLongPress, selectionMode, selectedIds,
}: {
  books: Book[]; cardW: number;
  onPress: (id: string) => void; onLongPress: (id: string) => void;
  selectionMode: boolean; selectedIds: Set<string>;
}) {
  const rows: Book[][] = [];
  for (let i = 0; i < books.length; i += 3) rows.push(books.slice(i, i + 3));
  return (
    <View>
      {rows.map((row, ri) => (
        <View key={ri} style={[s.row, { gap: CARD_GAP }]}>
          {row.map((b) => (
            <BookCard
              key={b.id} book={b} cardW={cardW}
              onPress={onPress}
              onLongPress={onLongPress}
              selectionMode={selectionMode}
              selected={selectedIds.has(b.id)}
            />
          ))}
          {row.length < 3 && Array(3 - row.length).fill(null).map((_, i) => (
            <View key={i} style={{ width: cardW }} />
          ))}
        </View>
      ))}
    </View>
  );
}

// 選択モードのトグルで全カードが再レンダーされないよう memo 化している
const BookCard = React.memo(function BookCard({
  book, cardW, onPress, onLongPress, selectionMode, selected,
}: {
  book: Book; cardW: number;
  onPress: (id: string) => void; onLongPress: (id: string) => void;
  selectionMode: boolean; selected: boolean;
}) {
  const showProgress = book.status === 'reading' || book.status === 'rereading';
  const pct = book.total_pages > 0
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) : 0;
  const coverH = Math.round(cardW * 1.46);
  const bg = bookColor(book.title);
  const fontSize = Math.max(8, Math.round(cardW * 0.11));

  // アニメーション
  const itemScale    = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const circleOpacity  = useRef(new Animated.Value(0)).current;
  const checkScale   = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(itemScale, {
        toValue: selected ? 0.93 : 1,
        damping: 18, stiffness: 260, useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: selected ? 0.3 : 0,
        duration: 180, useNativeDriver: true,
      }),
    ]).start();
  }, [selected]);

  useEffect(() => {
    Animated.timing(circleOpacity, {
      toValue: selectionMode ? 1 : 0,
      duration: 180, useNativeDriver: true,
    }).start();
  }, [selectionMode]);

  useEffect(() => {
    Animated.spring(checkScale, {
      toValue: selected ? 1 : 0,
      damping: 14, stiffness: 300, useNativeDriver: true,
    }).start();
  }, [selected]);

  return (
    <TouchableOpacity
      style={{ width: cardW, marginBottom: CARD_GAP }}
      onPress={() => onPress(book.id)}
      onLongPress={() => onLongPress(book.id)}
      activeOpacity={selectionMode ? 1 : 0.7}
      delayLongPress={380}
    >
      <Animated.View style={[
        s.cover, { width: cardW, height: coverH },
        { transform: [{ scale: itemScale }] },
        selected && s.coverSelected,
      ]}>
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

        {/* 選択時の暗オーバーレイ */}
        <Animated.View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, s.selOverlay, { opacity: overlayOpacity }]}
        />

        {/* チェックサークル（右上） */}
        <Animated.View
          pointerEvents="none"
          style={[s.circleWrap, { opacity: circleOpacity }]}
        >
          {/* 空サークル（選択モード中常時表示） */}
          <View style={s.circleEmpty} />
          {/* 塗りサークル＋チェック（選択時） */}
          <Animated.View style={[
            StyleSheet.absoluteFill, s.circleFilled,
            { transform: [{ scale: checkScale }] },
          ]}>
            <Svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <Path d="M2 5.5l2.8 2.8L9 3" stroke={C.paper} strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </Animated.View>
        </Animated.View>
      </Animated.View>

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
});

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
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  avatarImg: { width: 32, height: 32, borderRadius: 16 },
  avatarText: { fontFamily: F.cormorant, fontSize: 14, color: C.paper, fontWeight: '600' },
  continueCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    marginHorizontal: H_PAD, marginTop: 16,
    padding: 14, backgroundColor: C.line2, borderRadius: 2,
  },
  continueLabel: {
    fontFamily: F.zen, fontSize: 9, letterSpacing: 2, color: C.muted,
    textTransform: 'uppercase', marginBottom: 4,
  },
  continueTitle: { fontFamily: F.shippori, fontSize: 15, color: C.ink, marginBottom: 2 },
  continuePage: { fontFamily: F.zen, fontSize: 11, color: C.muted },
  continuePlay: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
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
  // 選択関連
  coverSelected: {
    shadowOpacity: 0.32, shadowRadius: 8, elevation: 8,
  },
  selOverlay: {
    backgroundColor: C.ink, borderRadius: 1,
  },
  circleWrap: {
    position: 'absolute', top: 6, right: 6,
    width: 22, height: 22,
  },
  circleEmpty: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 1.8, borderColor: 'rgba(255,255,255,0.85)',
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  circleFilled: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  // アクションバー
  actionBar: {
    backgroundColor: C.ink,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 12, gap: 8,
  },
  actionBarCancel: { paddingHorizontal: 4 },
  actionBarCancelText: { fontFamily: F.zen, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 },
  actionBarCount: { fontFamily: F.zen, fontSize: 11, color: 'rgba(255,255,255,0.7)', flex: 1, textAlign: 'center' },
  actionBarButtons: { flexDirection: 'row', gap: 8 },
  actionBarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 2, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  actionBarBtnDanger: { borderColor: 'rgba(199,123,111,0.5)' },
  actionBarBtnText: { fontFamily: F.zen, fontSize: 11, color: C.paper, letterSpacing: 0.5 },
  undoToast: {
    position: 'absolute', left: 20, right: 20,
    backgroundColor: C.ink, borderRadius: 2,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 14, paddingHorizontal: 18, paddingVertical: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25, shadowRadius: 32, elevation: 12,
  },
  undoToastText: { fontFamily: F.shippori, fontSize: 13, color: C.paper, flex: 1 },
  undoBtn: {
    fontFamily: F.zen, fontSize: 11, letterSpacing: 1.8, color: C.paper,
    borderBottomWidth: 1, borderBottomColor: C.paper, paddingBottom: 1,
  },
});

const ts = StyleSheet.create({
  sheet: {
    backgroundColor: C.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 28, paddingBottom: 48,
  },
  heading: { fontFamily: F.shippori, fontSize: 20, color: C.ink, marginBottom: 6 },
  sub: { fontFamily: F.zen, fontSize: 11, color: C.muted, marginBottom: 20 },
  empty: { fontFamily: F.zen, fontSize: 13, color: C.muted2, textAlign: 'center', paddingVertical: 20 },
  tagList: { gap: 0 },
  tagRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  tagName: { fontFamily: F.zen, fontSize: 14, color: C.ink },
});

const rs = StyleSheet.create({
  resumeBtn: {
    height: 50, backgroundColor: C.ink, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  resumeBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.paper },
  discardBtn: {
    height: 50, borderWidth: 1, borderColor: C.line, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  discardBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.muted },
});
