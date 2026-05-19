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

type Props = { navigation: NativeStackNavigationProp<AuthStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (err) setError('メールアドレスまたはパスワードが正しくありません。');
    setLoading(false);
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

            <View style={[s.inputGroup, { marginBottom: 44 }]}>
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
});
