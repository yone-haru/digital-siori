import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  ScrollView, AppState,
} from 'react-native';
import { DialInput } from '../components/DialInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { F } from '../lib/colors';
import { formatDuration } from '../lib/utils';
import { BottomSheet } from '../components/BottomSheet';
import type { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReadingTimer'>;
  route: RouteProp<RootStackParamList, 'ReadingTimer'>;
};

type Phase = 'running' | 'confirm' | 'saving' | 'saved';
type BookMemo = { id: string; page_number: number; content: string; created_at: string };

const BRIGHT = 'rgba(255,255,255,0.92)';
const DIM = 'rgba(255,255,255,0.55)';

export default function ReadingTimerScreen({ navigation, route }: Props) {
  const { bookId, bookTitle, bookAuthor, startPage, totalPages } = route.params;
  const { user } = useAuth();

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [currentPage, setCurrentPage] = useState(startPage);
  const [phase, setPhase] = useState<Phase>('running');
  const [error, setError] = useState<string | null>(null);
  const [savedDuration, setSavedDuration] = useState(0);
  const [savedPages, setSavedPages] = useState(0);

  const [memoOpen, setMemoOpen] = useState(false);
  const [memoPage, setMemoPage] = useState(startPage);
  const [memoText, setMemoText] = useState('');
  const [savingMemo, setSavingMemo] = useState(false);
  const [bookMemos, setBookMemos] = useState<BookMemo[]>([]);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [deletingMemo, setDeletingMemo] = useState<BookMemo | null>(null);

  const mountTime = useRef(Date.now());
  const startedAt = useRef(new Date().toISOString());
  const frozenElapsed = useRef(0);
  const pauseAccum = useRef(0);
  const isRunningRef = useRef(true);

  useEffect(() => {
    supabase
      .from('book_memos')
      .select('id,page_number,content,created_at')
      .eq('book_id', bookId)
      .order('created_at', { ascending: true })
      .then(({ data }) => { if (data) setBookMemos(data as BookMemo[]); });
  }, [bookId]);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - mountTime.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  useEffect(() => { isRunningRef.current = isRunning; }, [isRunning]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && isRunningRef.current) {
        setElapsed(Math.floor((Date.now() - mountTime.current) / 1000));
      }
    });
    return () => sub.remove();
  }, []);

  function handlePause() {
    pauseAccum.current = elapsed;
    setIsPaused(true);
    setIsRunning(false);
  }

  function handleResume() {
    mountTime.current = Date.now() - pauseAccum.current * 1000;
    setIsPaused(false);
    setIsRunning(true);
  }

  const handleStop = useCallback(() => {
    frozenElapsed.current = elapsed;
    setIsRunning(false);
    setIsPaused(false);
    setPhase('confirm');
  }, [elapsed]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setError(null);
    setPhase('saving');

    const endPage = currentPage;
    const endedAt = new Date().toISOString();
    const durationSeconds = frozenElapsed.current;

    const { error: sessionErr } = await supabase
      .from('reading_sessions')
      .insert({
        book_id: bookId,
        user_id: user.id,
        started_at: startedAt.current,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        start_page: startPage,
        end_page: endPage,
      });

    if (sessionErr) {
      setError(`保存に失敗しました: ${sessionErr.message}`);
      setPhase('confirm');
      return;
    }

    const isNowFinished = totalPages > 0 && endPage >= totalPages;
    if (isNowFinished) {
      const { data: bd } = await supabase
        .from('books').select('read_count').eq('id', bookId).single();
      await supabase.from('books').update({
        status: 'finished',
        finished_at: new Date().toISOString(),
        read_count: (bd?.read_count ?? 0) + 1,
        current_page: endPage,
      }).eq('id', bookId);
    } else {
      const newPage = Math.max(startPage, endPage);
      await supabase
        .from('books')
        .update({ current_page: newPage })
        .eq('id', bookId)
        .lt('current_page', newPage);
    }

    setSavedDuration(durationSeconds);
    setSavedPages(Math.max(0, endPage - startPage));
    setPhase('saved');
  }, [bookId, currentPage, startPage, user]);

  async function handleSaveMemo() {
    if (!memoText.trim() || !user) return;
    setSavingMemo(true);
    if (editingMemoId) {
      await supabase.from('book_memos')
        .update({ page_number: memoPage, content: memoText.trim() })
        .eq('id', editingMemoId);
      setBookMemos((prev) => prev.map((m) =>
        m.id === editingMemoId ? { ...m, page_number: memoPage, content: memoText.trim() } : m
      ));
      setEditingMemoId(null);
    } else {
      const { data } = await supabase
        .from('book_memos')
        .insert({ book_id: bookId, user_id: user.id, page_number: memoPage, content: memoText.trim() })
        .select('id,page_number,content,created_at')
        .single();
      if (data) setBookMemos((prev) => [...prev, data as BookMemo]);
    }
    setMemoText('');
    setSavingMemo(false);
  }

  async function confirmDeleteMemo() {
    if (!deletingMemo) return;
    setBookMemos((prev) => prev.filter((m) => m.id !== deletingMemo.id));
    await supabase.from('book_memos').delete().eq('id', deletingMemo.id);
    setDeletingMemo(null);
  }

  function startEditMemo(memo: BookMemo) {
    setEditingMemoId(memo.id);
    setMemoPage(memo.page_number);
    setMemoText(memo.content);
  }

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return (
    <View style={s.container}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
            <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <Path d="M6 6l10 10M16 6L6 16" stroke="rgba(255,255,255,0.6)" strokeWidth="1.4" strokeLinecap="round" />
            </Svg>
          </TouchableOpacity>
          <Text style={s.topBarLabel}>Now Reading</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Book info */}
        <View style={s.bookInfo}>
          <Text style={s.bookAuthor} numberOfLines={1}>{bookAuthor}</Text>
          <Text style={s.bookTitle} numberOfLines={2}>{bookTitle}</Text>
        </View>

        {/* Timer hero */}
        <View style={s.timerHero}>
          <Text style={s.timerLabel}>Elapsed</Text>
          <View style={s.timerDisplay}>
            <Text style={s.timerMinutes}>{minutes}</Text>
            <Text style={s.timerSeconds}>:{String(seconds).padStart(2, '0')}</Text>
          </View>
          <Text style={s.timerUnit}>MINUTES · SECONDS</Text>
          <View style={s.pulse}>
            <View style={[s.pulseDot, !isRunning && s.pulseDotPaused]} />
            <Text style={s.pulseText}>{isRunning ? 'Reading' : 'Paused'}</Text>
          </View>
        </View>

        {/* Bottom section */}
        <View style={s.bottomSection}>
          <View style={s.pagesRow}>
            <View>
              <Text style={s.pageLabel}>Started At</Text>
              <Text style={s.pageValue}>p. {startPage}</Text>
            </View>
            <Svg width="20" height="12" viewBox="0 0 20 12" fill="none">
              <Path d="M1 6h18M13 1l6 5-6 5" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={s.pageLabel}>
                {phase === 'confirm' || phase === 'saving' ? '終了ページ' : 'Current'}
              </Text>
              <View style={s.pageInputRow}>
                <Text style={s.pagePrefix}>p.</Text>
                <DialInput
                  value={currentPage}
                  onChange={setCurrentPage}
                  min={startPage}
                  max={totalPages > 0 ? totalPages : 9999}
                  disabled={phase === 'saving'}
                  color={BRIGHT}
                  fontSize={28}
                  fontFamily={F.cormorantLight}
                  slotHeight={40}
                />
              </View>
            </View>
          </View>

          {phase === 'running' && (
            <TouchableOpacity style={s.memoBtn} onPress={() => { setMemoPage(currentPage); setMemoOpen(true); }}>
              <Text style={s.memoBtnText}>
                メモ{bookMemos.length > 0 ? ` (${bookMemos.length})` : ''}
              </Text>
            </TouchableOpacity>
          )}

          {error && <Text style={s.error}>{error}</Text>}
          {phase === 'confirm' && (
            <Text style={s.confirmHint}>終了ページを確認して「記録する」を押してください</Text>
          )}

          {phase === 'running' && (
            <>
              <TouchableOpacity
                style={s.pauseBtn}
                onPress={isPaused ? handleResume : handlePause}
                activeOpacity={0.85}
              >
                <Text style={s.pauseBtnText}>{isPaused ? '再開する' : '一時停止'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.actionBtn} onPress={handleStop} activeOpacity={0.85}>
                <Text style={s.actionBtnText}>読書をおわる</Text>
              </TouchableOpacity>
            </>
          )}
          {(phase === 'confirm' || phase === 'saving') && (
            <TouchableOpacity
              style={[s.actionBtn, phase === 'saving' && { opacity: 0.5 }]}
              onPress={handleSave}
              disabled={phase === 'saving'}
              activeOpacity={0.85}
            >
              <Text style={s.actionBtnText}>{phase === 'saving' ? '保存中...' : '記録する'}</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>

      {/* Memo modal */}
      <BottomSheet
        visible={memoOpen}
        onClose={() => { setMemoOpen(false); setEditingMemoId(null); setMemoText(''); }}
        sheetStyle={s.memoSheet}
        keyboardAvoid
      >
            <Text style={s.memoTitle}>MEMO</Text>

            {/* Existing memos */}
            {bookMemos.length > 0 && (
              <ScrollView style={s.memoListScroll} showsVerticalScrollIndicator={false}>
                {bookMemos.map((m) => (
                  <View key={m.id} style={[s.memoListItem, editingMemoId === m.id && s.memoListItemActive]}>
                    <Text style={s.memoListPage}>p.{m.page_number}</Text>
                    <Text style={s.memoListContent}>{m.content}</Text>
                    <View style={s.memoListActions}>
                      <TouchableOpacity onPress={() => startEditMemo(m)} hitSlop={8}>
                        <Svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <Path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#9A968F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          <Path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#9A968F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </Svg>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => setDeletingMemo(m)} hitSlop={8}>
                        <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <Path d="M2 2l10 10M12 2L2 12" stroke="#9A968F" strokeWidth="1.3" strokeLinecap="round" />
                        </Svg>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}

            {/* Add new memo */}
            <View style={s.memoAddArea}>
              <View style={s.memoField}>
                <Text style={s.memoFieldLabel}>PAGE</Text>
                <View style={s.memoPageRow}>
                  <Text style={s.memoPagePrefix}>p.</Text>
                  <DialInput
                    value={memoPage}
                    onChange={setMemoPage}
                    min={0}
                    max={totalPages > 0 ? totalPages : 9999}
                    color="#0A0A0A"
                    fontSize={24}
                    fontFamily={F.cormorant}
                    slotHeight={36}
                  />
                </View>
              </View>
              <View style={s.memoField}>
                <Text style={s.memoFieldLabel}>NOTE</Text>
                <TextInput
                  style={s.memoTextInput}
                  value={memoText}
                  onChangeText={setMemoText}
                  placeholder="メモを入力..."
                  placeholderTextColor="#9A968F"
                  multiline
                  numberOfLines={3}
                />
              </View>
              <View style={s.memoBtns}>
                <TouchableOpacity style={s.memoCancelBtn} onPress={() => { setMemoOpen(false); setEditingMemoId(null); setMemoText(''); }}>
                  <Text style={s.memoCancelText}>閉じる</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.memoSaveBtn, (savingMemo || !memoText.trim()) && { opacity: 0.4 }]}
                  onPress={handleSaveMemo}
                  disabled={savingMemo || !memoText.trim()}
                >
                  <Text style={s.memoSaveText}>{editingMemoId ? '更新' : '追加'}</Text>
                </TouchableOpacity>
              </View>
            </View>
      </BottomSheet>

      {/* Memo delete confirmation sheet */}
      <BottomSheet visible={!!deletingMemo} onClose={() => setDeletingMemo(null)} sheetStyle={s.memoSheet}>
          <Text style={s.memoDeleteHeading}>メモを削除しますか？</Text>
          {deletingMemo && (
            <View style={s.memoDeletePreview}>
              <Text style={s.memoDeletePage}>p.{deletingMemo.page_number}</Text>
              <Text style={s.memoDeleteContent} numberOfLines={2}>{deletingMemo.content}</Text>
            </View>
          )}
          <View style={[s.memoBtns, { padding: 28, paddingTop: 0 }]}>
            <TouchableOpacity style={s.memoCancelBtn} onPress={() => setDeletingMemo(null)}>
              <Text style={s.memoCancelText}>キャンセル</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.memoDeleteBtn} onPress={confirmDeleteMemo}>
              <Text style={s.memoDeleteBtnText}>削除する</Text>
            </TouchableOpacity>
          </View>
      </BottomSheet>

      {/* Session saved modal */}
      {phase === 'saved' && (
        <View style={s.savedOverlay}>
          <View style={s.savedCard}>
            <Text style={s.savedLabel}>SESSION SAVED</Text>
            <View style={s.savedDivider} />
            <View style={s.savedStats}>
              <View style={s.savedRow}>
                <Text style={s.savedRowLabel}>時間</Text>
                <Text style={s.savedRowValue}>
                  {savedDuration >= 3600
                    ? `${Math.floor(savedDuration / 3600)}h ${Math.floor((savedDuration % 3600) / 60)}m`
                    : `${Math.floor(savedDuration / 60)}m ${savedDuration % 60}s`}
                </Text>
              </View>
              <View style={s.savedRow}>
                <Text style={s.savedRowLabel}>ページ</Text>
                <Text style={s.savedRowValue}>+{savedPages}p</Text>
              </View>
            </View>
            <View style={s.savedDivider} />
            <TouchableOpacity
              style={s.savedDoneBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={s.savedDoneBtnText}>完了</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const BG = '#0F0D0A';

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  topBarLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
  },
  bookInfo: { alignItems: 'center', paddingHorizontal: 28, paddingTop: 24 },
  bookAuthor: {
    fontFamily: F.zen, fontSize: 11, letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 8,
  },
  bookTitle: {
    fontFamily: F.shippori, fontSize: 20, fontWeight: '500',
    color: BRIGHT, textAlign: 'center', letterSpacing: 0.5,
  },
  timerHero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  timerLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 20,
  },
  timerDisplay: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  timerMinutes: {
    fontFamily: F.cormorantLight, fontSize: 96, color: BRIGHT, lineHeight: 100,
  },
  timerSeconds: {
    fontFamily: F.cormorantLight, fontSize: 36, color: 'rgba(255,255,255,0.45)', lineHeight: 40,
  },
  timerUnit: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.8,
    color: 'rgba(255,255,255,0.3)', marginTop: 10,
  },
  pulse: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 28 },
  pulseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.7)' },
  pulseDotPaused: { backgroundColor: 'rgba(255,255,255,0.2)' },
  pulseText: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
  },
  bottomSection: {
    paddingHorizontal: 28, paddingBottom: 8,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
    paddingTop: 20,
  },
  pagesRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20,
  },
  pageLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.2,
    color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 8,
  },
  pageValue: { fontFamily: F.cormorantLight, fontSize: 22, color: DIM },
  pageInputRow: {
    flexDirection: 'row', alignItems: 'baseline',
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)',
  },
  pagePrefix: { fontFamily: F.cormorantLight, fontSize: 16, color: 'rgba(255,255,255,0.35)' },
  memoBtn: { alignItems: 'center', marginBottom: 16 },
  memoBtnText: { fontFamily: F.zen, fontSize: 11, letterSpacing: 1, color: 'rgba(255,255,255,0.4)' },
  error: { fontFamily: F.zen, fontSize: 12, color: '#C8624E', textAlign: 'center', marginBottom: 12 },
  confirmHint: {
    fontFamily: F.zen, fontSize: 11, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', marginBottom: 12,
  },
  pauseBtn: {
    height: 44, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  pauseBtnText: { fontFamily: F.zen, fontSize: 12, letterSpacing: 1.5, color: 'rgba(255,255,255,0.6)' },
  actionBtn: {
    height: 52, backgroundColor: '#F7F5EF', borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: { fontFamily: F.zenMed, fontSize: 13, letterSpacing: 1.5, color: '#0A0A0A' },
  // Memo sheet
  memoSheet: {
    backgroundColor: '#F7F5EF', borderTopLeftRadius: 4, borderTopRightRadius: 4,
    maxHeight: '80%',
  },
  memoTitle: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: '#6E6B65',
    textTransform: 'uppercase', paddingHorizontal: 28, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#E3DFD6',
  },
  memoListScroll: { maxHeight: 200, paddingHorizontal: 28, paddingTop: 12 },
  memoListItem: {
    flexDirection: 'row', gap: 10, paddingBottom: 10,
    borderBottomWidth: 1, borderBottomColor: '#E3DFD6', marginBottom: 10,
    alignItems: 'flex-start',
  },
  memoListItemActive: { backgroundColor: '#F0EDE6', marginHorizontal: -4, paddingHorizontal: 4, borderRadius: 4 },
  memoListPage: { fontFamily: F.cormorant, fontSize: 13, color: '#9A968F', flexShrink: 0, paddingTop: 1 },
  memoListContent: { fontFamily: F.zen, fontSize: 13, color: '#2A2822', lineHeight: 20, flex: 1 },
  memoListActions: { flexDirection: 'row', gap: 10, paddingTop: 2 },
  memoDeleteHeading: {
    fontFamily: F.shippori, fontSize: 18, color: '#0A0A0A',
    paddingHorizontal: 28, paddingBottom: 16,
  },
  memoDeletePreview: {
    flexDirection: 'row', gap: 10, alignItems: 'flex-start',
    marginHorizontal: 28, marginBottom: 24,
    padding: 14, backgroundColor: '#F0EDE6', borderRadius: 4,
  },
  memoDeletePage: { fontFamily: F.cormorant, fontSize: 13, color: '#9A968F', flexShrink: 0 },
  memoDeleteContent: { fontFamily: F.zen, fontSize: 13, color: '#4A4640', lineHeight: 20, flex: 1 },
  memoDeleteBtn: {
    flex: 1, height: 44, backgroundColor: '#C77B6F', borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  memoDeleteBtnText: { fontFamily: F.zen, fontSize: 12, letterSpacing: 1, color: '#fff' },
  memoAddArea: { padding: 28, paddingTop: 16 },
  memoField: { marginBottom: 16 },
  memoFieldLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: '#6E6B65',
    textTransform: 'uppercase', marginBottom: 8,
  },
  memoPageRow: { flexDirection: 'row', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: '#E3DFD6', paddingBottom: 6 },
  memoPagePrefix: { fontFamily: F.cormorant, fontSize: 14, color: '#9A968F' },
  memoTextInput: {
    fontFamily: F.zen, fontSize: 14, color: '#0A0A0A', lineHeight: 22,
    borderBottomWidth: 1, borderBottomColor: '#E3DFD6', paddingBottom: 8,
    minHeight: 60, textAlignVertical: 'top',
  },
  memoBtns: { flexDirection: 'row', gap: 12 },
  memoCancelBtn: { flex: 1, height: 44, borderWidth: 1, borderColor: '#E3DFD6', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  memoCancelText: { fontFamily: F.zen, fontSize: 12, letterSpacing: 1, color: '#6E6B65' },
  memoSaveBtn: { flex: 1, height: 44, backgroundColor: '#0A0A0A', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  memoSaveText: { fontFamily: F.zen, fontSize: 12, letterSpacing: 1, color: '#F7F5EF' },
  // Saved
  savedOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(15,13,10,0.8)',
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32,
  },
  savedCard: {
    width: '100%', maxWidth: 320, backgroundColor: '#F7F5EF',
    borderRadius: 2, paddingHorizontal: 28, paddingVertical: 32,
  },
  savedLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.8, color: '#6E6B65', textTransform: 'uppercase', textAlign: 'center', marginBottom: 20 },
  savedDivider: { height: 1, backgroundColor: '#E3DFD6', marginBottom: 20 },
  savedStats: { marginBottom: 20 },
  savedRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 },
  savedRowLabel: { fontFamily: F.zen, fontSize: 11, letterSpacing: 1.2, color: '#6E6B65' },
  savedRowValue: { fontFamily: F.cormorant, fontSize: 20, color: '#0A0A0A' },
  savedDoneBtn: { height: 44, backgroundColor: '#0A0A0A', borderRadius: 2, alignItems: 'center', justifyContent: 'center' },
  savedDoneBtnText: { fontFamily: F.zen, fontSize: 12, letterSpacing: 2, color: '#F7F5EF' },
});
