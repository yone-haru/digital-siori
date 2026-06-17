import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Image, Keyboard, Linking,
} from 'react-native';
import Constants from 'expo-constants';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path, Circle } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../contexts/SubscriptionContext';
import { C, F } from '../lib/colors';
import { BottomSheet } from '../components/BottomSheet';
import type { RootStackParamList } from '../types/navigation';

const DANGER = '#C77B6F';

const AVATAR_COLORS = ['#2B3A2E', '#7C2B28', '#1B2A3A', '#3D2B1A', '#2A2A2A', '#4A3728', '#5C2E2E', '#8B7355'];

function getAvatarColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = ((hash * 31) + userId.charCodeAt(i)) >>> 0;
  }
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Account'> };

export default function AccountScreen({ navigation }: Props) {
  const { user, signOut } = useAuth();
  const { isPro, openPaywall } = useSubscription();
  const [name, setName] = useState<string>(
    (user?.user_metadata?.display_name as string) ?? user?.email?.split('@')[0] ?? ''
  );
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    (user?.user_metadata?.avatar_url as string) ?? null
  );
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [logoutSheetOpen, setLogoutSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);
  const [contactCategory, setContactCategory] = useState<'改善案' | 'バグ報告' | 'その他'>('改善案');
  const [contactBody, setContactBody] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [pwSheetOpen, setPwSheetOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const email = user?.email ?? '';
  const avatarColor = user?.id ? getAvatarColor(user.id) : AVATAR_COLORS[0];

  const displayName = name.trim() || email.split('@')[0] || 'User';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  const nameInputRef = useRef<TextInput>(null);
  const nameRef = useRef(name);
  nameRef.current = name;

  async function saveName() {
    nameInputRef.current?.blur();
    setEditingName(false);
    const trimmed = nameRef.current.trim();
    if (!trimmed || trimmed.length > 20) return;
    setSavingName(true);
    await supabase.auth.updateUser({ data: { display_name: trimmed } });
    setSavingName(false);
  }

  useEffect(() => {
    if (!editingName) return;
    const sub = Keyboard.addListener('keyboardDidHide', saveName);
    return () => sub.remove();
  }, [editingName]);

  async function handlePickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('権限が必要です', 'フォトライブラリへのアクセスを許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });
    if (result.canceled || !result.assets[0] || !user) return;

    const asset = result.assets[0];
    if (!asset.base64) return;

    setUploadingAvatar(true);
    try {
      const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      const path = `${user.id}/avatar.${ext}`;

      const binaryStr = atob(asset.base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, bytes, { contentType: mimeType, upsert: true });
      if (error || !data) throw new Error(error?.message ?? 'upload failed');
      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(data.path);
      const url = `${urlData.publicUrl}?t=${Date.now()}`;
      await supabase.auth.updateUser({ data: { avatar_url: url } });
      setAvatarUrl(url);
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? 'アイコンの更新に失敗しました。');
    } finally {
      setUploadingAvatar(false);
    }
  }

  function translatePwError(msg: string): string {
    if (msg.includes('different from the old password')) return '新しいパスワードは現在のパスワードと異なるものを設定してください。';
    if (msg.includes('at least 6 characters')) return 'パスワードは6文字以上で設定してください。';
    if (msg.includes('Auth session missing')) return 'セッションが切れました。再度ログインしてください。';
    if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) return '現在のパスワードが正しくありません。';
    if (msg.includes('Too many requests')) return 'しばらく時間をおいてから再試行してください。';
    return 'パスワードの変更に失敗しました。';
  }

  async function handleSendPasswordReset() {
    if (!email) return;
    await supabase.auth.resetPasswordForEmail(email, { redirectTo: 'yondle://reset-password' });
    setPwSheetOpen(false);
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    Alert.alert('メールを送信しました', 'パスワード再設定用のリンクをメールアドレスに送りました。');
  }

  async function handleChangePassword() {
    if (!currentPassword) {
      Alert.alert('エラー', '現在のパスワードを入力してください。');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('エラー', '新しいパスワードは6文字以上で設定してください。');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('エラー', '確認用パスワードが一致しません。');
      return;
    }
    setSavingPassword(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
      if (signInError) throw new Error(translatePwError(signInError.message));
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw new Error(translatePwError(error.message));
      setPwSheetOpen(false);
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      Alert.alert('完了', 'パスワードを変更しました。');
    } catch (e: any) {
      Alert.alert('エラー', e?.message ?? 'パスワードの変更に失敗しました。');
    } finally {
      setSavingPassword(false);
    }
  }

  function handleSendContact() {
    const subject = encodeURIComponent(`【Yondle】${contactCategory}`);
    const body = encodeURIComponent(`カテゴリ: ${contactCategory}\n\n${contactBody}\n\n---\nアプリバージョン: 1.0.0\nメールアドレス: ${email}`);
    Linking.openURL(`mailto:llf.yoneharu@gmail.com?subject=${subject}&body=${body}`);
    setContactSheetOpen(false);
    setContactBody('');
    setContactCategory('改善案');
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    try {
      // Edge Function が auth ユーザーごと削除する（データは FK の CASCADE で消える）
      const { error } = await supabase.functions.invoke('delete-account');
      if (error) {
        // 関数が未デプロイの環境向けフォールバック:
        // データのみ削除（auth ユーザーは残るため、デプロイ後はこの経路を廃止すること）
        const { error: e1 } = await supabase.from('books').delete().eq('user_id', user.id);
        const { error: e2 } = await supabase.from('tags').delete().eq('user_id', user.id);
        if (e1 || e2) throw new Error('delete failed');
      }
      await signOut();
    } catch {
      setDeleting(false);
      Alert.alert('エラー', 'アカウントの削除に失敗しました。もう一度お試しください。');
    }
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <Path d="M14 4L6 11l8 7" stroke={C.ink} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>ACCOUNT</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Hero */}
        <View style={s.heroSection}>
          <TouchableOpacity onPress={handlePickAvatar} activeOpacity={0.8} style={s.avatarWrap}>
            <View style={[s.avatar, { backgroundColor: avatarColor }]}>
              {avatarUrl
                ? <Image source={{ uri: avatarUrl }} style={s.avatarImg} />
                : <Text style={s.avatarText}>{initial}</Text>}
            </View>
            {uploadingAvatar
              ? (
                <View style={s.avatarOverlay}>
                  <ActivityIndicator color="rgba(255,255,255,0.9)" size="small" />
                </View>
              ) : (
                <View style={s.avatarOverlay}>
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <Path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                    <Circle cx="12" cy="13" r="4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.4" />
                  </Svg>
                </View>
              )}
          </TouchableOpacity>
          <Text style={s.heroName}>{displayName}</Text>
          <Text style={s.heroEmail}>{email}</Text>
        </View>

        {/* Profile section */}
        <Text style={s.sectionLabel}>Profile</Text>
        <View style={s.sectionCard}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>表示名</Text>
              {editingName ? (
                <TextInput
                  ref={nameInputRef}
                  style={s.nameInput}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  placeholder="名前を入力"
                  placeholderTextColor={C.muted2}
                  maxLength={20}
                  returnKeyType="done"
                  onSubmitEditing={saveName}
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingName(true)} hitSlop={4}>
                  <Text style={s.rowValue}>{name.trim() || '未設定'}</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.rowRight}>
              {savingName
                ? <ActivityIndicator size="small" color={C.muted2} />
                : !editingName && (
                  <TouchableOpacity onPress={() => setEditingName(true)} hitSlop={8}>
                    <Text style={s.editHint}>編集</Text>
                  </TouchableOpacity>
                )}
            </View>
          </View>
        </View>

        {/* Security section */}
        <Text style={[s.sectionLabel, { marginTop: 28 }]}>Security</Text>
        <View style={s.sectionCard}>
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>メールアドレス</Text>
              <Text style={s.rowValue}>{email}</Text>
            </View>
          </View>
          <View style={s.rowDivider} />
          <TouchableOpacity style={s.row} onPress={() => setPwSheetOpen(true)} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>パスワード</Text>
              <Text style={s.rowValue}>••••••••</Text>
            </View>
            <Text style={s.editHint}>変更</Text>
          </TouchableOpacity>
        </View>

        {/* Plan section */}
        <Text style={[s.sectionLabel, { marginTop: 28 }]}>Plan</Text>
        <View style={s.sectionCard}>
          {isPro ? (
            <>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>プラン</Text>
                  <Text style={s.rowValue}>Pro（有効）</Text>
                </View>
              </View>
            </>
          ) : (
            <>
              <View style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>プラン</Text>
                  <Text style={s.rowValue}>無料</Text>
                </View>
              </View>
              <View style={s.rowDivider} />
              <TouchableOpacity style={s.row} onPress={openPaywall} activeOpacity={0.7}>
                <View style={{ flex: 1 }}>
                  <Text style={s.rowLabel}>アップグレード</Text>
                  <Text style={s.rowValue}>Pro プランを見る</Text>
                </View>
                <Text style={s.editHint}>詳細</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Support section */}
        <Text style={[s.sectionLabel, { marginTop: 28 }]}>Support</Text>
        <View style={s.sectionCard}>
          <TouchableOpacity style={s.row} onPress={() => setContactSheetOpen(true)} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>お問い合わせ</Text>
            </View>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M6 4l4 4-4 4" stroke={C.muted2} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Danger zone */}
        <View style={[s.sectionCard, { marginTop: 32 }]}>
          <TouchableOpacity style={s.row} onPress={() => setLogoutSheetOpen(true)} activeOpacity={0.7}>
            <Text style={s.dangerText}>ログアウト</Text>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M9 2H3.5A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14H9" stroke={DANGER} strokeWidth="1.3" strokeLinecap="round" />
              <Path d="M11 5l3 3-3 3M6 8h8" stroke={DANGER} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
          <View style={s.rowDivider} />
          <TouchableOpacity style={s.row} onPress={() => setDeleteSheetOpen(true)} activeOpacity={0.7}>
            <View style={{ flex: 1 }}>
              <Text style={s.dangerText}>アカウントを削除</Text>
              <Text style={s.dangerSub}>本棚や読書履歴も含めて完全に消えます</Text>
            </View>
            <Svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <Path d="M3 4.5h10M6 4.5V3A1 1 0 0 1 7 2h2a1 1 0 0 1 1 1v1.5M4.5 4.5l.6 8.5A1 1 0 0 0 6 14h4a1 1 0 0 0 1-1l.6-8.5" stroke={DANGER} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>DIGITAL BOOKMARK · v {Constants.expoConfig?.version ?? '1.0.0'}</Text>
        </View>
      </ScrollView>

      {/* Contact sheet */}
      <BottomSheet visible={contactSheetOpen} onClose={() => { setContactSheetOpen(false); setContactBody(''); setContactCategory('改善案'); }} sheetStyle={ds.sheet} keyboardAvoid>
        <Text style={ds.heading}>お問い合わせ</Text>
        <Text style={ds.fieldLabel}>カテゴリ</Text>
        <View style={cs.categoryRow}>
          {(['改善案', 'バグ報告', 'その他'] as const).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[cs.categoryBtn, contactCategory === cat && cs.categoryBtnActive]}
              onPress={() => setContactCategory(cat)}
              activeOpacity={0.7}
            >
              <Text style={[cs.categoryBtnText, contactCategory === cat && cs.categoryBtnTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[ds.fieldLabel, { marginTop: 16 }]}>内容</Text>
        <TextInput
          style={cs.bodyInput}
          value={contactBody}
          onChangeText={setContactBody}
          placeholder="お気軽にご意見・ご要望をお寄せください"
          placeholderTextColor={C.muted2}
          multiline
          textAlignVertical="top"
          maxLength={1000}
        />
        <TouchableOpacity
          style={[ds.saveBtn, !contactBody.trim() && { opacity: 0.4 }]}
          onPress={handleSendContact}
          disabled={!contactBody.trim()}
          activeOpacity={0.8}
        >
          <Text style={ds.saveBtnText}>メールアプリで送信</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ds.cancelBtn} onPress={() => { setContactSheetOpen(false); setContactBody(''); setContactCategory('改善案'); }} activeOpacity={0.7}>
          <Text style={ds.cancelBtnText}>キャンセル</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Logout confirmation sheet */}
      <BottomSheet visible={logoutSheetOpen} onClose={() => setLogoutSheetOpen(false)} sheetStyle={ds.sheet}>
        <Text style={ds.heading}>ログアウトしますか？</Text>
        <Text style={ds.body}>ログアウトすると、再度ログインが必要になります。</Text>
        <TouchableOpacity style={ds.deleteBtn} onPress={() => { setLogoutSheetOpen(false); signOut(); }} activeOpacity={0.8}>
          <Text style={ds.deleteBtnText}>ログアウト</Text>
        </TouchableOpacity>
        <TouchableOpacity style={ds.cancelBtn} onPress={() => setLogoutSheetOpen(false)} activeOpacity={0.7}>
          <Text style={ds.cancelBtnText}>キャンセル</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Password change sheet */}
      <BottomSheet visible={pwSheetOpen} onClose={() => { setPwSheetOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} sheetStyle={ds.sheet} disableClose={savingPassword} keyboardAvoid>
        <Text style={ds.heading}>パスワードを変更</Text>
        <Text style={ds.fieldLabel}>現在のパスワード</Text>
        <TextInput
          style={ds.input}
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="現在のパスワード"
          placeholderTextColor={C.muted2}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={[ds.fieldLabel, { marginTop: 4 }]}>新しいパスワード（6文字以上）</Text>
        <TextInput
          style={ds.input}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="新しいパスワード"
          placeholderTextColor={C.muted2}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Text style={[ds.fieldLabel, { marginTop: 4 }]}>確認用パスワード</Text>
        <TextInput
          style={ds.input}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="もう一度入力"
          placeholderTextColor={C.muted2}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={[ds.saveBtn, (!currentPassword || newPassword.length < 6 || confirmPassword.length < 6 || savingPassword) && { opacity: 0.4 }]}
          onPress={handleChangePassword}
          disabled={!currentPassword || newPassword.length < 6 || confirmPassword.length < 6 || savingPassword}
          activeOpacity={0.8}
        >
          {savingPassword
            ? <ActivityIndicator color={C.paper} />
            : <Text style={ds.saveBtnText}>変更する</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={ds.cancelBtn} onPress={() => { setPwSheetOpen(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); }} disabled={savingPassword} activeOpacity={0.7}>
          <Text style={ds.cancelBtnText}>キャンセル</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSendPasswordReset} hitSlop={8} style={ds.forgotRow} disabled={savingPassword} activeOpacity={0.7}>
          <Text style={ds.forgotLink}>パスワードをお忘れの場合</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Delete account sheet */}
      <BottomSheet visible={deleteSheetOpen} onClose={() => setDeleteSheetOpen(false)} sheetStyle={ds.sheet} disableClose={deleting} keyboardAvoid>
        <Text style={ds.heading}>アカウントを削除しますか？</Text>
        <Text style={ds.body}>
          本棚・読書履歴・タグがすべて削除されます。この操作は取り消せません。
        </Text>
        <Text style={ds.fieldLabel}>確認のため「削除する」と入力してください</Text>
        <TextInput
          style={ds.input}
          value={deleteConfirmText}
          onChangeText={setDeleteConfirmText}
          placeholder="削除する"
          placeholderTextColor={C.muted2}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[ds.deleteBtn, (deleteConfirmText !== '削除する' || deleting) && { opacity: 0.4 }]}
          onPress={handleDeleteAccount}
          disabled={deleteConfirmText !== '削除する' || deleting}
          activeOpacity={0.8}
        >
          {deleting
            ? <ActivityIndicator color="#fff" />
            : <Text style={ds.deleteBtnText}>アカウントを削除する</Text>}
        </TouchableOpacity>
        <TouchableOpacity style={ds.cancelBtn} onPress={() => setDeleteSheetOpen(false)} disabled={deleting} activeOpacity={0.7}>
          <Text style={ds.cancelBtnText}>キャンセル</Text>
        </TouchableOpacity>
      </BottomSheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  topBarTitle: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.8, color: C.muted, textTransform: 'uppercase' },
  scroll: { paddingBottom: 48 },
  heroSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 28 },
  avatarWrap: { marginBottom: 14 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 6,
  },
  avatarImg: { width: '100%', height: '100%', borderRadius: 48 },
  avatarText: { fontFamily: F.cormorantLight, fontSize: 40, color: 'rgba(255,255,255,0.9)', letterSpacing: 1 },
  avatarOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 32, borderBottomLeftRadius: 48, borderBottomRightRadius: 48,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroName: { fontFamily: F.shippori, fontSize: 22, color: C.ink, marginBottom: 6, letterSpacing: 0.3 },
  heroEmail: { fontFamily: F.cormorant, fontSize: 13, color: C.muted, letterSpacing: 0.3 },
  sectionLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.2, color: C.muted,
    textTransform: 'uppercase', paddingHorizontal: 28, marginBottom: 8,
  },
  sectionCard: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: C.line },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingVertical: 18, gap: 16,
  },
  rowDivider: { height: 1, backgroundColor: C.line, marginHorizontal: 28 },
  rowLabel: { fontFamily: F.zen, fontSize: 11, color: C.muted, marginBottom: 4, letterSpacing: 0.3 },
  rowValue: { fontFamily: F.cormorant, fontSize: 18, color: C.ink },
  rowRight: { flexShrink: 0 },
  editHint: { fontFamily: F.zen, fontSize: 11, color: C.muted2 },
  nameInput: {
    fontFamily: F.cormorant, fontSize: 18, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 4,
  },
  dangerText: { fontFamily: F.zen, fontSize: 14, color: DANGER, letterSpacing: 0.3 },
  dangerSub: { fontFamily: F.zen, fontSize: 11, color: C.muted2, marginTop: 3, letterSpacing: 0.2 },
  footer: { alignItems: 'center', paddingTop: 40, paddingBottom: 8 },
  footerText: { fontFamily: F.cormorant, fontSize: 11, color: C.muted2, letterSpacing: 3 },
});

const cs = StyleSheet.create({
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  categoryBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 99,
    borderWidth: 1, borderColor: C.line,
  },
  categoryBtnActive: { backgroundColor: C.ink, borderColor: C.ink },
  categoryBtnText: { fontFamily: F.zen, fontSize: 12, color: C.muted },
  categoryBtnTextActive: { color: C.paper },
  bodyInput: {
    fontFamily: F.zen, fontSize: 14, color: C.ink,
    borderWidth: 1, borderColor: C.line, borderRadius: 4,
    padding: 12, height: 120, marginBottom: 20,
  },
});

const ds = StyleSheet.create({
  sheet: {
    backgroundColor: C.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 28, paddingBottom: 48,
  },
  heading: { fontFamily: F.shippori, fontSize: 20, color: C.ink, marginBottom: 10, lineHeight: 30 },
  body: { fontFamily: F.zen, fontSize: 12, color: C.muted, lineHeight: 20, marginBottom: 20 },
  fieldLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2, color: C.muted, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    fontFamily: F.zen, fontSize: 16, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8, marginBottom: 20,
  },
  saveBtn: {
    height: 50, backgroundColor: C.ink, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  saveBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.paper },
  deleteBtn: {
    height: 50, backgroundColor: DANGER, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  deleteBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: '#fff' },
  cancelBtn: {
    height: 50, borderWidth: 1, borderColor: C.line, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.ink },
  forgotRow: { alignItems: 'center', paddingTop: 16 },
  forgotLink: { fontFamily: F.zen, fontSize: 11, color: C.muted2, textDecorationLine: 'underline' },
});
