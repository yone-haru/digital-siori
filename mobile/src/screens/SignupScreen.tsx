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
import { YondleLogo } from '../components/YondleLogo';

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Signup'> };

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function parseError(message: string): string {
  if (message.includes('already registered') || message.includes('User already registered')) {
    return 'このメールアドレスはすでに登録済みです。ログインしてください。';
  }
  if (message.includes('invalid') && message.includes('email')) {
    return 'メールアドレスの形式が正しくありません。';
  }
  if (message.includes('Password') || message.includes('password')) {
    return 'パスワードは6文字以上で設定してください。';
  }
  if (message.includes('rate limit') || message.includes('rate_limit')) {
    return '時間をおいてから再度お試しください。';
  }
  if (message.includes('network') || message.includes('fetch')) {
    return 'ネットワークエラーが発生しました。接続を確認してください。';
  }
  return '登録に失敗しました。しばらくしてから再度お試しください。';
}

export default function SignupScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSignup() {
    setError(null);
    if (!email.trim()) {
      setError('メールアドレスを入力してください。');
      return;
    }
    if (!isValidEmail(email.trim())) {
      setError('メールアドレスの形式が正しくありません。');
      return;
    }
    if (!password) {
      setError('パスワードを入力してください。');
      return;
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で設定してください。');
      return;
    }
    setLoading(true);
    const { error: err } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: 'yondle://signup-complete' },
    });
    if (err) {
      setError(parseError(err.message));
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  if (sent) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.sentContainer}>
          <YondleLogo />
          <View style={s.sentBox}>
            <Text style={s.sentTitle}>メールを送信しました</Text>
            <Text style={s.sentBody}>
              <Text style={s.sentEmail}>{email.trim()}</Text>
              {'\n'}に確認メールを送りました。{'\n\n'}
              メール内のリンクをタップして{'\n'}登録を完了してください。
            </Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={s.sentLink}>ログイン画面へ</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
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
            <YondleLogo />
          </View>

          <View style={s.formArea}>
            <Text style={s.label}>Create Account</Text>
            <Text style={s.tagline}>あなたの本棚を、{'\n'}はじめましょう。</Text>

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

            <View style={[s.inputGroup, { marginBottom: 44 }]}>
              <Text style={s.inputLabel}>PASSWORD</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="6文字以上"
                placeholderTextColor={C.muted2}
              />
            </View>

            {error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity
              style={[s.button, loading && s.buttonDisabled]}
              onPress={handleSignup}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={C.paper} />
                : <Text style={s.buttonText}>SIGN UP</Text>}
            </TouchableOpacity>

            <View style={s.linkRow}>
              <Text style={s.linkText}>すでにアカウントをお持ちの方は </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={s.link}>ログイン</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.paper },
  scroll: { flexGrow: 1, paddingHorizontal: 28, paddingBottom: 32 },
  logoArea: { marginTop: 36, marginBottom: 40 },
  formArea: { flex: 1, justifyContent: 'flex-end', paddingBottom: 32 },
  label: {
    fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5,
    color: C.muted, textTransform: 'uppercase', marginBottom: 14,
  },
  tagline: {
    fontFamily: F.shippori, fontSize: 28, color: C.ink2,
    lineHeight: 46, marginBottom: 48,
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
  sentContainer: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36,
  },
  sentBox: {
    marginTop: 48, marginBottom: 40, alignItems: 'center',
  },
  sentTitle: {
    fontFamily: F.shippori, fontSize: 22, color: C.ink2,
    marginBottom: 24, letterSpacing: 1,
  },
  sentBody: {
    fontFamily: F.zen, fontSize: 13, color: C.muted,
    lineHeight: 22, textAlign: 'center',
  },
  sentEmail: {
    fontFamily: F.zen, fontSize: 13, color: C.ink,
  },
  sentLink: {
    fontFamily: F.zen, fontSize: 13, color: C.ink,
    textDecorationLine: 'underline', letterSpacing: 1,
  },
});
