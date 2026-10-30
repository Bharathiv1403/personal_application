import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';

const USER_PROFILE_KEY = '@nova:user_profile';
const PIN_SECURE_KEY = 'nova_user_security_pin';
const BIOMETRIC_ENABLED_KEY = '@nova:biometric_enabled';
const ONBOARDING_COMPLETED_KEY = '@nova:onboarding_completed_v1';
const AUTO_LOCK_TIMEOUT_KEY = '@nova:auto_lock_timeout';

export interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
  photoUrl?: string;
  authProvider?: 'local' | 'google';
}

interface AuthState {
  user: UserProfile | null;
  hasAccount: boolean;
  isAuthenticated: boolean;
  isBiometricSupported: boolean;
  isBiometricEnabled: boolean;
  hasCompletedOnboarding: boolean;
  isLoading: boolean;
  autoLockTimeout: number; // in seconds: 0 = immediate, 60 = 1m, 300 = 5m, 900 = 15m, -1 = never

  // Actions
  initializeAuth: () => Promise<void>;
  signUp: (name: string, email: string, pin: string, enableBiometrics: boolean) => Promise<boolean>;
  signInWithGoogle: (googleUser: { name: string; email: string; photoUrl?: string }, customPin?: string) => Promise<boolean>;
  updatePin: (newPin: string) => Promise<boolean>;
  signInWithPin: (pin: string) => Promise<boolean>;
  signInWithBiometrics: () => Promise<boolean>;
  completeOnboarding: () => Promise<void>;
  setAutoLockTimeout: (seconds: number) => Promise<void>;
  signOut: () => void;
  resetAccount: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  hasAccount: false,
  isAuthenticated: false,
  isBiometricSupported: false,
  isBiometricEnabled: false,
  hasCompletedOnboarding: false,
  isLoading: true,
  autoLockTimeout: 300,

  initializeAuth: async () => {
    try {
      // 1. Check biometric hardware
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      const biometricSupported = hasHardware && isEnrolled;

      // 2. Load stored profile & onboarding state
      const storedProfile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      const storedBiometricPref = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
      const storedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);
      const storedAutoLock = await AsyncStorage.getItem(AUTO_LOCK_TIMEOUT_KEY);
      const isBioEnabled = storedBiometricPref === 'true';
      const isOnboardingDone = storedOnboarding === 'true';
      const autoLockSec = storedAutoLock ? parseInt(storedAutoLock, 10) : 300;

      if (storedProfile) {
        const parsedUser: UserProfile = JSON.parse(storedProfile);
        set({
          user: parsedUser,
          hasAccount: true,
          isAuthenticated: false,
          isBiometricSupported: biometricSupported,
          isBiometricEnabled: isBioEnabled,
          hasCompletedOnboarding: isOnboardingDone,
          isLoading: false,
          autoLockTimeout: autoLockSec,
        });

        // Auto trigger biometric prompt if enabled
        if (biometricSupported && isBioEnabled) {
          get().signInWithBiometrics();
        }
      } else {
        set({
          user: null,
          hasAccount: false,
          isAuthenticated: false,
          isBiometricSupported: biometricSupported,
          isBiometricEnabled: false,
          hasCompletedOnboarding: false,
          isLoading: false,
        });
      }
    } catch (e) {
      console.warn('[AuthStore] Init failed:', e);
      set({ isLoading: false });
    }
  },

  signUp: async (name, email, pin, enableBiometrics) => {
    try {
      const profile: UserProfile = {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        createdAt: new Date().toISOString(),
        authProvider: 'local',
      };

      await SecureStore.setItemAsync(PIN_SECURE_KEY, pin);
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, enableBiometrics ? 'true' : 'false');

      // Sync active identity to Career Profile
      try {
        const { useCandidateProfileStore } = require('../../career/state/candidate-profile-store');
        useCandidateProfileStore.getState().syncWithAuthUser(profile.name, profile.email);
      } catch (e) {
        console.warn('[AuthStore] syncWithAuthUser failed in signUp:', e);
      }

      set({
        user: profile,
        hasAccount: true,
        isAuthenticated: true,
        isBiometricEnabled: enableBiometrics,
        hasCompletedOnboarding: false,
      });

      return true;
    } catch (err) {
      console.error('[AuthStore] SignUp failed:', err);
      return false;
    }
  },

  signInWithGoogle: async (googleUser, customPin) => {
    try {
      const profile: UserProfile = {
        name: googleUser.name,
        email: googleUser.email.toLowerCase(),
        createdAt: new Date().toISOString(),
        photoUrl: googleUser.photoUrl,
        authProvider: 'google',
      };

      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
      if (customPin && customPin.length >= 4) {
        await SecureStore.setItemAsync(PIN_SECURE_KEY, customPin);
      }

      // Sync active identity to Career Profile
      try {
        const { useCandidateProfileStore } = require('../../career/state/candidate-profile-store');
        useCandidateProfileStore.getState().syncWithAuthUser(profile.name, profile.email);
      } catch (e) {
        console.warn('[AuthStore] syncWithAuthUser failed in signInWithGoogle:', e);
      }

      const storedOnboarding = await AsyncStorage.getItem(ONBOARDING_COMPLETED_KEY);

      set({
        user: profile,
        hasAccount: true,
        isAuthenticated: true,
        hasCompletedOnboarding: storedOnboarding === 'true',
      });

      return true;
    } catch (err) {
      console.error('[AuthStore] Google SignIn failed:', err);
      return false;
    }
  },

  updatePin: async (newPin: string) => {
    try {
      if (!newPin || newPin.length < 4) return false;
      await SecureStore.setItemAsync(PIN_SECURE_KEY, newPin);
      return true;
    } catch (e) {
      console.error('[AuthStore] updatePin error:', e);
      return false;
    }
  },

  completeOnboarding: async () => {
    await AsyncStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
    set({ hasCompletedOnboarding: true });
  },

  signInWithPin: async (pin: string) => {
    try {
      const storedPin = await SecureStore.getItemAsync(PIN_SECURE_KEY);
      if (storedPin && storedPin === pin) {
        set({ isAuthenticated: true });
        return true;
      }
      return false;
    } catch (e) {
      console.error('[AuthStore] PIN check error:', e);
      return false;
    }
  },

  signInWithBiometrics: async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock AAYON Vault',
        fallbackLabel: 'Use 4-digit PIN',
        disableDeviceFallback: false,
      });

      if (result.success) {
        set({ isAuthenticated: true });
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[AuthStore] Biometric auth error:', err);
      return false;
    }
  },

  setAutoLockTimeout: async (seconds: number) => {
    try {
      await AsyncStorage.setItem(AUTO_LOCK_TIMEOUT_KEY, seconds.toString());
      set({ autoLockTimeout: seconds });
    } catch (e) {
      console.warn('[AuthStore] Failed to save auto-lock timeout:', e);
    }
  },

  signOut: () => {
    set({ isAuthenticated: false });
  },

  resetAccount: async () => {
    try {
      await SecureStore.deleteItemAsync(PIN_SECURE_KEY);
      await AsyncStorage.removeItem(USER_PROFILE_KEY);
      await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
      await AsyncStorage.removeItem(ONBOARDING_COMPLETED_KEY);

      // Wipe candidate profile storage
      try {
        const { useCandidateProfileStore } = require('../../career/state/candidate-profile-store');
        useCandidateProfileStore.getState().resetProfile();
      } catch (e) {
        console.warn('[AuthStore] resetProfile failed:', e);
      }
      await AsyncStorage.removeItem('aayon:candidate-profile-v3');
      await AsyncStorage.removeItem('personal-app:candidate-profile-v2');

      set({
        user: null,
        hasAccount: false,
        isAuthenticated: false,
        hasCompletedOnboarding: false,
      });
    } catch (err) {
      console.error('[AuthStore] Reset account failed:', err);
    }
  },
}));
