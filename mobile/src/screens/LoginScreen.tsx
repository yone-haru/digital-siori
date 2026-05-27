import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { supabase } from '../lib/supabase';
import { C, F } from '../lib/colors';
import type { AuthStackParamList } from '../types/navigation';
import { BookmarkLogo } from '../components/BookmarkLogo';
import { BottomSheet } from '../components/BottomSheet';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSheetOpen, setResetSheetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError('メールアドレスまたはパスワードが正しくありません。');
    setLoading(false);
  }

  function openResetSheet() {
    setResetEmail(email.trim());
    setResetSent(false);
    setResetSheetOpen(true);
  }

  async function handleSendReset() {
    const trimmed = resetEmail.trim();
    if (!trimmed) return;
    setSendingReset(true);
    await supabase.auth.resetPasswordForEmail(trimmed, { redirectTo: 'digitalshiori://reset-password' });
    setSendingReset(false);
    setResetSent(true);
  }

  return (
    <SafeAreaView style={s.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={s.logoArea}>
            <BookmarkLogo />
          </View>

          <View style={s.formArea}>
            <Text style={s.welcomeLabel}>Welcome</Text>
            <Text style={s.tagline}>あなたの読書を、{'\n'}次のページへ。</Text>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>EMAIL</Text>
              <TextInput
                style={s.input}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="haru@example.com"
                placeholderTextColor={C.muted2}
              />
            </View>

            <View style={[s.inputGroup, { marginBottom: 12 }]}>
              <Text style={s.inputLabel}>PASSWORD</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="••••••••"
                placeholderTextColor={C.muted2}
              />
            </View>

            <TouchableOpacity onPress={openResetSheet} hitSlop={8} style={s.forgotRow}>
              <Text style={s.forgotLink}>パスワードをお忘れですか？</Text>
            </TouchableOpacity>

            {error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity
              style={[s.button, loading && s.buttonDisabled]}
              onPress={handleLogin}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={C.paper} />
                : <Text style={s.buttonText}>LOG IN</Text>}
            </TouchableOpacity>

            <View style={s.linkRow}>
              <Text style={s.linkText}>はじめての方は </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
                <Text style={s.link}>新規登録</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomSheet visible={resetSheetOpen} onClose={() => setResetSheetOpen(false)} sheetStyle={rs.sheet} keyboardAvoid>
        {resetSent ? (
          <>
            <Text style={rs.heading}>メールを送信しました</Text>
            <Text style={rs.body}>パスワード再設定用のリンクを送りました。メールをご確認ください。</Text>
            <TouchableOpacity style={rs.btn} onPress={() => setResetSheetOpen(false)} activeOpacity={0.8}>
              <Text style={rs.btnText}>閉じる</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={rs.heading}>パスワードのリセット</Text>
            <Text style={rs.body}>登録済みのメールアドレスに再設定用のリンクを送ります。</Text>
            <Text style={rs.fieldLabel}>EMAIL</Text>
            <TextInput
              style={rs.input}
              value={resetEmail}
              onChangeText={setResetEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="haru@example.com"
              placeholderTextColor={C.muted2}
            />
            <TouchableOpacity
              style={[rs.btn, (!resetEmail.trim() || sendingReset) && { opacity: 0.4 }]}
              onPress={handleSendReset}
              disabled={!resetEmail.trim() || sendingReset}
              activeOpacity={0.8}
            >
              {sendingReset
                ? <ActivityIndicator color={C.paper} />
                : <Text style={rs.btnText}>送信する</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={rs.cancelBtn} onPress={() => setResetSheetOpen(false)} activeOpacity={0.7}>
              <Text style={rs.cancelBtnText}>キャンセル</Text>
            </TouchableOpacity>
          </>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 32 },
  logoArea: { marginTop: 36, marginBottom: 40 },
  formArea: { flex: 1, justifyContent: 'flex-end', paddingBottom: 32 },
  welcomeLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5,
    color: C.muted, textTransform: 'uppercase', marginBottom: 14,
  },
  tagline: {
    fontFamily: F.shippori, fontSize: 30, color: C.ink2,
    lineHeight: 48, marginBottom: 48,
  },
  inputGroup: { marginBottom: 28 },
  inputLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5,
    color: C.muted, textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    fontFamily: F.cormorant, fontSize: 19, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 10,
  },
  error: {
    fontFamily: F.zen, fontSize: 12, color: '#7C2B28',
    textAlign: 'center', marginBottom: 16,
  },
  button: {
    height: 52, backgroundColor: C.ink, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontFamily: F.zenMed, fontSize: 13, letterSpacing: 2.5,
    color: C.paper, textTransform: 'uppercase',
  },
  linkRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  linkText: { fontFamily: F.zen, fontSize: 12, color: C.muted },
  link: {
    fontFamily: F.zen, fontSize: 12, color: C.ink,
    textDecorationLine: 'underline',
  },
  forgotRow: { alignSelf: 'flex-end', marginBottom: 32 },
  forgotLink: { fontFamily: F.zen, fontSize: 11, color: C.muted2, textDecorationLine: 'underline' },
});

const rs = StyleSheet.create({
  sheet: {
    backgroundColor: C.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    padding: 28, paddingBottom: 48,
  },
  heading: { fontFamily: F.shippori, fontSize: 20, color: C.ink, marginBottom: 10, lineHeight: 30 },
  body: { fontFamily: F.zen, fontSize: 12, color: C.muted, lineHeight: 20, marginBottom: 20 },
  fieldLabel: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2, color: C.muted,
    textTransform: 'uppercase', marginBottom: 8,
  },
  input: {
    fontFamily: F.zen, fontSize: 16, color: C.ink,
    borderBottomWidth: 1, borderBottomColor: C.line, paddingBottom: 8, marginBottom: 20,
  },
  btn: {
    height: 50, backgroundColor: C.ink, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  btnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.paper },
  cancelBtn: {
    height: 50, borderWidth: 1, borderColor: C.line, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  cancelBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1.5, color: C.ink },
});
