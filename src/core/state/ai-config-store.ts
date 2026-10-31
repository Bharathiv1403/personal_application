import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SECURE_GEMINI_KEY = 'aayon_sec_gemini_key';
const SECURE_GROQ_KEY = 'aayon_sec_groq_key';
const SECURE_OPENROUTER_KEY = 'aayon_sec_openrouter_key';
const PREFERRED_PROVIDER_KEY = '@aayon:ai_preferred_provider';

export interface AiConfigState {
  geminiKey: string;
  groqKey: string;
  openrouterKey: string;
  preferredProvider: 'gemini' | 'groq' | 'openrouter' | 'auto';
  isInitialized: boolean;
  isConfigured: boolean;

  // Actions
  initialize: () => Promise<void>;
  saveGeminiKey: (key: string) => Promise<boolean>;
  saveGroqKey: (key: string) => Promise<boolean>;
  saveOpenRouterKey: (key: string) => Promise<boolean>;
  removeKey: (provider: 'gemini' | 'groq' | 'openrouter') => Promise<void>;
  setPreferredProvider: (provider: 'gemini' | 'groq' | 'openrouter' | 'auto') => Promise<void>;
  testApiKey: (provider: 'gemini' | 'groq' | 'openrouter', key: string) => Promise<{ success: boolean; message: string }>;
}

export const useAiConfigStore = create<AiConfigState>((set, get) => ({
  geminiKey: '',
  groqKey: '',
  openrouterKey: '',
  preferredProvider: 'auto',
  isInitialized: false,
  isConfigured: false,

  initialize: async () => {
    try {
      let storedGemini = '';
      let storedGroq = '';
      let storedOpenRouter = '';

      try {
        storedGemini = (await SecureStore.getItemAsync(SECURE_GEMINI_KEY)) || '';
        storedGroq = (await SecureStore.getItemAsync(SECURE_GROQ_KEY)) || '';
        storedOpenRouter = (await SecureStore.getItemAsync(SECURE_OPENROUTER_KEY)) || '';
      } catch {
        // Fallback to AsyncStorage on environments without hardware secure enclave
        storedGemini = (await AsyncStorage.getItem(SECURE_GEMINI_KEY)) || '';
        storedGroq = (await AsyncStorage.getItem(SECURE_GROQ_KEY)) || '';
        storedOpenRouter = (await AsyncStorage.getItem(SECURE_OPENROUTER_KEY)) || '';
      }

      const storedPref = (await AsyncStorage.getItem(PREFERRED_PROVIDER_KEY)) as 'gemini' | 'groq' | 'openrouter' | 'auto' | null;

      // Also consider environment fallback if developer key exists
      const effectiveGemini = storedGemini || process.env.EXPO_PUBLIC_GEMINI_API_KEY || '';
      const effectiveGroq = storedGroq || process.env.EXPO_PUBLIC_GROQ_API_KEY || '';
      const effectiveOpenRouter = storedOpenRouter || process.env.EXPO_PUBLIC_OPENROUTER_API_KEY || '';

      const isConfigured = Boolean(
        (effectiveGemini && !effectiveGemini.includes('your_')) ||
        (effectiveGroq && !effectiveGroq.includes('your_')) ||
        (effectiveOpenRouter && !effectiveOpenRouter.includes('your_'))
      );

      set({
        geminiKey: storedGemini,
        groqKey: storedGroq,
        openrouterKey: storedOpenRouter,
        preferredProvider: storedPref || 'auto',
        isInitialized: true,
        isConfigured,
      });
    } catch (e) {
      console.warn('[AiConfigStore] Init failed:', e);
      set({ isInitialized: true });
    }
  },

  saveGeminiKey: async (rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return false;

    try {
      try {
        await SecureStore.setItemAsync(SECURE_GEMINI_KEY, key);
      } catch {
        await AsyncStorage.setItem(SECURE_GEMINI_KEY, key);
      }

      set((state) => ({
        geminiKey: key,
        isConfigured: true,
      }));
      return true;
    } catch (err) {
      console.error('[AiConfigStore] Failed to save Gemini key:', err);
      return false;
    }
  },

  saveGroqKey: async (rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return false;

    try {
      try {
        await SecureStore.setItemAsync(SECURE_GROQ_KEY, key);
      } catch {
        await AsyncStorage.setItem(SECURE_GROQ_KEY, key);
      }

      set((state) => ({
        groqKey: key,
        isConfigured: true,
      }));
      return true;
    } catch (err) {
      console.error('[AiConfigStore] Failed to save Groq key:', err);
      return false;
    }
  },

  saveOpenRouterKey: async (rawKey: string) => {
    const key = rawKey.trim();
    if (!key) return false;

    try {
      try {
        await SecureStore.setItemAsync(SECURE_OPENROUTER_KEY, key);
      } catch {
        await AsyncStorage.setItem(SECURE_OPENROUTER_KEY, key);
      }

      set((state) => ({
        openrouterKey: key,
        isConfigured: true,
      }));
      return true;
    } catch (err) {
      console.error('[AiConfigStore] Failed to save OpenRouter key:', err);
      return false;
    }
  },

  removeKey: async (provider: 'gemini' | 'groq' | 'openrouter') => {
    try {
      if (provider === 'gemini') {
        try {
          await SecureStore.deleteItemAsync(SECURE_GEMINI_KEY);
        } catch {
          await AsyncStorage.removeItem(SECURE_GEMINI_KEY);
        }
        set((state) => {
          const hasOther = Boolean(state.groqKey || state.openrouterKey || process.env.EXPO_PUBLIC_GROQ_API_KEY);
          return { geminiKey: '', isConfigured: hasOther };
        });
      } else if (provider === 'groq') {
        try {
          await SecureStore.deleteItemAsync(SECURE_GROQ_KEY);
        } catch {
          await AsyncStorage.removeItem(SECURE_GROQ_KEY);
        }
        set((state) => {
          const hasOther = Boolean(state.geminiKey || state.openrouterKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY);
          return { groqKey: '', isConfigured: hasOther };
        });
      } else {
        try {
          await SecureStore.deleteItemAsync(SECURE_OPENROUTER_KEY);
        } catch {
          await AsyncStorage.removeItem(SECURE_OPENROUTER_KEY);
        }
        set((state) => {
          const hasOther = Boolean(state.geminiKey || state.groqKey || process.env.EXPO_PUBLIC_GEMINI_API_KEY || process.env.EXPO_PUBLIC_GROQ_API_KEY);
          return { openrouterKey: '', isConfigured: hasOther };
        });
      }
    } catch (err) {
      console.error('[AiConfigStore] Failed to remove key:', err);
    }
  },

  setPreferredProvider: async (provider: 'gemini' | 'groq' | 'openrouter' | 'auto') => {
    await AsyncStorage.setItem(PREFERRED_PROVIDER_KEY, provider);
    set({ preferredProvider: provider });
  },

  testApiKey: async (provider: 'gemini' | 'groq' | 'openrouter', rawKey: string) => {
    const key = rawKey.trim();
    if (!key) {
      return { success: false, message: 'Please paste or enter an API key to test.' };
    }

    try {
      if (provider === 'gemini') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Respond with OK' }] }],
            }),
            signal: controller.signal,
          }
        );
        clearTimeout(timeout);

        if (res.ok) {
          return { success: true, message: 'Google Gemini 1.5 connected successfully! 🚀' };
        } else {
          const data = await res.json().catch(() => ({}));
          const errMsg = data.error?.message || `HTTP ${res.status}: Invalid Gemini API key.`;
          return { success: false, message: errMsg };
        }
      } else if (provider === 'groq') {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 7000);

        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{ role: 'user', content: 'Respond with OK' }],
            max_tokens: 5,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          return { success: true, message: 'Groq Cloud Llama-3.1 connected successfully! ⚡' };
        } else {
          const data = await res.json().catch(() => ({}));
          const errMsg = data.error?.message || `HTTP ${res.status}: Invalid Groq API key.`;
          return { success: false, message: errMsg };
        }
      } else {
        // OpenRouter
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 9000);

        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
            'HTTP-Referer': 'https://aayon.app',
            'X-Title': 'AAYON Personal OS',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3.3-70b-instruct:free',
            messages: [{ role: 'user', content: 'Respond with OK' }],
            max_tokens: 5,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        if (res.ok) {
          return { success: true, message: 'OpenRouter (DeepSeek R1 / Llama 3.3 Free) connected! 🚀' };
        } else {
          const data = await res.json().catch(() => ({}));
          const errMsg = data.error?.message || `HTTP ${res.status}: Invalid OpenRouter key.`;
          return { success: false, message: errMsg };
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, message: 'Connection timed out. Check your internet connection.' };
      }
      return { success: false, message: err?.message || 'Failed to reach AI service.' };
    }
  },
}));
