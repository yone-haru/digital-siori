import React, { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator,
} from 'react-native';
import { DialInput } from '../components/DialInput';
import { CalendarPicker } from '../components/CalendarPicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { useToast } from '../lib/toast';
import { C, F } from '../lib/colors';
import { formatDuration, formatSessionDate } from '../lib/utils';
import { todayStr } from '../lib/date';
import { FREE_LIMITS } from '../lib/limits';
import { startReading, finishBook, updateBook, recordSession } from '../data/books';
import { pendingDelete } from '../lib/pendingDelete';
import { BottomSheet } from '../components/BottomSheet';
import { BookCover } from '../components/BookCover';
import type { Book, ReadingSession, Tag, BookStatus, BookMemo } from '../types';
import type { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BookDetail'>;
  route: RouteProp<RootStackParamList, 'BookDetail'>;
};

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: '読書中', rereading: '再読中', to_read: '未読', finished: '読書完了',
};

export default function BookDetailScreen({ navigation, route }: Props) {
  const { bookId } = route.params;
  const { user } = useAuth();
  const { isPro, openPaywall } = useSubscription();
  const { showToast } = useToast();
  const [book, setBook] = useState<Book | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [bookTagIds, setBookTagIds] = useState<string[]>([]);
  const [memos, setMemos] = useState<BookMemo[]>([]);
  const [memoAddOpen, setMemoAddOpen] = useState(false);
  const [memoAddPage, setMemoAddPage] = useState(0);
  const [memoAddText, setMemoAddText] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [deletingMemo, setDeletingMemo] = useState<BookMemo | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [finishSheetOpen, setFinishSheetOpen] = useState(false);
  const [finishPending, setFinishPending] = useState(false);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [manualSessionOpen, setManualSessionOpen] = useState(false);
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const [prevReadCount, setPrevReadCount] = useState(0);
  const [initStartPage, setInitStartPage] = useState(0);
  const [initPending, setInitPending] = useState(false);
  const [review, setReview] = useState('');
  const [editingReview, setEditingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [savingReview, setSavingReview] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const sessionQuery = supabase.from('reading_sessions').select('*').eq('book_id', bookId).order('started_at', { ascending: false });
    const [{ data: b }, { data: s }, { data: btRows }, { data: tagRows }] = await Promise.all([
      supabase.from('books').select('*').eq('id', bookId).single(),
      isPro ? sessionQuery : sessionQuery.limit(FREE_LIMITS.sessionsPerBook),
      supabase.from('book_tags').select('tag_id').eq('book_id', bookId),
      supabase.from('tags').select('id,name').eq('user_id', user.id).order('created_at'),
    ]);
    if (b) {
      setBook(b as Book);
      setReview(b.review ?? '');
      setRating(b.rating ?? 0);
    } else {
      // 取得失敗時に永久ローディングにしない
      showToast('本の情報の取得に失敗しました', 'error');
      navigation.goBack();
      return;
    }
    const sessionList = (s as ReadingSession[]) ?? [];
    setSessions(sessionList);
    setBookTagIds((btRows ?? []).map((r: { tag_id: string }) => r.tag_id));
    setAllTags((tagRows as Tag[]) ?? []);

    const { data: memoRows } = await supabase
      .from('book_memos')
      .select('id,page_number,content,created_at')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true });
    setMemos((memoRows as BookMemo[]) ?? []);
  }, [bookId, user, isPro, navigation, showToast]);

  useFocusEffect(useCallback(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]));

  async function saveReview() {
    setSavingReview(true);
    const r = await updateBook(bookId, { review: review || null });
    setSavingReview(false);
    if (!r.ok) {
      showToast(r.message, 'error');
      return; // 編集状態を維持して入力を失わせない
    }
    setBook((prev) => prev ? { ...prev, review: review || null } as Book : prev);
    setEditingReview(false);
  }

  function cancelReview() {
    setReview(book?.review ?? '');
    setEditingReview(false);
  }

  async function changeRating(newRating: number) {
    const prevRating = rating;
    const val = newRating === rating ? 0 : newRating;
    setRating(val);
    const r = await updateBook(bookId, { rating: val === 0 ? null : val });
    if (!r.ok) {
      setRating(prevRating);
      showToast(r.message, 'error');
    }
  }

  async function handleFinish() {
    if (!book) return;
    setFinishPending(true);
    const r = await finishBook(book);
    setFinishPending(false);
    if (!r.ok) {
      showToast(r.message, 'error');
      return;
    }
    setBook((prev) => prev ? { ...prev, ...r.data } as Book : prev);
    setFinishSheetOpen(false);
  }

  function handleDeleteConfirm() {
    setDeleteSheetOpen(false);
    pendingDelete.set({ bookId, bookTitle: book!.title });
    navigation.goBack();
  }

  async function toggleTag(tagId: string) {
    const prevIds = bookTagIds;
    if (bookTagIds.includes(tagId)) {
      setBookTagIds((prev) => prev.filter((id) => id !== tagId));
      const { error } = await supabase.from('book_tags').delete().eq('book_id', bookId).eq('tag_id', tagId);
      if (error) {
        setBookTagIds(prevIds);
        showToast('タグの解除に失敗しました', 'error');
      }
    } else {
      setBookTagIds((prev) => [...prev, tagId]);
      const { error } = await supabase.from('book_tags').insert({ book_id: bookId, tag_id: tagId, user_id: user?.id });
      if (error) {
        setBookTagIds(prevIds);
        showToast('タグの追加に失敗しました', 'error');
      }
    }
  }

  async function createTag() {
    if (!newTagName.trim() || !user) return;
    if (!isPro && allTags.length >= FREE_LIMITS.tags) { openPaywall(); return; }
    setCreatingTag(true);
    const { data, error } = await supabase
      .from('tags')
      .insert({ name: newTagName.trim(), user_id: user.id })
      .select('id,name')
      .single();
    if (error || !data) {
      setCreatingTag(false);
      showToast('タグの作成に失敗しました', 'error');
      return;
    }
    setAllTags((prev) => [...prev, data as Tag]);
    setBookTagIds((prev) => [...prev, data.id]);
    const { error: linkErr } = await supabase
      .from('book_tags')
      .insert({ book_id: bookId, tag_id: data.id, user_id: user.id });
    if (linkErr) {
      setBookTagIds((prev) => prev.filter((id) => id !== data.id));
      showToast('タグは作成しましたが、本への紐付けに失敗しました', 'error');
    }
    setNewTagName('');
    setCreatingTag(false);
  }

  async function addMemo() {
    if (!memoAddText.trim() || !user) return;
    setSavingMemo(true);
    if (editingMemoId) {
      const { error } = await supabase.from('book_memos')
        .update({ page_number: memoAddPage, content: memoAddText.trim() })
        .eq('id', editingMemoId);
      if (error) {
        setSavingMemo(false);
        showToast('メモの更新に失敗しました', 'error');
        return; // シートを開いたままにして入力を失わせない
      }
      setMemos((prev) => prev.map((m) =>
        m.id === editingMemoId ? { ...m, page_number: memoAddPage, content: memoAddText.trim() } : m
      ));
      setEditingMemoId(null);
    } else {
      const { data, error } = await supabase
        .from('book_memos')
        .insert({ book_id: bookId, user_id: user.id, page_number: memoAddPage, content: memoAddText.trim() })
        .select('id,page_number,content,created_at')
        .single();
      if (error || !data) {
        setSavingMemo(false);
        showToast('メモの保存に失敗しました', 'error');
        return;
      }
      setMemos((prev) => [...prev, data as BookMemo]);
    }
    setMemoAddText('');
    setSavingMemo(false);
    setMemoAddOpen(false);
  }

  function openEditMemo(memo: BookMemo) {
    setEditingMemoId(memo.id);
    setMemoAddPage(memo.page_number);
    setMemoAddText(memo.content);
    setMemoAddOpen(true);
  }

  async function confirmDeleteMemo() {
    if (!deletingMemo) return;
    const target = deletingMemo;
    setMemos((prev) => prev.filter((m) => m.id !== target.id));
    setDeletingMemo(null);
    const { error } = await supabase.from('book_memos').delete().eq('id', target.id);
    if (error) {
      setMemos((prev) => [...prev, target].sort(
        (a, b) => a.created_at.localeCompare(b.created_at),
      ));
      showToast('メモの削除に失敗しました', 'error');
    }
  }

  async function handleStartReading() {
    if (!book) return;
    if (isFirstEver) {
      setPrevReadCount(0);
      setInitStartPage(0);
      setStartSheetOpen(true);
      return;
    }

    const r = await startReading(book);
    if (!r.ok) {
      showToast(r.message, 'error');
      return;
    }

    navigation.navigate('ReadingTimer', {
      bookId: book.id, bookTitle: book.title, bookAuthor: book.author,
      startPage: r.data.startPage, totalPages: book.total_pages,
    });
  }

  async function goFirstTime() {
    if (!book) return;
    const r = await updateBook(bookId, {
      status: 'reading',
      started_at: new Date().toISOString(),
    });
    if (!r.ok) {
      showToast(r.message, 'error');
      return;
    }
    setStartSheetOpen(false);
    navigation.navigate('ReadingTimer', {
      bookId: book.id, bookTitle: book.title, bookAuthor: book.author,
      startPage: 0, totalPages: book.total_pages,
    });
  }

  async function goPrevRead() {
    if (!book) return;
    setInitPending(true);
    const r = await updateBook(bookId, {
      read_count: prevReadCount,
      current_page: initStartPage,
      status: 'reading',
      started_at: new Date().toISOString(),
    });
    setInitPending(false);
    if (!r.ok) {
      showToast(r.message, 'error');
      return;
    }
    setStartSheetOpen(false);
    navigation.navigate('ReadingTimer', {
      bookId: book.id, bookTitle: book.title, bookAuthor: book.author,
      startPage: initStartPage, totalPages: book.total_pages,
    });
  }

  if (loading || !book) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <ActivityIndicator color={C.ink} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const pct = book.total_pages > 0
    ? Math.min(100, Math.round((book.current_page / book.total_pages) * 100)) : 0;
  const remaining = Math.max(0, book.total_pages - book.current_page);
  const totalSeconds = sessions.reduce((acc, r) => acc + (r.duration_seconds ?? 0), 0);

  let estimatedStr: string | null = null;
  if (sessions.length > 0 && book.current_page > 0 && remaining > 0) {
    const secPerPage = totalSeconds / book.current_page;
    estimatedStr = formatDuration(Math.round(secPerPage * remaining));
  }

  const totalPagesRead = sessions.reduce(
    (acc, s) => acc + Math.max(0, (s.end_page ?? 0) - (s.start_page ?? 0)), 0
  );
  const avgPace = sessions.length > 0 && totalPagesRead > 0
    ? Math.round(totalPagesRead / sessions.length)
    : null;

  const isFirstEver = sessions.length === 0 && (book.read_count ?? 0) === 0;
  const appliedTags = allTags.filter((t) => bookTagIds.includes(t.id));

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <Path d="M14 4L6 11l8 7" stroke={C.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Detail</Text>
        <TouchableOpacity onPress={() => setDeleteSheetOpen(true)} hitSlop={8}>
          <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <Circle cx="11" cy="5" r="1.4" fill={C.muted} />
            <Circle cx="11" cy="11" r="1.4" fill={C.muted} />
            <Circle cx="11" cy="17" r="1.4" fill={C.muted} />
          </Svg>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Book info */}
        <View style={s.bookInfo}>
          <BookCover title={book.title} coverUrl={book.cover_url} width={80} height={116} />
          <View style={s.bookMeta}>
            <View>
              <Text style={s.author} numberOfLines={1}>{book.author}</Text>
              <Text style={s.title}>{book.title}</Text>
              {book.total_pages > 0 && <Text style={s.pages}>{book.total_pages}p</Text>}
            </View>
            <View style={s.statusRow}>
              <View style={s.statusBadge}>
                <Text style={s.statusBadgeText}>{STATUS_LABELS[book.status]}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Tags */}
        <View style={s.tagsRow}>
          {appliedTags.map((tag) => (
            <View key={tag.id} style={s.tagPill}>
              <Text style={s.tagPillText}>{tag.name}</Text>
            </View>
          ))}
          <TouchableOpacity style={s.tagAddBtn} onPress={() => setTagSheetOpen(true)} activeOpacity={0.7}>
            <Svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <Path d="M5.5 1v9M1 5.5h9" stroke={C.muted} strokeWidth="1.3" strokeLinecap="round" />
            </Svg>
            <Text style={s.tagAddBtnText}>タグ</Text>
          </TouchableOpacity>
        </View>

        {/* Start reading */}
        <TouchableOpacity style={s.startBtn} activeOpacity={0.85} onPress={handleStartReading}>
          <Text style={s.startBtnText}>読書をはじめる</Text>
          <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <Path d="M2 2l8 4-8 4V2z" fill={C.paper} />
          </Svg>
        </TouchableOpacity>

        {book.status !== 'finished' && (
          <TouchableOpacity style={s.finishBtn} activeOpacity={0.7} onPress={() => setFinishSheetOpen(true)}>
            <Text style={s.finishBtnText}>読了にする</Text>
          </TouchableOpacity>
        )}

        {/* Description */}
        {book.description ? (
          <TouchableOpacity onPress={() => setDescExpanded((v) => !v)} activeOpacity={0.8}>
            <Text style={s.description} numberOfLines={descExpanded ? undefined : 4}>
              {book.description}
            </Text>
            <Text style={s.descToggle}>{descExpanded ? '閉じる' : 'もっと見る'}</Text>
          </TouchableOpacity>
        ) : null}

        {/* Progress */}
        <View style={s.progressCard}>
          <View style={s.progressTop}>
            <View>
              <Text style={s.progressLabel}>Progress</Text>
              <View style={s.progressHero}>
                <Text style={s.progressPct}>{pct}</Text>
                <Text style={s.progressPctUnit}>%</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.progressLabel}>Remaining</Text>
              <Text style={s.remainingText}>あと {remaining} ページ</Text>
              {estimatedStr && <Text style={s.estimatedText}>完読まで約 {estimatedStr}</Text>}
            </View>
          </View>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${pct}%` as any }]} />
          </View>
          <View style={s.progressFooter}>
            <Text style={s.progressPageLabel}>p.1</Text>
            <Text style={s.progressCurrent}>現在 p.{book.current_page}</Text>
            <Text style={s.progressPageLabel}>p.{book.total_pages}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          {[
            { label: 'Total Time', value: formatDuration(totalSeconds), unit: '' },
            { label: 'Sessions', value: String(sessions.length), unit: '回' },
            { label: 'Avg Pace', value: avgPace ? String(avgPace) + 'p' : '—', unit: avgPace ? '/ 回' : '' },
            { label: 'Times Read', value: String(book.read_count ?? 0), unit: '回' },
          ].map((item) => (
            <View key={item.label} style={s.statCard}>
              <Text style={s.statLabel}>{item.label}</Text>
              <Text style={s.statValue}>{item.value}<Text style={s.statUnit}>{item.unit}</Text></Text>
            </View>
          ))}
        </View>

        {/* Rating */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Rating</Text>
          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const full = rating >= n;
              const half = !full && rating >= n - 0.5;
              return (
                <View key={n} style={{ width: 36, height: 36, position: 'relative' }}>
                  <Text style={s.starEmpty}>★</Text>
                  {(full || half) && (
                    <View style={{ position: 'absolute', left: 0, top: 0, width: full ? 36 : 18, height: 36, overflow: 'hidden' }}>
                      <Text style={s.starFull}>★</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={{ position: 'absolute', left: 0, top: 0, width: 18, height: 36 }}
                    onPress={() => changeRating(rating === n - 0.5 ? 0 : n - 0.5)}
                  />
                  <TouchableOpacity
                    style={{ position: 'absolute', right: 0, top: 0, width: 18, height: 36 }}
                    onPress={() => changeRating(rating === n ? 0 : n)}
                  />
                </View>
              );
            })}
            {rating > 0 && (
              <Text style={s.ratingNum}>
                {Number.isInteger(rating) ? `${rating}.0` : String(rating)}
              </Text>
            )}
          </View>
        </View>

        {/* Review */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Review</Text>
          {editingReview ? (
            <>
              <TextInput
                style={s.reviewInput}
                value={review}
                onChangeText={setReview}
                multiline
                autoFocus
                placeholder="感想を書く..."
                placeholderTextColor={C.muted2}
              />
              <View style={s.reviewActions}>
                <TouchableOpacity onPress={cancelReview} hitSlop={8}>
                  <Text style={s.reviewCancel}>キャンセル</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.reviewSaveBtn, savingReview && { opacity: 0.5 }]}
                  onPress={saveReview}
                  disabled={savingReview}
                  activeOpacity={0.8}
                >
                  {savingReview
                    ? <ActivityIndicator size="small" color={C.paper} />
                    : <Text style={s.reviewSaveBtnText}>保存</Text>}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <TouchableOpacity style={s.reviewDisplay} onPress={() => setEditingReview(true)} activeOpacity={0.8}>
              <Text style={[s.reviewText, !review.trim() && s.reviewPlaceholder]}>
                {review.trim() || '感想を書く...'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Memos */}
        <View style={s.section}>
          <View style={s.sectionHeadRow}>
            <Text style={s.sectionLabel}>Memos</Text>
            <TouchableOpacity onPress={() => { setMemoAddPage(book.current_page); setMemoAddOpen(true); }} hitSlop={8}>
              <Text style={s.addSessionText}>+ 追加</Text>
            </TouchableOpacity>
          </View>
          {memos.length === 0 ? (
            <Text style={s.noSessions}>メモなし</Text>
          ) : (
            memos.map((memo) => (
              <View key={memo.id} style={s.memoItem}>
                <Text style={s.memoPage}>p.{memo.page_number}</Text>
                <Text style={s.memoContent}>{memo.content}</Text>
                <View style={s.memoActions}>
                  <TouchableOpacity onPress={() => openEditMemo(memo)} hitSlop={8}>
                    <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={C.muted2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke={C.muted2} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setDeletingMemo(memo)} hitSlop={8}>
                    <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <Path d="M2 2l10 10M12 2L2 12" stroke={C.muted2} strokeWidth="1.3" strokeLinecap="round" />
                    </Svg>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Session history */}
        <View style={s.section}>
          <View style={s.sectionHeadRow}>
            <Text style={s.sectionLabel}>Reading History</Text>
            <TouchableOpacity onPress={() => setManualSessionOpen(true)} hitSlop={8}>
              <Text style={s.addSessionText}>+ 手動追加</Text>
            </TouchableOpacity>
          </View>
          {sessions.length === 0 ? (
            <Text style={s.noSessions}>記録なし</Text>
          ) : (
            <>
              {sessions.map((session) => {
                const pagesRead = (session.end_page ?? 0) - (session.start_page ?? 0);
                return (
                  <View key={session.id} style={s.sessionItem}>
                    <View style={s.sessionTop}>
                      <View>
                        <Text style={s.sessionDate}>{formatSessionDate(session.started_at)}</Text>
                        <Text style={s.sessionPages}>
                          p.{session.start_page} → p.{session.end_page}
                          {pagesRead > 0 ? ` · ${pagesRead}ページ` : ''}
                        </Text>
                      </View>
                      <Text style={s.sessionDuration}>{formatDuration(session.duration_seconds)}</Text>
                    </View>
                  </View>
                );
              })}
              {!isPro && sessions.length >= FREE_LIMITS.sessionsPerBook && (
                <TouchableOpacity style={s.proSessionBanner} onPress={openPaywall} activeOpacity={0.8}>
                  <Text style={s.proSessionBannerText}>Proプランで全履歴を表示</Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Start reading sheet (first-time only) */}
      <BottomSheet visible={startSheetOpen} onClose={() => setStartSheetOpen(false)} sheetStyle={s.sheet}>
          <Text style={s.sheetHeading}>この本を読むのは{'\n'}はじめてですか？</Text>
          <Text style={s.sheetSub}>以前読んだことがある場合、記録を追加できます。</Text>
          <TouchableOpacity style={s.saveBtn} onPress={goFirstTime} activeOpacity={0.8}>
            <Text style={s.saveBtnText}>はじめて読む</Text>
          </TouchableOpacity>
          <View style={s.orRow}>
            <View style={s.orLine} />
            <Text style={s.orText}>または</Text>
            <View style={s.orLine} />
          </View>
          <Text style={[s.manualLabel, { marginBottom: 12 }]}>以前も読んだことがある</Text>
          <View style={s.manualRow}>
            <View style={[{ flex: 1 }, s.manualFieldLeft]}>
              <Text style={s.manualLabel}>読了回数</Text>
              <View style={s.manualPageRow}>
                <DialInput
                  value={prevReadCount}
                  onChange={setPrevReadCount}
                  min={0}
                  max={99}
                  color={C.ink}
                  fontSize={22}
                  fontFamily={F.cormorant}
                  slotHeight={36}
                />
                <Text style={s.manualPageUnit}>回</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.manualLabel}>現在のページ</Text>
              <View style={s.manualPageRow}>
                <Text style={s.manualPageUnit}>p.</Text>
                <DialInput
                  value={initStartPage}
                  onChange={setInitStartPage}
                  min={0}
                  max={book.total_pages > 0 ? book.total_pages : 9999}
                  color={C.ink}
                  fontSize={22}
                  fontFamily={F.cormorant}
                  slotHeight={36}
                />
              </View>
            </View>
          </View>
          <TouchableOpacity
            style={[s.cancelBtn, initPending && { opacity: 0.5 }]}
            onPress={goPrevRead}
            disabled={initPending}
            activeOpacity={0.8}
          >
            {initPending
              ? <ActivityIndicator color={C.ink} />
              : <Text style={s.cancelBtnText}>前回の続きから読む</Text>}
          </TouchableOpacity>
      </BottomSheet>

      {/* Finish confirmation sheet */}
      <BottomSheet visible={finishSheetOpen} onClose={() => setFinishSheetOpen(false)} sheetStyle={s.sheet}>
          <View style={s.sheetBookInfo}>
            <Text style={s.sheetAuthor}>{book.author}</Text>
            <Text style={s.sheetTitle}>{book.title}</Text>
          </View>
          <Text style={s.sheetHeading}>読書を完了しますか？</Text>
          <Text style={s.sheetSub}>
            読了回数が <Text style={s.sheetNum}>{(book.read_count ?? 0) + 1}</Text> 回になります。
            {book.total_pages > 0 && book.current_page < book.total_pages
              ? `\n現在 p.${book.current_page} / ${book.total_pages} ですが完了として記録されます。`
              : ''}
          </Text>
          <TouchableOpacity
            style={[s.saveBtn, finishPending && { opacity: 0.5 }]}
            onPress={handleFinish}
            disabled={finishPending}
            activeOpacity={0.8}
          >
            {finishPending
              ? <ActivityIndicator color={C.paper} />
              : <Text style={s.saveBtnText}>完了にする</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setFinishSheetOpen(false)} activeOpacity={0.8}>
            <Text style={s.cancelBtnText}>キャンセル</Text>
          </TouchableOpacity>
      </BottomSheet>

      {/* Delete bottom sheet */}
      <BottomSheet visible={deleteSheetOpen} onClose={() => setDeleteSheetOpen(false)} sheetStyle={s.sheet}>
          <View style={s.sheetBookInfo}>
            <Text style={s.sheetAuthor}>{book.author}</Text>
            <Text style={s.sheetTitle}>{book.title}</Text>
          </View>
          <Text style={s.sheetHeading}>この本を本棚から{'\n'}削除しますか？</Text>
          <Text style={s.sheetSub}>
            読書履歴 <Text style={s.sheetNum}>{sessions.length}</Text> 件、累計時間{' '}
            <Text style={s.sheetNum}>{formatDuration(totalSeconds)}</Text> もすべて消えます。
          </Text>
          <TouchableOpacity style={s.deleteBtn} onPress={handleDeleteConfirm} activeOpacity={0.8}>
            <Text style={s.deleteBtnText}>削除する</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteSheetOpen(false)} activeOpacity={0.8}>
            <Text style={s.cancelBtnText}>キャンセル</Text>
          </TouchableOpacity>
      </BottomSheet>

      {/* Memo add sheet */}
      <BottomSheet visible={memoAddOpen} onClose={() => { setMemoAddOpen(false); setEditingMemoId(null); setMemoAddText(''); }} sheetStyle={s.sheet} disableClose={savingMemo} keyboardAvoid>
            <Text style={s.sheetHeadingSmall}>{editingMemoId ? 'メモを編集' : 'メモを追加'}</Text>
            <View style={s.manualRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.manualLabel}>PAGE</Text>
                <View style={s.manualPageRow}>
                  <Text style={s.manualPageUnit}>p.</Text>
                  <DialInput
                    value={memoAddPage}
                    onChange={setMemoAddPage}
                    min={0}
                    max={book.total_pages > 0 ? book.total_pages : 9999}
                    color={C.ink}
                    fontSize={22}
                    fontFamily={F.cormorant}
                    slotHeight={36}
                  />
                </View>
              </View>
            </View>
            <Text style={[s.manualLabel, { marginBottom: 8 }]}>NOTE</Text>
            <TextInput
              style={[s.newTagInput, { minHeight: 80, textAlignVertical: 'top', marginBottom: 20 }]}
              value={memoAddText}
              onChangeText={setMemoAddText}
              placeholder="メモを入力..."
              placeholderTextColor={C.muted2}
              multiline
              autoFocus
            />
            <TouchableOpacity
              style={[s.saveBtn, (savingMemo || !memoAddText.trim()) && { opacity: 0.4 }]}
              onPress={addMemo}
              disabled={savingMemo || !memoAddText.trim()}
              activeOpacity={0.8}
            >
              {savingMemo
                ? <ActivityIndicator color={C.paper} />
                : <Text style={s.saveBtnText}>{editingMemoId ? '更新' : '保存'}</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => { setMemoAddOpen(false); setEditingMemoId(null); setMemoAddText(''); }} activeOpacity={0.8}>
              <Text style={s.cancelBtnText}>キャンセル</Text>
            </TouchableOpacity>
      </BottomSheet>

      {/* Tag sheet */}
      <BottomSheet visible={tagSheetOpen} onClose={() => setTagSheetOpen(false)} sheetStyle={s.sheet} keyboardAvoid>
          <Text style={s.sheetHeadingSmall}>タグを管理する</Text>
          <ScrollView style={{ maxHeight: 240 }} showsVerticalScrollIndicator={false}>
            {allTags.length === 0 ? (
              <Text style={s.noSessions}>タグがまだありません</Text>
            ) : (
              allTags.map((tag) => {
                const active = bookTagIds.includes(tag.id);
                return (
                  <TouchableOpacity key={tag.id} style={s.tagSheetRow} onPress={() => toggleTag(tag.id)} activeOpacity={0.7}>
                    <Text style={[s.tagSheetName, active && { color: C.ink }]}>{tag.name}</Text>
                    {active && (
                      <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <Path d="M3 8l4 4 6-7" stroke={C.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                      </Svg>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
          <View style={s.newTagRow}>
            <TextInput
              style={s.newTagInput}
              value={newTagName}
              onChangeText={setNewTagName}
              placeholder="新しいタグを作成..."
              placeholderTextColor={C.muted2}
              returnKeyType="done"
              onSubmitEditing={createTag}
            />
            <TouchableOpacity style={s.newTagBtn} onPress={createTag} disabled={creatingTag || !newTagName.trim()} activeOpacity={0.7}>
              {creatingTag
                ? <ActivityIndicator size="small" color={C.paper} />
                : <Text style={s.newTagBtnText}>作成</Text>}
            </TouchableOpacity>
          </View>
      </BottomSheet>

      {/* Memo delete confirmation sheet */}
      <BottomSheet visible={!!deletingMemo} onClose={() => setDeletingMemo(null)} sheetStyle={s.sheet}>
          <Text style={s.sheetHeading}>メモを削除しますか？</Text>
          {deletingMemo && (
            <View style={s.memoDeletePreview}>
              <Text style={s.memoPage}>p.{deletingMemo.page_number}</Text>
              <Text style={s.memoContent} numberOfLines={3}>{deletingMemo.content}</Text>
            </View>
          )}
          <TouchableOpacity style={s.deleteBtn} onPress={confirmDeleteMemo} activeOpacity={0.8}>
            <Text style={s.deleteBtnText}>削除する</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setDeletingMemo(null)} activeOpacity={0.8}>
            <Text style={s.cancelBtnText}>キャンセル</Text>
          </TouchableOpacity>
      </BottomSheet>

      {/* Manual session sheet */}
      {manualSessionOpen && (
        <ManualSessionSheet
          bookId={bookId}
          userId={user?.id ?? ''}
          currentPage={book.current_page}
          totalPages={book.total_pages}
          sessionDates={sessions.map(s => s.started_at.slice(0, 10))}
          onSave={async () => {
            setManualSessionOpen(false);
            await fetchData();
          }}
          onCancel={() => setManualSessionOpen(false)}
        />
      )}
    </SafeAreaView>
  );
}

function ManualSessionSheet({
  bookId, userId, currentPage, totalPages, sessionDates, onSave, onCancel,
}: {
  bookId: string; userId: string; currentPage: number; totalPages: number;
  sessionDates?: string[];
  onSave: () => void; onCancel: () => void;
}) {
  const today = todayStr();
  const [date, setDate] = useState(today);
  const [startPage, setStartPage] = useState(currentPage);
  const [endPage, setEndPage] = useState(currentPage);
  const [durationMin, setDurationMin] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (endPage < startPage) {
      setError('終了ページは開始ページ以上にしてください'); return;
    }
    if (durationMin < 1) { setError('読書時間は1分以上にしてください'); return; }
    setSaving(true);
    setError(null);
    const startedAt = new Date(`${date}T12:00:00`).toISOString();
    const endedAt = new Date(new Date(startedAt).getTime() + durationMin * 60 * 1000).toISOString();

    const result = await recordSession({
      bookId, userId,
      startedAt, endedAt,
      startPage, endPage,
      durationSeconds: durationMin * 60,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    onSave();
  }

  return (
    <BottomSheet visible onClose={onCancel} sheetStyle={s.sheet} disableClose={saving}>
        <Text style={s.sheetHeadingSmall}>読書記録を手動追加</Text>
        {error && <Text style={s.manualError}>{error}</Text>}
        <View style={s.manualRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.manualLabel}>DATE</Text>
            <CalendarPicker
              value={date}
              onChange={setDate}
              max={today}
              markedDates={sessionDates}
              trigger={
                <View style={{ borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 4 }}>
                  <Text style={{ fontFamily: F.cormorant, fontSize: 22, color: C.ink }}>
                    {`${date.slice(0, 4)}年${parseInt(date.slice(5, 7))}月${parseInt(date.slice(8, 10))}日`}
                  </Text>
                </View>
              }
            />
          </View>
        </View>
        <View style={s.manualRow}>
          <View style={[{ flex: 1 }, s.manualFieldLeft]}>
            <Text style={s.manualLabel}>開始ページ</Text>
            <View style={s.manualPageRow}>
              <Text style={s.manualPageUnit}>p.</Text>
              <DialInput
                value={startPage}
                onChange={setStartPage}
                min={0}
                max={totalPages > 0 ? totalPages : 9999}
                color={C.ink}
                fontSize={22}
                fontFamily={F.cormorant}
                slotHeight={36}
              />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.manualLabel}>終了ページ</Text>
            <View style={s.manualPageRow}>
              <Text style={s.manualPageUnit}>p.</Text>
              <DialInput
                value={endPage}
                onChange={setEndPage}
                min={0}
                max={totalPages > 0 ? totalPages : 9999}
                color={C.ink}
                fontSize={22}
                fontFamily={F.cormorant}
                slotHeight={36}
              />
            </View>
          </View>
        </View>
        <View style={s.manualRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.manualLabel}>Duration</Text>
            <View style={s.manualPageRow}>
              <DialInput
                value={durationMin}
                onChange={setDurationMin}
                min={1}
                max={600}
                color={C.ink}
                fontSize={22}
                fontFamily={F.cormorant}
                slotHeight={36}
              />
              <Text style={s.manualPageUnit}>min</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={[s.saveBtn, saving && { opacity: 0.5 }]} onPress={handleSave} disabled={saving} activeOpacity={0.8}>
          {saving ? <ActivityIndicator color={C.paper} /> : <Text style={s.saveBtnText}>記録する</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={s.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
          <Text style={s.cancelBtnText}>キャンセル</Text>
        </TouchableOpacity>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  topBarTitle: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase' },
  scrollContent: { paddingHorizontal: 28, paddingBottom: 60 },
  bookInfo: { flexDirection: 'row', gap: 20, marginBottom: 16 },
  bookMeta: { flex: 1, justifyContent: 'space-between' },
  author: { fontFamily: F.zen, fontSize: 11, letterSpacing: 1.5, color: C.muted2, textTransform: 'uppercase', marginBottom: 4 },
  title: { fontFamily: F.shippori, fontSize: 22, color: C.ink, lineHeight: 30, marginBottom: 8 },
  pages: { fontFamily: F.zen, fontSize: 12, color: C.muted },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 5, backgroundColor: C.ink, borderRadius: 2 },
  statusBadgeText: { fontFamily: F.zen, fontSize: 11, color: C.paper },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 },
  tagPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, borderWidth: 1, borderColor: C.line },
  tagPillText: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  tagAddBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 99, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed',
  },
  tagAddBtnText: { fontFamily: F.zen, fontSize: 11, color: C.muted },
  statusButtons: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  statusBtn: { paddingHorizontal: 12, paddingVertical: 5, borderWidth: 1, borderColor: C.ink, borderRadius: 2 },
  statusBtnText: { fontFamily: F.zen, fontSize: 11, color: C.ink },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    height: 52, backgroundColor: C.ink, borderRadius: 2, marginBottom: 10,
  },
  startBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.paper, textTransform: 'uppercase' },
  finishBtn: {
    height: 40, borderWidth: 1, borderColor: C.line, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 20,
  },
  finishBtnText: { fontFamily: F.zen, fontSize: 12, letterSpacing: 1.5, color: C.muted },
  description: { fontFamily: F.zen, fontSize: 12, color: C.muted, lineHeight: 22, marginBottom: 6 },
  descToggle: { fontFamily: F.zen, fontSize: 11, color: C.muted2, marginBottom: 20 },
  progressCard: { backgroundColor: C.line2, borderRadius: 2, padding: 20, marginBottom: 16 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  progressHero: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  progressPct: { fontFamily: F.cormorantLight, fontSize: 64, color: C.ink, lineHeight: 70 },
  progressPctUnit: { fontFamily: F.cormorantLight, fontSize: 22, color: C.muted },
  remainingText: { fontFamily: F.shippori, fontSize: 14, color: C.ink2, lineHeight: 22 },
  estimatedText: { fontFamily: F.zen, fontSize: 12, color: C.ink2, marginTop: 4 },
  progressBar: { height: 2, backgroundColor: C.line, borderRadius: 1, marginBottom: 8 },
  progressFill: { height: 2, backgroundColor: C.ink, borderRadius: 1 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressPageLabel: { fontFamily: F.cormorant, fontSize: 12, color: C.muted2 },
  progressCurrent: { fontFamily: F.cormorant, fontSize: 12, color: C.ink2 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  statCard: { width: '48%', backgroundColor: C.bg, borderRadius: 2, padding: 12 },
  statLabel: { fontFamily: F.zen, fontSize: 9, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontFamily: F.cormorant, fontSize: 20, color: C.ink },
  statUnit: { fontFamily: F.zen, fontSize: 11, color: C.muted },
  section: { marginBottom: 24 },
  sectionLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase', marginBottom: 10 },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addSessionText: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  starEmpty: { position: 'absolute', left: 0, top: 0, width: 36, textAlign: 'center', fontSize: 32, color: C.line, lineHeight: 36 },
  starFull: { width: 36, textAlign: 'center', fontSize: 32, color: C.ink, lineHeight: 36 },
  ratingNum: { fontFamily: F.cormorant, fontSize: 20, color: C.ink2, marginLeft: 8 },
  reviewDisplay: { borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8 },
  reviewActions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 12, marginTop: 10 },
  reviewCancel: { fontFamily: F.zen, fontSize: 12, color: C.muted2 },
  reviewSaveBtn: { paddingHorizontal: 16, paddingVertical: 7, backgroundColor: C.ink, borderRadius: 2 },
  reviewSaveBtnText: { fontFamily: F.zen, fontSize: 12, letterSpacing: 1, color: C.paper },
  reviewInput: {
    fontFamily: F.zen, fontSize: 13, color: C.ink, lineHeight: 24,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8,
    minHeight: 80, textAlignVertical: 'top',
  },
  reviewText: { fontFamily: F.zen, fontSize: 13, color: C.ink, lineHeight: 24 },
  reviewPlaceholder: { color: C.muted2 },
  noSessions: { fontFamily: F.zen, fontSize: 12, color: C.muted2 },
  proSessionBanner: {
    marginTop: 12, paddingVertical: 12, borderRadius: 2,
    borderWidth: 1, borderColor: C.line, alignItems: 'center',
  },
  proSessionBannerText: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  sessionItem: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 14 },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionDate: { fontFamily: F.shippori, fontSize: 13, color: C.ink2, marginBottom: 2 },
  sessionPages: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  sessionDuration: { fontFamily: F.cormorant, fontSize: 15, color: C.muted },
  memoItem: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 10,
    borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 12,
  },
  memoPage: { fontFamily: F.cormorant, fontSize: 13, color: C.muted2, flexShrink: 0, paddingTop: 1 },
  memoContent: { fontFamily: F.zen, fontSize: 13, color: C.ink2, lineHeight: 20, flex: 1 },
  memoActions: { flexDirection: 'row', gap: 12, paddingTop: 2 },
  memoDeletePreview: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    backgroundColor: C.bg, borderRadius: 4, padding: 14, marginBottom: 20,
  },
  sheet: {
    backgroundColor: C.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 28, paddingBottom: 48,
  },
  sheetBookInfo: { paddingBottom: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: C.line },
  sheetAuthor: { fontFamily: F.zen, fontSize: 11, color: C.muted, marginBottom: 4 },
  sheetTitle: { fontFamily: F.shippori, fontSize: 16, color: C.ink },
  sheetHeading: { fontFamily: F.shippori, fontSize: 20, color: C.ink, lineHeight: 32, marginBottom: 8 },
  sheetHeadingSmall: { fontFamily: F.shippori, fontSize: 18, color: C.ink, marginBottom: 16 },
  sheetSub: { fontFamily: F.zen, fontSize: 12, color: C.muted, lineHeight: 20, marginBottom: 20 },
  sheetNum: { fontFamily: F.cormorant, fontSize: 14, color: C.ink },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  orLine: { flex: 1, height: 1, backgroundColor: C.line },
  orText: { fontFamily: F.zen, fontSize: 10, color: C.muted, letterSpacing: 1 },
  tagSheetRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.line,
  },
  tagSheetName: { fontFamily: F.zen, fontSize: 13, color: C.muted },
  newTagRow: { flexDirection: 'row', gap: 10, marginTop: 16, alignItems: 'center' },
  newTagInput: {
    flex: 1, fontFamily: F.zen, fontSize: 13, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8,
  },
  newTagBtn: { paddingHorizontal: 14, paddingVertical: 8, backgroundColor: C.ink, borderRadius: 2 },
  newTagBtnText: { fontFamily: F.zen, fontSize: 11, color: C.paper },
  deleteBtn: {
    height: 50, backgroundColor: '#C77B6F', borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  deleteBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: '#fff' },
  saveBtn: {
    height: 50, backgroundColor: C.ink, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  saveBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.paper },
  cancelBtn: {
    height: 50, borderWidth: 1, borderColor: C.line, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.ink },
  manualError: { fontFamily: F.zen, fontSize: 12, color: '#C77B6F', marginBottom: 12 },
  manualRow: { flexDirection: 'row', marginBottom: 16 },
  manualFieldLeft: { marginRight: 16 },
  manualLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 6 },
  manualInput: {
    fontFamily: F.cormorant, fontSize: 22, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 4,
  },
  manualPageRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  manualPageUnit: { fontFamily: F.cormorant, fontSize: 14, color: C.muted2 },
});
