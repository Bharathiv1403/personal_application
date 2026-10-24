import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
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

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

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
