import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { F } from '../lib/colors';
import type { RootStackParamList } from '../types/navigation';

const BG = '#0F0D0A';
const CARD = '#16140F';
const LINE = 'rgba(255,255,255,0.08)';
const W92 = 'rgba(255,255,255,0.92)';
const W55 = 'rgba(255,255,255,0.55)';
const W35 = 'rgba(255,255,255,0.35)';
const W25 = 'rgba(255,255,255,0.25)';
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
  const [name, setName] = useState<string>(
    (user?.user_metadata?.display_name as string) ?? user?.email?.split('@')[0] ?? ''
  );
  const [editingName, setEditingName] = useState(false);
  const [savingName, setSavingName] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const email = user?.email ?? '';
  const avatarColor = user?.id ? getAvatarColor(user.id) : AVATAR_COLORS[0];
  const displayName = name.trim() || email.split('@')[0] || 'User';
  const initial = displayName[0]?.toUpperCase() ?? '?';

  async function saveName() {
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 20) return;
    setEditingName(false);
    setSavingName(true);
    await supabase.auth.updateUser({ data: { display_name: trimmed } });
    setSavingName(false);
  }

  function confirmLogout() {
    Alert.alert('ログアウト', 'ログアウトしますか？', [
      { text: 'キャンセル', style: 'cancel' },
      { text: 'ログアウト', style: 'destructive', onPress: signOut },
    ]);
  }

  async function handleDeleteAccount() {
    if (!user) return;
    setDeleting(true);
    await supabase.from('reading_sessions').delete().eq('user_id', user.id);
    await supabase.from('books').delete().eq('user_id', user.id);
    await signOut();
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Header */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <Path d="M14 4L6 11l8 7" stroke={W55} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>ACCOUNT</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {/* Hero */}
        <View style={s.heroSection}>
          <View style={[s.avatar, { backgroundColor: avatarColor }]}>
            <Text style={s.avatarText}>{initial}</Text>
          </View>
          <Text style={s.heroName}>{displayName}</Text>
          <Text style={s.heroEmail}>{email}</Text>
        </View>

        {/* Profile section */}
        <Text style={s.sectionLabel}>Profile</Text>
        <View style={s.sectionCard}>
          {/* Display name row */}
          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.rowLabel}>表示名</Text>
              {editingName ? (
                <TextInput
                  style={s.nameInput}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  placeholder="名前を入力"
                  placeholderTextColor={W35}
                  maxLength={20}
                  onBlur={saveName}
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
                ? <ActivityIndicator size="small" color={W35} />
                : <Text style={s.editHint}>{editingName ? '' : '編集'}</Text>}
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
        </View>

        {/* Danger zone */}
        <View style={[s.sectionCard, { marginTop: 32 }]}>
          <TouchableOpacity style={s.row} onPress={confirmLogout} activeOpacity={0.7}>
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
          <Text style={s.footerText}>DIGITAL BOOKMARK · v 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Delete account sheet */}
      <Modal visible={deleteSheetOpen} transparent animationType="slide">
        <TouchableOpacity style={ds.overlay} activeOpacity={1} onPress={() => { if (!deleting) setDeleteSheetOpen(false); }} />
        <View style={ds.sheet}>
          <View style={ds.handle} />
          <Text style={ds.heading}>アカウントを削除しますか？</Text>
          <Text style={ds.body}>
            本棚・読書履歴・タグがすべて削除されます。この操作は取り消せません。
          </Text>
          <Text style={ds.confirmLabel}>確認のため「削除する」と入力してください</Text>
          <TextInput
            style={ds.input}
            value={deleteConfirmText}
            onChangeText={setDeleteConfirmText}
            placeholder="削除する"
            placeholderTextColor="rgba(255,255,255,0.2)"
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
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 28, paddingVertical: 12,
  },
  topBarTitle: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.8, color: W55 },
  scroll: { paddingBottom: 48 },
  heroSection: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 28 },
  avatar: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8,
  },
  avatarText: { fontFamily: F.cormorantLight, fontSize: 40, color: W92, letterSpacing: 1 },
  heroName: { fontFamily: F.shippori, fontSize: 22, color: W92, marginBottom: 6, letterSpacing: 0.3 },
  heroEmail: { fontFamily: F.cormorant, fontSize: 13, color: W55, letterSpacing: 0.3 },
  sectionLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.2, color: W35,
    textTransform: 'uppercase', paddingHorizontal: 28, marginBottom: 8,
  },
  sectionCard: { borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE },
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 28, paddingVertical: 18, gap: 16,
  },
  rowDivider: { height: 1, backgroundColor: LINE, marginHorizontal: 28 },
  rowLabel: { fontFamily: F.zen, fontSize: 11, color: W55, marginBottom: 4, letterSpacing: 0.3 },
  rowValue: { fontFamily: F.cormorant, fontSize: 18, color: W92 },
  rowRight: { flexShrink: 0 },
  editHint: { fontFamily: F.zen, fontSize: 11, color: W35 },
  nameInput: {
    fontFamily: F.cormorant, fontSize: 18, color: W92,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.3)', paddingBottom: 4,
  },
  dangerText: { fontFamily: F.zen, fontSize: 14, color: DANGER, letterSpacing: 0.3 },
  dangerSub: { fontFamily: F.zen, fontSize: 11, color: W35, marginTop: 3, letterSpacing: 0.2 },
  footer: { alignItems: 'center', paddingTop: 40, paddingBottom: 8 },
  footerText: { fontFamily: F.cormorant, fontSize: 11, color: W25, letterSpacing: 3 },
});

const ds = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: CARD, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 28, paddingBottom: 48,
  },
  handle: { width: 40, height: 3, backgroundColor: W25, borderRadius: 2, alignSelf: 'center', marginBottom: 24 },
  heading: { fontFamily: F.shippori, fontSize: 20, color: W92, marginBottom: 10, lineHeight: 30 },
  body: { fontFamily: F.zen, fontSize: 12, color: W55, lineHeight: 20, marginBottom: 20 },
  confirmLabel: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2, color: W35, textTransform: 'uppercase', marginBottom: 8 },
  input: {
    fontFamily: F.zen, fontSize: 16, color: W92,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.15)', paddingBottom: 8, marginBottom: 20,
  },
  deleteBtn: {
    height: 50, backgroundColor: DANGER, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  deleteBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: '#fff' },
  cancelBtn: {
    height: 50, borderWidth: 1, borderColor: LINE, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: W55 },
});
