import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { C, F } from '../lib/colors';
import { formatDuration, formatSessionDate } from '../lib/utils';
import { BookCover } from '../components/BookCover';
import type { Book, ReadingSession, Tag, BookStatus } from '../types';
import type { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'BookDetail'>;
  route: RouteProp<RootStackParamList, 'BookDetail'>;
};

type MemoEntry = { content: string; pageNumber: number };

const STATUS_LABELS: Record<BookStatus, string> = {
  reading: '読書中', rereading: '再読中', to_read: '未読', finished: '読書完了',
};
const NEXT_STATUSES: Record<BookStatus, BookStatus[]> = {
  to_read: ['reading', 'finished'],
  reading: ['finished', 'to_read'],
  finished: ['rereading', 'to_read'],
  rereading: ['finished', 'to_read'],
};

export default function BookDetailScreen({ navigation, route }: Props) {
  const { bookId } = route.params;
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [sessions, setSessions] = useState<ReadingSession[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [bookTagIds, setBookTagIds] = useState<string[]>([]);
  const [memos, setMemos] = useState<Record<string, MemoEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [tagSheetOpen, setTagSheetOpen] = useState(false);
  const [manualSessionOpen, setManualSessionOpen] = useState(false);
  const [startSheetOpen, setStartSheetOpen] = useState(false);
  const [prevReadCount, setPrevReadCount] = useState('0');
  const [initStartPage, setInitStartPage] = useState('0');
  const [initPending, setInitPending] = useState(false);
  const [review, setReview] = useState('');
  const [editingReview, setEditingReview] = useState(false);
  const [rating, setRating] = useState(0);
  const [savingReview, setSavingReview] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [creatingTag, setCreatingTag] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [{ data: b }, { data: s }, { data: btRows }, { data: tagRows }] = await Promise.all([
      supabase.from('books').select('*').eq('id', bookId).single(),
      supabase.from('reading_sessions').select('*').eq('book_id', bookId).order('started_at', { ascending: false }),
      supabase.from('book_tags').select('tag_id').eq('book_id', bookId),
      supabase.from('tags').select('id,name').eq('user_id', user.id).order('created_at'),
    ]);
    if (b) {
      setBook(b as Book);
      setReview(b.review ?? '');
      setRating(b.rating ?? 0);
    }
    const sessionList = (s as ReadingSession[]) ?? [];
    setSessions(sessionList);
    setBookTagIds((btRows ?? []).map((r: { tag_id: string }) => r.tag_id));
    setAllTags((tagRows as Tag[]) ?? []);

    if (sessionList.length > 0) {
      const ids = sessionList.map((r) => r.id);
      const { data: memoRows } = await supabase
        .from('session_memos')
        .select('session_id,content,page_number')
        .in('session_id', ids);
      const memoMap: Record<string, MemoEntry[]> = {};
      for (const m of memoRows ?? []) {
        memoMap[m.session_id] = [...(memoMap[m.session_id] ?? []), { content: m.content, pageNumber: m.page_number }];
      }
      setMemos(memoMap);
    }
  }, [bookId, user]);

  useEffect(() => { fetchData().finally(() => setLoading(false)); }, [fetchData]);

  async function changeStatus(newStatus: BookStatus) {
    if (!book) return;
    const updates: Record<string, unknown> = { status: newStatus };

    if (newStatus === 'reading') {
      if (!book.started_at) updates.started_at = new Date().toISOString();
      if (book.status === 'finished') {
        updates.current_page = 0;
        updates.started_at = new Date().toISOString();
      }
    } else if (newStatus === 'rereading') {
      updates.current_page = 0;
      updates.started_at = new Date().toISOString();
    } else if (newStatus === 'finished') {
      updates.finished_at = new Date().toISOString();
      if (book.status === 'reading') {
        updates.read_count = (book.read_count ?? 0) + 1;
      }
    }

    setBook((prev) => prev ? { ...prev, ...updates } as Book : prev);
    await supabase.from('books').update(updates).eq('id', bookId);
  }

  async function saveReview() {
    setEditingReview(false);
    setSavingReview(true);
    await supabase.from('books').update({ review: review || null }).eq('id', bookId);
    setSavingReview(false);
  }

  async function changeRating(newRating: number) {
    const val = newRating === rating ? 0 : newRating;
    setRating(val);
    await supabase.from('books').update({ rating: val === 0 ? null : val }).eq('id', bookId);
  }

  async function deleteBook() {
    setDeleteSheetOpen(false);
    await supabase.from('books').delete().eq('id', bookId);
    navigation.goBack();
  }

  async function toggleTag(tagId: string) {
    if (bookTagIds.includes(tagId)) {
      setBookTagIds((prev) => prev.filter((id) => id !== tagId));
      await supabase.from('book_tags').delete().eq('book_id', bookId).eq('tag_id', tagId);
    } else {
      setBookTagIds((prev) => [...prev, tagId]);
      await supabase.from('book_tags').insert({ book_id: bookId, tag_id: tagId, user_id: user?.id });
    }
  }

  async function createTag() {
    if (!newTagName.trim() || !user) return;
    setCreatingTag(true);
    const { data } = await supabase
      .from('tags')
      .insert({ name: newTagName.trim(), user_id: user.id })
      .select('id,name')
      .single();
    if (data) {
      setAllTags((prev) => [...prev, data as Tag]);
      setBookTagIds((prev) => [...prev, data.id]);
      await supabase.from('book_tags').insert({ book_id: bookId, tag_id: data.id, user_id: user.id });
    }
    setNewTagName('');
    setCreatingTag(false);
  }

  function handleStartReading() {
    if (!book) return;
    if (isFirstEver) {
      setPrevReadCount('0');
      setInitStartPage('0');
      setStartSheetOpen(true);
    } else {
      navigation.navigate('ReadingTimer', {
        bookId: book.id, bookTitle: book.title, bookAuthor: book.author,
        startPage: book.current_page, totalPages: book.total_pages,
      });
    }
  }

  function goFirstTime() {
    if (!book) return;
    setStartSheetOpen(false);
    navigation.navigate('ReadingTimer', {
      bookId: book.id, bookTitle: book.title, bookAuthor: book.author,
      startPage: 0, totalPages: book.total_pages,
    });
  }

  async function goPrevRead() {
    if (!book) return;
    setInitPending(true);
    const sp = parseInt(initStartPage, 10) || 0;
    const rc = parseInt(prevReadCount, 10) || 0;
    await supabase.from('books').update({
      read_count: rc,
      current_page: sp,
      status: 'reading',
      started_at: new Date().toISOString(),
    }).eq('id', bookId);
    setInitPending(false);
    setStartSheetOpen(false);
    navigation.navigate('ReadingTimer', {
      bookId: book.id, bookTitle: book.title, bookAuthor: book.author,
      startPage: sp, totalPages: book.total_pages,
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

  const nextStatuses = NEXT_STATUSES[book.status];
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

        {/* Status change buttons */}
        <View style={s.statusButtons}>
          {nextStatuses.map((ns) => (
            <TouchableOpacity key={ns} style={s.statusBtn} onPress={() => changeStatus(ns)} activeOpacity={0.7}>
              <Text style={s.statusBtnText}>{STATUS_LABELS[ns]}にする</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Start reading */}
        <TouchableOpacity style={s.startBtn} activeOpacity={0.85} onPress={handleStartReading}>
          <Text style={s.startBtnText}>読書をはじめる</Text>
          <Svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <Path d="M2 2l8 4-8 4V2z" fill={C.paper} />
          </Svg>
        </TouchableOpacity>

        {/* Description */}
        {book.description ? (
          <Text style={s.description} numberOfLines={4}>{book.description}</Text>
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
              {estimatedStr && <Text style={s.estimatedText}>約 {estimatedStr}</Text>}
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
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => changeRating(star)} hitSlop={4}>
                <Text style={[s.star, star <= rating && s.starFilled]}>★</Text>
              </TouchableOpacity>
            ))}
            {rating > 0 && <Text style={s.ratingNum}>{rating}.0</Text>}
          </View>
        </View>

        {/* Review */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Review</Text>
          {editingReview ? (
            <TextInput
              style={s.reviewInput}
              value={review}
              onChangeText={setReview}
              multiline
              autoFocus
              placeholder="感想を書く..."
              placeholderTextColor={C.muted2}
              onBlur={saveReview}
            />
          ) : (
            <TouchableOpacity style={s.reviewDisplay} onPress={() => setEditingReview(true)} activeOpacity={0.8}>
              {savingReview
                ? <ActivityIndicator size="small" color={C.muted} />
                : <Text style={[s.reviewText, !review.trim() && s.reviewPlaceholder]}>
                    {review.trim() || '感想を書く...'}
                  </Text>}
            </TouchableOpacity>
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
            sessions.map((session) => {
              const pagesRead = (session.end_page ?? 0) - (session.start_page ?? 0);
              const sessionMemos = memos[session.id] ?? [];
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
                  {sessionMemos.length > 0 && (
                    <View style={s.memoList}>
                      {sessionMemos.map((memo, i) => (
                        <View key={i} style={s.memoRow}>
                          <Text style={s.memoPage}>p.{memo.pageNumber}</Text>
                          <Text style={s.memoText}>{memo.content}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* Start reading sheet (first-time only) */}
      <Modal visible={startSheetOpen} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setStartSheetOpen(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
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
                <TextInput style={s.manualInput} value={prevReadCount} onChangeText={setPrevReadCount} keyboardType="number-pad" />
                <Text style={s.manualPageUnit}>回</Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.manualLabel}>現在のページ</Text>
              <View style={s.manualPageRow}>
                <Text style={s.manualPageUnit}>p.</Text>
                <TextInput style={[s.manualInput, { flex: 1 }]} value={initStartPage} onChangeText={setInitStartPage} keyboardType="number-pad" />
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
        </View>
      </Modal>

      {/* Delete bottom sheet */}
      <Modal visible={deleteSheetOpen} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setDeleteSheetOpen(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
          <View style={s.sheetBookInfo}>
            <Text style={s.sheetAuthor}>{book.author}</Text>
            <Text style={s.sheetTitle}>{book.title}</Text>
          </View>
          <Text style={s.sheetHeading}>この本を本棚から{'\n'}削除しますか？</Text>
          <Text style={s.sheetSub}>
            読書履歴 <Text style={s.sheetNum}>{sessions.length}</Text> 件、累計時間{' '}
            <Text style={s.sheetNum}>{formatDuration(totalSeconds)}</Text> もすべて消えます。
          </Text>
          <TouchableOpacity style={s.deleteBtn} onPress={deleteBook} activeOpacity={0.8}>
            <Text style={s.deleteBtnText}>削除する</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.cancelBtn} onPress={() => setDeleteSheetOpen(false)} activeOpacity={0.8}>
            <Text style={s.cancelBtnText}>キャンセル</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Tag sheet */}
      <Modal visible={tagSheetOpen} transparent animationType="slide">
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={() => setTagSheetOpen(false)} />
        <View style={s.sheet}>
          <View style={s.sheetHandle} />
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
        </View>
      </Modal>

      {/* Manual session sheet */}
      {manualSessionOpen && (
        <ManualSessionSheet
          bookId={bookId}
          userId={user?.id ?? ''}
          currentPage={book.current_page}
          totalPages={book.total_pages}
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
  bookId, userId, currentPage, totalPages, onSave, onCancel,
}: { bookId: string; userId: string; currentPage: number; totalPages: number; onSave: () => void; onCancel: () => void }) {
  const today = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [startPage, setStartPage] = useState(String(currentPage));
  const [endPage, setEndPage] = useState('');
  const [durationMin, setDurationMin] = useState('30');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    const sp = parseInt(startPage, 10);
    const ep = parseInt(endPage, 10);
    const mins = parseInt(durationMin, 10) || 0;
    if (isNaN(sp) || isNaN(ep) || ep < sp) {
      setError('終了ページは開始ページ以上にしてください'); return;
    }
    if (mins < 1) { setError('読書時間は1分以上にしてください'); return; }
    setSaving(true);
    setError(null);
    const startedAt = new Date(`${date}T12:00:00+09:00`).toISOString();
    const endedAt = new Date(new Date(startedAt).getTime() + mins * 60 * 1000).toISOString();
    const { error: e1 } = await supabase.from('reading_sessions').insert({
      book_id: bookId, user_id: userId,
      started_at: startedAt, ended_at: endedAt,
      start_page: sp, end_page: ep, duration_seconds: mins * 60,
    });
    if (!e1 && ep > currentPage) {
      await supabase.from('books').update({ current_page: ep }).eq('id', bookId).lt('current_page', ep);
    }
    setSaving(false);
    if (e1) setError('保存に失敗しました');
    else onSave();
  }

  return (
    <Modal visible transparent animationType="slide">
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onCancel} />
      <View style={s.sheet}>
        <View style={s.sheetHandle} />
        <Text style={s.sheetHeadingSmall}>読書記録を手動追加</Text>
        {error && <Text style={s.manualError}>{error}</Text>}
        <View style={s.manualRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.manualLabel}>DATE</Text>
            <TextInput style={s.manualInput} value={date} onChangeText={setDate} placeholder={today} placeholderTextColor={C.muted2} />
          </View>
        </View>
        <View style={s.manualRow}>
          <View style={[{ flex: 1 }, s.manualFieldLeft]}>
            <Text style={s.manualLabel}>開始ページ</Text>
            <View style={s.manualPageRow}>
              <Text style={s.manualPageUnit}>p.</Text>
              <TextInput style={[s.manualInput, { flex: 1 }]} value={startPage} onChangeText={setStartPage} keyboardType="number-pad" />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.manualLabel}>終了ページ</Text>
            <View style={s.manualPageRow}>
              <Text style={s.manualPageUnit}>p.</Text>
              <TextInput style={[s.manualInput, { flex: 1 }]} value={endPage} onChangeText={setEndPage} keyboardType="number-pad" placeholder={totalPages > 0 ? String(totalPages) : '120'} placeholderTextColor={C.muted2} />
            </View>
          </View>
        </View>
        <View style={s.manualRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.manualLabel}>Duration</Text>
            <View style={s.manualPageRow}>
              <TextInput style={[s.manualInput, { width: 56 }]} value={durationMin} onChangeText={setDurationMin} keyboardType="number-pad" />
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
      </View>
    </Modal>
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
    height: 52, backgroundColor: C.ink, borderRadius: 2, marginBottom: 20,
  },
  startBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.paper, textTransform: 'uppercase' },
  description: { fontFamily: F.zen, fontSize: 12, color: C.muted, lineHeight: 22, marginBottom: 20 },
  progressCard: { backgroundColor: C.line2, borderRadius: 2, padding: 20, marginBottom: 16 },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  progressLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  progressHero: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  progressPct: { fontFamily: F.cormorantLight, fontSize: 64, color: C.ink, lineHeight: 70 },
  progressPctUnit: { fontFamily: F.cormorantLight, fontSize: 22, color: C.muted },
  remainingText: { fontFamily: F.shippori, fontSize: 14, color: C.ink2, lineHeight: 22 },
  estimatedText: { fontFamily: F.zen, fontSize: 11, color: C.muted, marginTop: 2 },
  progressBar: { height: 2, backgroundColor: C.line, borderRadius: 1, marginBottom: 8 },
  progressFill: { height: 2, backgroundColor: C.ink, borderRadius: 1 },
  progressFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  progressPageLabel: { fontFamily: F.cormorant, fontSize: 12, color: C.muted2 },
  progressCurrent: { fontFamily: F.cormorant, fontSize: 12, color: C.ink2 },
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  statCard: { flex: 1, backgroundColor: C.bg, borderRadius: 2, padding: 12 },
  statLabel: { fontFamily: F.zen, fontSize: 9, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontFamily: F.cormorant, fontSize: 20, color: C.ink },
  statUnit: { fontFamily: F.zen, fontSize: 11, color: C.muted },
  section: { marginBottom: 24 },
  sectionLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase', marginBottom: 10 },
  sectionHeadRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  addSessionText: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  starsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  star: { fontSize: 24, color: C.line },
  starFilled: { color: C.ink },
  ratingNum: { fontFamily: F.cormorant, fontSize: 20, color: C.ink2, marginLeft: 8 },
  reviewDisplay: { borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8, minHeight: 44 },
  reviewInput: {
    fontFamily: F.zen, fontSize: 13, color: C.ink, lineHeight: 24,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8,
    minHeight: 80, textAlignVertical: 'top',
  },
  reviewText: { fontFamily: F.zen, fontSize: 13, color: C.ink, lineHeight: 24 },
  reviewPlaceholder: { color: C.muted2 },
  noSessions: { fontFamily: F.zen, fontSize: 12, color: C.muted2 },
  sessionItem: { borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 14 },
  sessionTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sessionDate: { fontFamily: F.shippori, fontSize: 13, color: C.ink2, marginBottom: 2 },
  sessionPages: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  sessionDuration: { fontFamily: F.cormorant, fontSize: 15, color: C.muted },
  memoList: { marginTop: 8, gap: 4 },
  memoRow: { flexDirection: 'row', gap: 8, paddingLeft: 4 },
  memoPage: { fontFamily: F.cormorant, fontSize: 12, color: C.muted2, flexShrink: 0 },
  memoText: { fontFamily: F.zen, fontSize: 12, color: C.muted2, lineHeight: 18, flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: C.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 28, paddingBottom: 48,
  },
  sheetHandle: { width: 40, height: 3, backgroundColor: C.line, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
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
