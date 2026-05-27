import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { C, F } from '../lib/colors';
import { BookmarkLogo } from '../components/BookmarkLogo';

export default function ResetPasswordScreen() {
  const { clearRecovery } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset() {
    if (password.length < 6) {
      setError('パスワードは6文字以上で設定してください。');
      return;
    }
    if (password !== confirm) {
      setError('確認用パスワードが一致しません。');
      return;
    }
    setLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) {
      setError('パスワードの変更に失敗しました。もう一度お試しください。');
      return;
    }
    clearRecovery();
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
            <Text style={s.welcomeLabel}>Password Reset</Text>
            <Text style={s.tagline}>新しいパスワードを{'\n'}設定してください。</Text>

            <View style={s.inputGroup}>
              <Text style={s.inputLabel}>NEW PASSWORD</Text>
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="6文字以上"
                placeholderTextColor={C.muted2}
                autoFocus
              />
            </View>

            <View style={[s.inputGroup, { marginBottom: 44 }]}>
              <Text style={s.inputLabel}>CONFIRM PASSWORD</Text>
              <TextInput
                style={s.input}
                value={confirm}
                onChangeText={setConfirm}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="もう一度入力"
                placeholderTextColor={C.muted2}
              />
            </View>

            {error && <Text style={s.error}>{error}</Text>}

            <TouchableOpacity
              style={[s.button, (password.length < 6 || confirm.length < 6 || loading) && s.buttonDisabled]}
              onPress={handleReset}
              disabled={password.length < 6 || confirm.length < 6 || loading}
              activeOpacity={0.8}
            >
              {loading
                ? <ActivityIndicator color={C.paper} />
                : <Text style={s.buttonText}>SET PASSWORD</Text>}
            </TouchableOpacity>
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
    alignItems: 'center', justifyContent: 'center',
  },
  buttonDisabled: { opacity: 0.5 },
  buttonText: {
    fontFamily: F.zenMed, fontSize: 13, letterSpacing: 2.5,
    color: C.paper, textTransform: 'uppercase',
  },
});
