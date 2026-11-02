import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VisualVocabularyItem } from '../data/english-curriculum';

export interface TranslationHistoryItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: 'en' | 'ta';
  targetLang: 'en' | 'ta';
  timestamp: string;
  beVerbNote?: string;
}

interface EnglishLearningState {
  currentDay: number; // default 1
  completedDays: number[];
  streakDays: number;
  totalScore: number;
  customImageCards: VisualVocabularyItem[];
  translationHistory: TranslationHistoryItem[];
  isModalOpen: boolean;

  // Actions
  openModal: () => void;
  closeModal: () => void;
  setCurrentDay: (day: number) => void;
  markDayCompleted: (day: number) => void;
  addCustomImageCard: (card: VisualVocabularyItem) => void;
  deleteCustomImageCard: (id: string) => void;
  incrementScore: (points: number) => void;
  addTranslationHistory: (item: TranslationHistoryItem) => void;
  deleteTranslationHistory: (id: string) => void;
  clearTranslationHistory: () => void;
}

export const useEnglishLearningStore = create<EnglishLearningState>()(
  persist(
    (set, get) => ({
      currentDay: 1, // Day 1 active by default
      completedDays: [],
      streakDays: 1,
      totalScore: 50,
      customImageCards: [],
      translationHistory: [],
      isModalOpen: false,

      openModal: () => set({ isModalOpen: true }),
      closeModal: () => set({ isModalOpen: false }),

      setCurrentDay: (day: number) => {
        set({ currentDay: day });
      },

      markDayCompleted: (day: number) => {
        const completed = get().completedDays;
        if (!completed.includes(day)) {
          set((state) => ({
            completedDays: [...state.completedDays, day],
            streakDays: state.streakDays + 1,
            totalScore: state.totalScore + 100,
          }));
        }
      },

      addCustomImageCard: (card: VisualVocabularyItem) => {
        set((state) => ({
          customImageCards: [card, ...state.customImageCards],
          totalScore: state.totalScore + 25,
        }));
      },

      deleteCustomImageCard: (id: string) => {
        set((state) => ({
          customImageCards: state.customImageCards.filter((c) => c.id !== id),
        }));
      },

      incrementScore: (points: number) => {
        set((state) => ({ totalScore: state.totalScore + points }));
      },

      addTranslationHistory: (item: TranslationHistoryItem) => {
        set((state) => ({
          translationHistory: [
            item,
            ...state.translationHistory.filter((h) => h.sourceText !== item.sourceText),
          ].slice(0, 30), // keep latest 30
          totalScore: state.totalScore + 5,
        }));
      },

      deleteTranslationHistory: (id: string) => {
        set((state) => ({
          translationHistory: state.translationHistory.filter((h) => h.id !== id),
        }));
      },

      clearTranslationHistory: () => {
        set({ translationHistory: [] });
      },
    }),
    {
      name: 'personal-app:english-daily-guide-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
