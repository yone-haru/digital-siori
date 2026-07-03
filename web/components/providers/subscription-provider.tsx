"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ErrorCode,
  Purchases,
  PurchasesError,
  type Package,
} from "@revenuecat/purchases-js";
import { useAuth } from "@/components/providers/auth-provider";
import { ProPaywallSheet } from "@/components/pro/pro-paywall-sheet";

/** RevenueCat のエンタイトルメント ID。mobile と同一 */
const ENTITLEMENT = "pro";
const WEB_KEY = process.env.NEXT_PUBLIC_REVENUECAT_WEB_KEY ?? "";

type SubscriptionContextType = {
  isPro: boolean;
  loading: boolean;
  /** Web Billing の API キーが設定されていて購入可能か */
  canPurchase: boolean;
  paywallOpen: boolean;
  openPaywall: () => void;
  closePaywall: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isPro: false,
  loading: true,
  canPurchase: false,
  paywallOpen: false,
  openPaywall: () => {},
  closePaywall: () => {},
});

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [paywallOpen, setPaywallOpen] = useState(false);
  const purchasesRef = useRef<Purchases | null>(null);

  useEffect(() => {
    if (!WEB_KEY || !user) {
      setIsPro(false);
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        let purchases = purchasesRef.current;
        if (!purchases) {
          purchases = Purchases.configure({ apiKey: WEB_KEY, appUserId: user!.id });
          purchasesRef.current = purchases;
        } else {
          await purchases.changeUser(user!.id);
        }
        const info = await purchases.getCustomerInfo();
        if (!cancelled) setIsPro(!!info.entitlements.active[ENTITLEMENT]);
      } catch {
        // 取得失敗時は無料扱い（次回リロードで再判定される）
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();
    return () => { cancelled = true; };
  }, [user?.id]);

  const refresh = useCallback(async () => {
    const purchases = purchasesRef.current;
    if (!purchases) return;
    try {
      const info = await purchases.getCustomerInfo();
      setIsPro(!!info.entitlements.active[ENTITLEMENT]);
    } catch {
      // noop
    }
  }, []);

  const purchase = useCallback(async (plan: "monthly" | "yearly") => {
    const purchases = purchasesRef.current;
    if (!purchases) return;
    const identifier = plan === "monthly" ? "$rc_monthly" : "$rc_annual";
    try {
      const offerings = await purchases.getOfferings();
      const current = offerings.current;
      if (!current) throw new Error("オファリングが見つかりません");
      const pkg: Package =
        current.availablePackages.find((p) => p.identifier === identifier) ??
        current.availablePackages[0];
      const result = await purchases.purchase({
        rcPackage: pkg,
        customerEmail: user?.email,
        selectedLocale: "ja",
      });
      setIsPro(!!result.customerInfo.entitlements.active[ENTITLEMENT]);
    } catch (e) {
      if (e instanceof PurchasesError && e.errorCode === ErrorCode.UserCancelledError) return;
      window.alert(e instanceof Error ? `購入エラー: ${e.message}` : "購入に失敗しました");
    }
  }, [user?.email]);

  const openPaywall = useCallback(() => setPaywallOpen(true), []);
  const closePaywall = useCallback(() => setPaywallOpen(false), []);

  const value = useMemo(
    () => ({
      isPro,
      loading,
      canPurchase: !!WEB_KEY,
      paywallOpen,
      openPaywall,
      closePaywall,
    }),
    [isPro, loading, paywallOpen, openPaywall, closePaywall],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <ProPaywallSheet
        open={paywallOpen}
        canPurchase={!!WEB_KEY}
        onClose={closePaywall}
        onPurchase={purchase}
        onRefresh={refresh}
      />
    </SubscriptionContext.Provider>
  );
}

export const useSubscription = () => useContext(SubscriptionContext);
