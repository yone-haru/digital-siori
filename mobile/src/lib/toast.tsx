import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, F } from './colors';

type ToastType = 'success' | 'error';
type ToastState = { message: string; type: ToastType } | null;

type ToastContextType = {
  showToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType>({ showToast: () => {} });

const DANGER = '#C77B6F';

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setToast({ message, type });
    Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    hideTimer.current = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }).start(
        () => setToast(null),
      );
    }, 2800);
  }, [opacity]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            s.toast,
            { opacity, bottom: 72 + insets.bottom },
            toast.type === 'error' && s.toastError,
          ]}
        >
          <Text style={s.text}>{toast.message}</Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

const s = StyleSheet.create({
  toast: {
    position: 'absolute', left: 20, right: 20,
    backgroundColor: C.ink, borderRadius: 2,
    paddingHorizontal: 18, paddingVertical: 13,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22, shadowRadius: 24, elevation: 10,
  },
  toastError: { backgroundColor: DANGER },
  text: { fontFamily: F.zen, fontSize: 12, color: C.paper, textAlign: 'center' },
});
