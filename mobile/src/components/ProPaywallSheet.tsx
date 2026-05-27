import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import { BottomSheet } from './BottomSheet';
import { useSubscription } from '../contexts/SubscriptionContext';
import { C, F } from '../lib/colors';

type Props = {
  visible: boolean;
  onClose: () => void;
};

const BENEFITS = [
  '本棚の冊数が無制限',
  'タグが無制限に作れる',
  '統計が全期間表示',
  'セッション履歴が無制限',
];

export function ProPaywallSheet({ visible, onClose }: Props) {
  const { purchaseMonthly, purchaseYearly, restorePurchases } = useSubscription();
  const [buying, setBuying] = useState<'monthly' | 'yearly' | null>(null);
  const [restoring, setRestoring] = useState(false);

  async function handleMonthly() {
    setBuying('monthly');
    await purchaseMonthly();
    setBuying(null);
    onClose();
  }

  async function handleYearly() {
    setBuying('yearly');
    await purchaseYearly();
    setBuying(null);
    onClose();
  }

  async function handleRestore() {
    setRestoring(true);
    await restorePurchases();
    setRestoring(false);
    onClose();
  }

  const busy = buying !== null || restoring;

  return (
    <BottomSheet visible={visible} onClose={onClose} sheetStyle={s.sheet} disableClose={busy}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.badge}>
          <Text style={s.badgeText}>PRO</Text>
        </View>
        <Text style={s.title}>デジタル栞 Pro</Text>
        <Text style={s.subtitle}>読書体験をもっと自由に</Text>
      </View>

      {/* Benefits */}
      <View style={s.benefits}>
        {BENEFITS.map((b) => (
          <View key={b} style={s.benefitRow}>
            <Svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <Circle cx="7" cy="7" r="7" fill={C.ink} />
              <Path d="M4 7l2 2 4-4" stroke={C.paper} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={s.benefitText}>{b}</Text>
          </View>
        ))}
      </View>

      {/* Yearly button (recommended) */}
      <TouchableOpacity
        style={[s.yearlyBtn, busy && { opacity: 0.5 }]}
        onPress={handleYearly}
        disabled={busy}
        activeOpacity={0.8}
      >
        {buying === 'yearly'
          ? <ActivityIndicator color={C.paper} />
          : (
            <View style={s.yearlyBtnInner}>
              <Text style={s.yearlyBtnText}>年額 ¥2,400</Text>
              <View style={s.saveBadge}><Text style={s.saveBadgeText}>2ヶ月分お得</Text></View>
            </View>
          )}
      </TouchableOpacity>

      {/* Monthly button */}
      <TouchableOpacity
        style={[s.monthlyBtn, busy && { opacity: 0.5 }]}
        onPress={handleMonthly}
        disabled={busy}
        activeOpacity={0.8}
      >
        {buying === 'monthly'
          ? <ActivityIndicator color={C.ink} />
          : <Text style={s.monthlyBtnText}>月額 ¥360</Text>}
      </TouchableOpacity>

      {/* Restore */}
      <TouchableOpacity onPress={handleRestore} disabled={busy} hitSlop={8} style={s.restoreRow}>
        {restoring
          ? <ActivityIndicator size="small" color={C.muted2} />
          : <Text style={s.restoreText}>購入を復元</Text>}
      </TouchableOpacity>
    </BottomSheet>
  );
}

const s = StyleSheet.create({
  sheet: {
    backgroundColor: C.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 28, paddingBottom: 48,
  },
  header: { alignItems: 'center', marginBottom: 24 },
  badge: {
    backgroundColor: C.ink, paddingHorizontal: 10, paddingVertical: 3,
    borderRadius: 99, marginBottom: 12,
  },
  badgeText: { fontFamily: F.zen, fontSize: 10, letterSpacing: 2.5, color: C.paper },
  title: { fontFamily: F.shippori, fontSize: 24, color: C.ink, marginBottom: 6 },
  subtitle: { fontFamily: F.zen, fontSize: 12, color: C.muted },
  benefits: { marginBottom: 24, gap: 12 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  benefitText: { fontFamily: F.zen, fontSize: 13, color: C.ink2 },
  yearlyBtn: {
    height: 54, backgroundColor: C.ink, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  yearlyBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  yearlyBtnText: { fontFamily: F.zenMed, fontSize: 15, letterSpacing: 1, color: C.paper },
  saveBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99,
  },
  saveBadgeText: { fontFamily: F.zen, fontSize: 10, color: C.paper },
  monthlyBtn: {
    height: 50, borderWidth: 1, borderColor: C.line, borderRadius: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  monthlyBtnText: { fontFamily: F.zen, fontSize: 13, letterSpacing: 1, color: C.ink },
  restoreRow: { alignItems: 'center' },
  restoreText: { fontFamily: F.zen, fontSize: 11, color: C.muted2, textDecorationLine: 'underline' },
});
