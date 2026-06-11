import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';
import { useAuth } from './AuthContext';

const isExpoGo = Constants.appOwnership === 'expo';

const ENTITLEMENT = 'pro';
const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY ?? '';
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY ?? '';

type SubscriptionContextType = {
  isPro: boolean;
  loading: boolean;
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
  purchaseMonthly: () => Promise<void>;
  purchaseYearly: () => Promise<void>;
  restorePurchases: () => Promise<void>;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPro: false,
  loading: true,
  paywallOpen: false,
  openPaywall: () => {},
  closePaywall: () => {},
  purchaseMonthly: async () => {},
  purchaseYearly: async () => {},
  restorePurchases: async () => {},
});

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);

  useEffect(() => {
    if (isExpoGo) {
      setLoading(false);
      return;
    }
    const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
    if (!apiKey) {
      setIsPro(false);
      setLoading(false);
      return;
    }
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    Purchases.configure({ apiKey });
  }, []);

  useEffect(() => {
    if (isExpoGo || !user) {
      setIsPro(false);
      setLoading(false);
      return;
    }
    const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;
    if (!apiKey) { setIsPro(false); setLoading(false); return; }

    Purchases.logIn(user.id).then(({ customerInfo }) => {
      setIsPro(!!customerInfo.entitlements.active[ENTITLEMENT]);
      setLoading(false);
    }).catch(() => setLoading(false));

    function onCustomerInfo(info: import('react-native-purchases').CustomerInfo) {
      setIsPro(!!info.entitlements.active[ENTITLEMENT]);
    }
    Purchases.addCustomerInfoUpdateListener(onCustomerInfo);
    return () => { Purchases.removeCustomerInfoUpdateListener(onCustomerInfo); };
  }, [user?.id]);

  async function getPackage(identifier: string) {
    const offerings = await Purchases.getOfferings();
    const current = offerings.current;
    if (!current) throw new Error('オファリングが見つかりません');
    return current.availablePackages.find((p) => p.identifier === identifier)
      ?? current.availablePackages[0];
  }

  async function purchaseMonthly() {
    try {
      const pkg = await getPackage('$rc_monthly');
      await Purchases.purchasePackage(pkg);
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('購入エラー', e.message ?? '購入に失敗しました');
    }
  }

  async function purchaseYearly() {
    try {
      const pkg = await getPackage('$rc_annual');
      await Purchases.purchasePackage(pkg);
    } catch (e: any) {
      if (!e.userCancelled) Alert.alert('購入エラー', e.message ?? '購入に失敗しました');
    }
  }

  async function restorePurchases() {
    try {
      const info = await Purchases.restorePurchases();
      const restored = !!info.entitlements.active[ENTITLEMENT];
      Alert.alert(restored ? '復元完了' : '復元できる購入がありません', restored ? 'Proプランが復元されました。' : undefined);
    } catch (e: any) {
      Alert.alert('エラー', e.message ?? '購入の復元に失敗しました');
    }
  }

  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const value = useMemo(() => ({
    isPro, loading, paywallOpen, openPaywall, closePaywall,
    purchaseMonthly, purchaseYearly, restorePurchases,
  }), [isPro, loading, paywallOpen, openPaywall, closePaywall]);

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
