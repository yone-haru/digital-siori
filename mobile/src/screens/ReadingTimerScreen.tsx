import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, TextInput,
  Modal, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import { DialInput } from '../components/DialInput';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { F } from '../lib/colors';
import { formatDuration } from '../lib/utils';
import type { RootStackParamList } from '../types/navigation';

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'ReadingTimer'>;
  route: RouteProp<RootStackParamList, 'ReadingTimer'>;
};

type Phase = 'running' | 'confirm' | 'saving' | 'saved';
type PendingMemo = { pageNumber: number; content: string };

const BRIGHT = 'rgba(255,255,255,0.92)';
const DIM = 'rgba(255,255,255,0.55)';

export default function ReadingTimerScreen({ navigation, route }: Props) {
  const { bookId, bookTitle, bookAuthor, startPage, totalPages } = route.params;
  const { user } = useAuth();

  const [elapsed, setElapsed] = useState(0);
  const [isRunning, setIsRunning] = useState(true);
  const [currentPage, setCurrentPage] = useState(startPage);
  const [phase, setPhase] = useState<Phase>('running');
  const [error, setError] = useState<string | null>(null);
  const [savedDuration, setSavedDuration] = useState(0);
  const [savedPages, setSavedPages] = useState(0);

  const [memoOpen, setMemoOpen] = useState(false);
  const [memoPage, setMemoPage] = useState(startPage);
  const [memoText, setMemoText] = useState('');
  const [pendingMemos, setPendingMemos] = useState<PendingMemo[]>([]);

  const mountTime = useRef(Date.now());
  const startedAt = useRef(new Date().toISOString());
  const frozenElapsed = useRef(0);

  useEffect(() => {
    if (!isRunning) return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - mountTime.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning]);

  const handleStop = useCallback(() => {
    frozenElapsed.current = elapsed;
    setIsRunning(false);
    setPhase('confirm');
  }, [elapsed]);

  const handleSave = useCallback(async () => {
    if (!user) return;
    setError(null);
    setPhase('saving');

    const endPage = currentPage;
    const endedAt = new Date().toISOString();
    const durationSeconds = frozenElapsed.current;

    const { data: sessionData, error: sessionErr } = await supabase
      .from('reading_sessions')
      .insert({
        book_id: bookId,
        user_id: user.id,
        started_at: startedAt.current,
        ended_at: endedAt,
        duration_seconds: durationSeconds,
        start_page: startPage,
        end_page: endPage,
      })
      .select('id')
      .single();

    if (sessionErr) {
      setError(`保存に失敗しました: ${sessionErr.message}`);
      setPhase('confirm');
      return;
    }

    if (sessionData && pendingMemos.length > 0) {
      await supabase.from('session_memos').insert(
        pendingMemos.map((m) => ({
          session_id: sessionData.id,
          book_id: bookId,
          user_id: user.id,
          page_number: m.pageNumber,
          content: m.content,
        }))
      );
    }

    // Update book status and current_page
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
  }, [bookId, currentPage, startPage, pendingMemos, user]);

  function handleSaveMemo() {
    if (memoText.trim()) {
      setPendingMemos((prev) => [...prev, { pageNumber: memoPage, content: memoText.trim() }]);
    }
    setMemoOpen(false);
    setMemoText('');
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
                + メモ{pendingMemos.length > 0 ? ` (${pendingMemos.length})` : ''}
              </Text>
            </TouchableOpacity>
          )}

          {error && <Text style={s.error}>{error}</Text>}
          {phase === 'confirm' && (
            <Text style={s.confirmHint}>終了ページを確認して「記録する」を押してください</Text>
          )}

          {phase === 'running' && (
            <TouchableOpacity style={s.actionBtn} onPress={handleStop} activeOpacity={0.85}>
              <Text style={s.actionBtnText}>読書をおわる</Text>
            </TouchableOpacity>
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
      <Modal visible={memoOpen} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <TouchableOpacity style={s.memoOverlay} activeOpacity={1} onPress={() => setMemoOpen(false)} />
          <View style={s.memoSheet}>
            <View style={s.memoHandle} />
            <Text style={s.memoTitle}>MEMO</Text>
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
                autoFocus
                numberOfLines={4}
              />
            </View>
            <View style={s.memoBtns}>
              <TouchableOpacity style={s.memoCancelBtn} onPress={() => setMemoOpen(false)}>
                <Text style={s.memoCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.memoSaveBtn} onPress={handleSaveMemo}>
                <Text style={s.memoSaveText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

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
  pulseDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
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
  pageInput: {
    fontFamily: F.cormorantLight, fontSize: 28, color: BRIGHT,
    minWidth: 48, textAlign: 'right', paddingBottom: 2,
  },
  memoBtn: { alignItems: 'center', marginBottom: 16 },
  memoBtnText: {
    fontFamily: F.zen, fontSize: 11, letterSpacing: 1,
    color: 'rgba(255,255,255,0.4)',
  },
  error: {
    fontFamily: F.zen, fontSize: 12, color: '#C8624E',
    textAlign: 'center', marginBottom: 12,
  },
  confirmHint: {
    fontFamily: F.zen, fontSize: 11, color: 'rgba(255,255,255,0.3)',
    textAlign: 'center', marginBottom: 12,
  },
  actionBtn: {
    height: 52, backgroundColor: '#F7F5EF', borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  actionBtnText: {
    fontFamily: F.zenMed, fontSize: 13, letterSpacing: 1.5, color: '#0A0A0A',
  },
  // Memo sheet
  memoOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)' },
  memoSheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: '#F7F5EF', borderTopLeftRadius: 4, borderTopRightRadius: 4,
    padding: 28, paddingBottom: 40,
  },
  memoHandle: { width: 40, height: 3, backgroundColor: '#E3DFD6', borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  memoTitle: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: '#6E6B65', textTransform: 'uppercase', marginBottom: 20 },
  memoField: { marginBottom: 20 },
  memoFieldLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: '#6E6B65', textTransform: 'uppercase', marginBottom: 8 },
  memoPageRow: { flexDirection: 'row', alignItems: 'baseline', borderBottomWidth: 1, borderBottomColor: '#E3DFD6', paddingBottom: 6 },
  memoPagePrefix: { fontFamily: F.cormorant, fontSize: 14, color: '#9A968F' },
  memoPageInput: { fontFamily: F.cormorant, fontSize: 24, color: '#0A0A0A', minWidth: 40 },
  memoTextInput: {
    fontFamily: F.zen, fontSize: 14, color: '#0A0A0A', lineHeight: 24,
    borderBottomWidth: 1, borderBottomColor: '#E3DFD6', paddingBottom: 8,
    minHeight: 80, textAlignVertical: 'top',
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
