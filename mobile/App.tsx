import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import {
  useFonts,
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
} from '@expo-google-fonts/cormorant-garamond';
import {
  ShipporiMincho_500Medium,
  ShipporiMincho_600SemiBold,
} from '@expo-google-fonts/shippori-mincho';
import {
  ZenKakuGothicNew_400Regular,
  ZenKakuGothicNew_500Medium,
} from '@expo-google-fonts/zen-kaku-gothic-new';
import Svg, { Rect, Circle, Path } from 'react-native-svg';

import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { SubscriptionProvider, useSubscription } from './src/contexts/SubscriptionContext';
import { ProPaywallSheet } from './src/components/ProPaywallSheet';
import { supabase } from './src/lib/supabase';
import { C, F } from './src/lib/colors';
import type { RootStackParamList, AuthStackParamList, MainTabParamList } from './src/types/navigation';

import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ShelfScreen from './src/screens/ShelfScreen';
import AddBookScreen from './src/screens/AddBookScreen';
import StatsScreen from './src/screens/StatsScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import ReadingTimerScreen from './src/screens/ReadingTimerScreen';
import AccountScreen from './src/screens/AccountScreen';
import ResetPasswordScreen from './src/screens/ResetPasswordScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

function LibraryIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <Rect x="3" y="2" width="7" height="18" rx="1" stroke={color} strokeWidth="1.4" />
      <Rect x="12" y="5" width="7" height="15" rx="1" stroke={color} strokeWidth="1.4" />
    </Svg>
  );
}

function AddIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <Circle cx="11" cy="11" r="9" stroke={color} strokeWidth="1.4" />
      <Path d="M11 7v8M7 11h8" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </Svg>
  );
}

function StatsIcon({ color }: { color: string }) {
  return (
    <Svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <Rect x="3" y="12" width="4" height="8" rx="0.5" stroke={color} strokeWidth="1.4" />
      <Rect x="9" y="7" width="4" height="13" rx="0.5" stroke={color} strokeWidth="1.4" />
      <Rect x="15" y="3" width="4" height="17" rx="0.5" stroke={color} strokeWidth="1.4" />
    </Svg>
  );
}

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
    </AuthStack.Navigator>
  );
}

function MainNavigator() {
  return (
    <MainTab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.paper,
          borderTopColor: C.line,
          borderTopWidth: 1,
          height: 60,
        },
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: C.muted2,
        tabBarLabelStyle: {
          fontFamily: F.zen,
          fontSize: 9,
          letterSpacing: 2,
          textTransform: 'uppercase',
          marginBottom: 6,
        },
        tabBarIconStyle: { marginTop: 6 },
      }}
    >
      <MainTab.Screen
        name="Shelf"
        component={ShelfScreen}
        options={{ tabBarLabel: 'LIBRARY', tabBarIcon: ({ color }) => <LibraryIcon color={color} /> }}
      />
      <MainTab.Screen
        name="Add"
        component={AddBookScreen}
        options={{ tabBarLabel: 'ADD', tabBarIcon: ({ color }) => <AddIcon color={color} /> }}
      />
      <MainTab.Screen
        name="Stats"
        component={StatsScreen}
        options={{ tabBarLabel: 'STATS', tabBarIcon: ({ color }) => <StatsIcon color={color} /> }}
      />
    </MainTab.Navigator>
  );
}

function GlobalPaywallSheet() {
  const { paywallOpen, closePaywall } = useSubscription();
  return <ProPaywallSheet visible={paywallOpen} onClose={closePaywall} />;
}

function RootNavigator() {
  const { user, loading, isRecovering } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false, gestureEnabled: true }}>
      {isRecovering ? (
        <RootStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      ) : user ? (
        <>
          <RootStack.Screen name="Main" component={MainNavigator} />
          <RootStack.Screen name="BookDetail" component={BookDetailScreen} />
          <RootStack.Screen
            name="ReadingTimer"
            component={ReadingTimerScreen}
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <RootStack.Screen name="Account" component={AccountScreen} />
        </>
      ) : (
        <RootStack.Screen name="Auth" component={AuthNavigator} />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  useEffect(() => {
    async function handleUrl(url: string) {
      try { await supabase.auth.exchangeCodeForSession(url); } catch {}
    }
    Linking.getInitialURL().then(url => { if (url) handleUrl(url); });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    ShipporiMincho_500Medium,
    ShipporiMincho_600SemiBold,
    ZenKakuGothicNew_400Regular,
    ZenKakuGothicNew_500Medium,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={C.ink} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <SubscriptionProvider>
          <NavigationContainer>
            <RootNavigator />
          </NavigationContainer>
          <GlobalPaywallSheet />
          <StatusBar style="dark" />
        </SubscriptionProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
