import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { BottomTabNavigator } from './BottomTabNavigator';
import { SignUpScreen } from '@/features/auth/screens/SignUpScreen';
import { SignInScreen } from '@/features/auth/screens/SignInScreen';
import { OnboardingScreen } from '@/features/auth/screens/OnboardingScreen';
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';
import { TodoListScreen } from '@/features/todo/screens/TodoListScreen';
import { useAuthStore } from '@/features/auth/state/auth-store';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { NotificationService } from '@/core/utils/notification-service';
import { Colors } from '@/core/design-system/tokens/colors';

const Stack = createNativeStackNavigator<RootStackParamList>();

const DarkNavigationTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
  },
};

export const RootNavigator: React.FC = () => {
  const isLoading = useAuthStore((s) => s.isLoading);
  const hasAccount = useAuthStore((s) => s.hasAccount);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasCompletedOnboarding = useAuthStore((s) => s.hasCompletedOnboarding);
  const initializeAuth = useAuthStore((s) => s.initializeAuth);
  const initializeAiConfig = useAiConfigStore((s) => s.initialize);

  const backgroundTimeRef = useRef<number | null>(null);

  useEffect(() => {
    initializeAuth();
    initializeAiConfig();

    NotificationService.requestPermissions().then((granted) => {
      if (granted) {
        NotificationService.scheduleDailyBriefing();
      }
    });

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'background' || nextState === 'inactive') {
        backgroundTimeRef.current = Date.now();
      } else if (nextState === 'active') {
        if (backgroundTimeRef.current) {
          const elapsed = (Date.now() - backgroundTimeRef.current) / 1000;
          const timeout = useAuthStore.getState().autoLockTimeout ?? 300;
          // Auto-lock vault if app was in background beyond user timeout (-1 means never)
          if (timeout !== -1 && elapsed >= timeout && useAuthStore.getState().isAuthenticated) {
            useAuthStore.getState().signOut();
          }
        }
        backgroundTimeRef.current = null;
      }
    });

    return () => {
      subscription.remove();
    };
  }, [initializeAuth, initializeAiConfig]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={DarkNavigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
          animation: 'fade',
        }}
      >
        {!hasAccount ? (
          // First time user: Sign up & create vault
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        ) : !isAuthenticated ? (
          // Returning user: Lock screen with PIN & Biometrics
          <Stack.Screen name="SignIn" component={SignInScreen} />
        ) : !hasCompletedOnboarding ? (
          // First time after sign-up: Career, resume & goal onboarding wizard
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        ) : (
          // Authenticated: Main App + Settings + Todo
          <>
            <Stack.Screen name="MainTabs" component={BottomTabNavigator} />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="TodoList"
              component={TodoListScreen}
              options={{ animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
