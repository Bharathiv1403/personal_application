import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface HabitItem {
  id: string;
  title: string;
  icon: string; // e.g. 'code-slash', 'book', 'flame', 'walk', 'water'
  currentStreak: number;
  longestStreak: number;
  completedDates: string[]; // ['2026-10-28', '2026-10-29', '2026-10-30']
  createdAt: string;
}

interface HabitState {
  habits: HabitItem[];
  addHabit: (title: string, icon: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabitToday: (id: string) => void;
  isHabitDoneToday: (habit: HabitItem) => boolean;
  getLiveStreak: (habit: HabitItem) => number;
}

const getTodayDateStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getYesterdayDateStr = (): string => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const computeHabitStreak = (completedDates: string[]): number => {
  if (!completedDates || completedDates.length === 0) return 0;
  const set = new Set(completedDates);

  const todayStr = getTodayDateStr();
  const yesterdayStr = getYesterdayDateStr();

  let streak = 0;
  let checkDate = new Date();

  // If today is completed, streak starts at 1, check backward
  if (set.has(todayStr)) {
    streak = 1;
    checkDate.setDate(checkDate.getDate() - 1);
  } else if (set.has(yesterdayStr)) {
    // If today is not done yet, but yesterday was done, current streak is alive from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // Neither today nor yesterday was done -> consecutive streak is 0 (broken)
    return 0;
  }

  // Count backwards consecutive days
  while (true) {
    const dStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (set.has(dStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
};

const DEFAULT_HABITS: HabitItem[] = [];

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: DEFAULT_HABITS,

      isHabitDoneToday: (habit: HabitItem): boolean => {
        const todayStr = getTodayDateStr();
        return habit.completedDates.includes(todayStr);
      },

      getLiveStreak: (habit: HabitItem): number => {
        return computeHabitStreak(habit.completedDates);
      },

      addHabit: (title, icon) => {
        const newHabit: HabitItem = {
          id: 'h_' + Date.now(),
          title: title.trim(),
          icon,
          currentStreak: 0,
          longestStreak: 0,
          completedDates: [],
          createdAt: getTodayDateStr(),
        };
        set({ habits: [...get().habits, newHabit] });
      },

      deleteHabit: (id) => {
        set({ habits: get().habits.filter((h) => h.id !== id) });
      },

      toggleHabitToday: (id) => {
        const todayStr = getTodayDateStr();

        const updated = get().habits.map((habit) => {
          if (habit.id !== id) return habit;

          const isAlreadyDone = habit.completedDates.includes(todayStr);
          const newDates = isAlreadyDone
            ? habit.completedDates.filter((d) => d !== todayStr)
            : [...habit.completedDates, todayStr];

          const newStreak = computeHabitStreak(newDates);
          const newLongest = Math.max(habit.longestStreak, newStreak);

          return {
            ...habit,
            completedDates: newDates,
            currentStreak: newStreak,
            longestStreak: newLongest,
          };
        });

        set({ habits: updated });
      },
    }),
    {
      name: 'personal-app:habit-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.habits = state.habits.map((h) => ({
            ...h,
            currentStreak: computeHabitStreak(h.completedDates),
          }));
        }
      },
    }
  )
);
