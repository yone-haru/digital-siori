import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Image, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Circle, Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { C, F } from '../lib/colors';
import { DialInput } from '../components/DialInput';
import { searchGoogleBooks } from '../lib/google-books';
import type { GoogleBook } from '../types';
import type { RootStackParamList } from '../types/navigation';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type SearchState = 'idle' | 'loading' | 'done' | 'error';

export default function AddBookScreen() {
  const nav = useNavigation<Nav>();
  const { user } = useAuth();
  const { isPro, openPaywall } = useSubscription();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleBook[]>([]);
  const [searchState, setSearchState] = useState<SearchState>('idle');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addError, setAddError] = useState<string | null>(null);
  const [showManual, setShowManual] = useState(false);
  const [bookCount, setBookCount] = useState(0);
  const inputRef = useRef<TextInput>(null);

  React.useEffect(() => {
    if (!user) return;
    supabase.from('books').select('id', { count: 'exact', head: true })
      .then(({ count }) => setBookCount(count ?? 0));
  }, [user]);

  async function handleSearch() {
    if (!query.trim()) return;
    setSearchState('loading');
    setResults([]);
    setShowManual(false);
    setAddError(null);
    try {
      const books = await searchGoogleBooks(query);
      setResults(books);
      setSearchState('done');
    } catch {
      setSearchState('error');
    }
  }

  async function handleAdd(book: GoogleBook) {
    if (!user) return;
    if (!isPro && bookCount >= 20) { openPaywall(); return; }
    setAddError(null);
    setAddingId(book.googleId);
    const { data, error } = await supabase
      .from('books')
      .insert({
        user_id: user.id,
        title: book.title,
        author: book.author,
        cover_url: book.thumbnail,
        total_pages: book.pageCount,
        isbn: book.isbn,
        description: book.description,
        status: 'to_read',
        current_page: 0,
        read_count: 0,
      })
      .select('id')
      .single();
    setAddingId(null);
    if (error) {
      setAddError('登録に失敗しました。もう一度お試しください。');
    } else if (data) {
      nav.navigate('BookDetail', { bookId: data.id });
    }
  }

  function clearSearch() {
    setQuery('');
    setResults([]);
    setSearchState('idle');
    setAddError(null);
    inputRef.current?.focus();
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>本を棚に加える</Text>
          <Text style={s.subtitle}>タイトルや著者で検索してください</Text>

          {/* Search bar */}
          <View style={s.searchBar}>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Circle cx="6.5" cy="6.5" r="5" stroke={C.muted2} strokeWidth="1.3" />
              <Path d="M10.5 10.5L14 14" stroke={C.muted2} strokeWidth="1.3" strokeLinecap="round" />
            </Svg>
            <TextInput
              ref={inputRef}
              style={s.searchInput}
              value={query}
              onChangeText={setQuery}
              placeholder="例：海辺のカフカ"
              placeholderTextColor={C.muted2}
              returnKeyType="search"
              onSubmitEditing={handleSearch}
              autoFocus
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={clearSearch} hitSlop={8}>
                <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <Path d="M4 4l8 8M12 4l-8 8" stroke={C.muted2} strokeWidth="1.3" strokeLinecap="round" />
                </Svg>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={s.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {searchState === 'loading' && (
            <View style={s.centered}>
              <Text style={s.loadingText}>SEARCHING...</Text>
            </View>
          )}

          {searchState === 'error' && (
            <Text style={s.errorText}>検索に失敗しました。もう一度お試しください。</Text>
          )}

          {searchState === 'done' && (
            <>
              <View style={s.resultsHeader}>
                <View style={s.resultsHeaderLeft}>
                  <Text style={s.resultsLabel}>RESULTS</Text>
                  <Text style={s.resultsCount}>· {results.length}</Text>
                </View>
                <Text style={s.googleBooksLabel}>Google Books</Text>
              </View>

              {addError && <Text style={s.errorText}>{addError}</Text>}

              {results.length > 0 ? (
                results.map((book) => (
                  <View key={book.googleId} style={s.resultItem}>
                    <View style={s.thumbnail}>
                      {book.thumbnail ? (
                        <Image source={{ uri: book.thumbnail }} style={s.thumbnailImg} resizeMode="cover" />
                      ) : (
                        <View style={s.thumbnailFallback}>
                          <Text style={s.thumbnailFallbackText}>{book.title.slice(0, 4)}</Text>
                        </View>
                      )}
                    </View>
                    <View style={s.resultInfo}>
                      <Text style={s.resultTitle} numberOfLines={2}>{book.title}</Text>
                      <Text style={s.resultAuthor} numberOfLines={1}>{book.author}</Text>
                      <Text style={s.resultMeta}>
                        {book.publishedYear}{book.publishedYear && book.pageCount > 0 ? ' · ' : ''}
                        {book.pageCount > 0 ? `${book.pageCount}p` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={s.addBtn}
                      onPress={() => handleAdd(book)}
                      disabled={addingId === book.googleId}
                      activeOpacity={0.7}
                    >
                      {addingId === book.googleId
                        ? <Text style={s.addBtnSpinner}>…</Text>
                        : (
                          <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <Path d="M7 2v10M2 7h10" stroke={C.muted} strokeWidth="1.4" strokeLinecap="round" />
                          </Svg>
                        )}
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <Text style={s.noResults}>「{query}」の検索結果が見つかりませんでした</Text>
              )}

              {!showManual && (
                <View style={s.manualPrompt}>
                  <Text style={s.manualPromptText}>見つからない場合は</Text>
                  <TouchableOpacity onPress={() => setShowManual(true)}>
                    <Text style={s.manualLink}>手動で登録する</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}

          {searchState === 'idle' && !showManual && (
            <View style={s.manualPrompt}>
              <Text style={s.manualPromptText}>見つからない場合は</Text>
              <TouchableOpacity onPress={() => setShowManual(true)}>
                <Text style={s.manualLink}>手動で登録する</Text>
              </TouchableOpacity>
            </View>
          )}

          {showManual && (
            <ManualAddForm
              userId={user?.id ?? ''}
              onSuccess={(id) => nav.navigate('BookDetail', { bookId: id })}
              onCancel={() => setShowManual(false)}
              canAdd={isPro || bookCount < 20}
              onPaywall={openPaywall}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ManualAddForm({
  userId, onSuccess, onCancel, canAdd, onPaywall,
}: { userId: string; onSuccess: (id: string) => void; onCancel: () => void; canAdd: boolean; onPaywall: () => void }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [totalPages, setTotalPages] = useState(0);
  const [coverUri, setCoverUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickCover() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'フォトライブラリへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [2, 3],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setCoverUri(result.assets[0].uri);
    }
  }

  async function uploadCover(): Promise<string | null> {
    if (!coverUri) return null;
    try {
      const ext = coverUri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const path = `${userId}/${Date.now()}.${ext}`;
      const response = await fetch(coverUri);
      const blob = await response.blob();
      const { data, error: uploadErr } = await supabase.storage
        .from('covers')
        .upload(path, blob, { contentType: mimeType });
      if (uploadErr || !data) return null;
      const { data: urlData } = supabase.storage.from('covers').getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch {
      return null;
    }
  }

  async function handleSubmit() {
    if (!title.trim()) { setError('タイトルを入力してください'); return; }
    if (!author.trim()) { setError('著者を入力してください'); return; }
    if (!canAdd) { onPaywall(); return; }
    setLoading(true);
    setError(null);
    const coverUrl = await uploadCover();
    const { data, error: err } = await supabase
      .from('books')
      .insert({
        user_id: userId,
        title: title.trim(),
        author: author.trim(),
        total_pages: totalPages,
        cover_url: coverUrl,
        status: 'to_read',
        current_page: 0,
        read_count: 0,
      })
      .select('id')
      .single();
    setLoading(false);
    if (err) setError('登録に失敗しました。');
    else if (data) onSuccess(data.id);
  }

  return (
    <View style={ms.container}>
      <View style={ms.header}>
        <Text style={ms.label}>MANUAL ENTRY</Text>
        <TouchableOpacity onPress={onCancel}>
          <Text style={ms.cancel}>キャンセル</Text>
        </TouchableOpacity>
      </View>
      {error && <Text style={ms.error}>{error}</Text>}

      {/* Cover picker */}
      <TouchableOpacity style={ms.coverPicker} onPress={pickCover} activeOpacity={0.8}>
        {coverUri ? (
          <Image source={{ uri: coverUri }} style={ms.coverImage} resizeMode="cover" />
        ) : (
          <View style={ms.coverPlaceholder}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M21 15V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h10"
                stroke={C.muted2} strokeWidth="1.3" strokeLinecap="round"
              />
              <Path d="M16 19h6M19 16v6" stroke={C.muted2} strokeWidth="1.3" strokeLinecap="round" />
              <Circle cx="8.5" cy="8.5" r="1.5" fill={C.muted2} />
              <Path d="M21 15l-5-5L5 21" stroke={C.muted2} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={ms.coverPlaceholderText}>表紙を追加</Text>
          </View>
        )}
      </TouchableOpacity>

      <View style={ms.field}>
        <Text style={ms.fieldLabel}>タイトル *</Text>
        <TextInput style={ms.input} value={title} onChangeText={setTitle} placeholder="本のタイトル" placeholderTextColor={C.muted2} />
      </View>
      <View style={ms.field}>
        <Text style={ms.fieldLabel}>著者 *</Text>
        <TextInput style={ms.input} value={author} onChangeText={setAuthor} placeholder="著者名" placeholderTextColor={C.muted2} />
      </View>
      <View style={ms.field}>
        <Text style={ms.fieldLabel}>総ページ数</Text>
        <View style={{ borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 4 }}>
          <DialInput
            value={totalPages}
            onChange={setTotalPages}
            min={0}
            max={9999}
            color={C.ink}
            fontSize={18}
            fontFamily={F.cormorant}
            slotHeight={36}
          />
        </View>
      </View>
      <TouchableOpacity style={[ms.btn, loading && { opacity: 0.5 }]} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
        {loading ? <ActivityIndicator color={C.paper} /> : <Text style={ms.btnText}>登録する</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  header: { paddingHorizontal: 28, paddingTop: 16, paddingBottom: 0 },
  title: { fontFamily: F.shippori, fontSize: 26, color: C.ink, marginBottom: 4 },
  subtitle: { fontFamily: F.zen, fontSize: 12, color: C.muted, marginBottom: 24 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderBottomWidth: 1.5, borderBottomColor: C.ink, paddingBottom: 10, marginBottom: 28,
  },
  searchInput: {
    flex: 1, fontFamily: F.zen, fontSize: 16, color: C.ink,
  },
  scrollContent: { paddingHorizontal: 28, paddingBottom: 80 },
  centered: { alignItems: 'center', paddingVertical: 48 },
  loadingText: {
    fontFamily: F.zen, fontSize: 11, letterSpacing: 2, color: C.muted2, textTransform: 'uppercase',
  },
  errorText: {
    fontFamily: F.zen, fontSize: 12, color: '#7C2B28', textAlign: 'center', paddingVertical: 16,
  },
  resultsHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16,
  },
  resultsHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultsLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase' },
  resultsCount: { fontFamily: F.cormorant, fontSize: 13, color: C.muted2 },
  googleBooksLabel: { fontFamily: F.zen, fontSize: 10, color: C.muted2, letterSpacing: 0.5 },
  resultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderTopWidth: 1, borderTopColor: C.line, paddingVertical: 14,
  },
  thumbnail: {
    width: 48, height: 68, borderRadius: 1, overflow: 'hidden',
    backgroundColor: C.line2,
    shadowColor: '#000', shadowOffset: { width: 1, height: 1 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 2,
  },
  thumbnailImg: { width: '100%', height: '100%' },
  thumbnailFallback: { flex: 1, padding: 4, justifyContent: 'flex-end' },
  thumbnailFallbackText: { fontFamily: F.zen, fontSize: 7, color: C.muted2, lineHeight: 10 },
  resultInfo: { flex: 1 },
  resultTitle: { fontFamily: F.shippori, fontSize: 14, color: C.ink, marginBottom: 2 },
  resultAuthor: { fontFamily: F.zen, fontSize: 11, color: C.muted, marginBottom: 2 },
  resultMeta: { fontFamily: F.cormorant, fontSize: 12, color: C.muted2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1, borderColor: C.line,
    alignItems: 'center', justifyContent: 'center',
  },
  addBtnSpinner: { fontFamily: F.cormorant, fontSize: 11, color: C.muted },
  noResults: {
    fontFamily: F.zen, fontSize: 13, color: C.muted, textAlign: 'center', paddingVertical: 32,
  },
  manualPrompt: { alignItems: 'center', paddingVertical: 24 },
  manualPromptText: { fontFamily: F.zen, fontSize: 12, color: C.muted, marginBottom: 4 },
  manualLink: { fontFamily: F.zen, fontSize: 12, color: C.ink, textDecorationLine: 'underline' },
});

const ms = StyleSheet.create({
  container: { marginTop: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  coverPicker: {
    alignSelf: 'center', width: 80, height: 120, borderRadius: 2,
    overflow: 'hidden', marginBottom: 24,
  },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1, borderWidth: 1, borderColor: C.line, borderStyle: 'dashed', borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  coverPlaceholderText: { fontFamily: F.zen, fontSize: 9, letterSpacing: 1, color: C.muted2 },
  label: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.muted, textTransform: 'uppercase' },
  cancel: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  error: { fontFamily: F.zen, fontSize: 12, color: '#7C2B28', marginBottom: 12 },
  field: { marginBottom: 24 },
  fieldLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    fontFamily: F.cormorant, fontSize: 18, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8,
  },
  btn: {
    height: 48, backgroundColor: C.ink, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginTop: 8,
  },
  btnText: { fontFamily: F.zenMed, fontSize: 13, letterSpacing: 2, color: C.paper, textTransform: 'uppercase' },
});
