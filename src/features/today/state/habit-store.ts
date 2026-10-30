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

const DEFAULT_HABITS: HabitItem[] = [];

export const useHabitStore = create<HabitState>()(
  persist(
    (set, get) => ({
      habits: DEFAULT_HABITS,

      isHabitDoneToday: (habit: HabitItem): boolean => {
        const todayStr = getTodayDateStr();
        return habit.completedDates.includes(todayStr);
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
        const yesterdayStr = getYesterdayDateStr();

        const updated = get().habits.map((habit) => {
          if (habit.id !== id) return habit;

          const isAlreadyDone = habit.completedDates.includes(todayStr);

          if (isAlreadyDone) {
            // Uncheck today
            const filteredDates = habit.completedDates.filter((d) => d !== todayStr);
            const newStreak = Math.max(0, habit.currentStreak - 1);
            return {
              ...habit,
              completedDates: filteredDates,
              currentStreak: newStreak,
            };
          } else {
            // Mark done for today!
            const newDates = [...habit.completedDates, todayStr];
            const wasDoneYesterday = habit.completedDates.includes(yesterdayStr);
            const newStreak = wasDoneYesterday ? habit.currentStreak + 1 : 1;
            const newLongest = Math.max(habit.longestStreak, newStreak);

            return {
              ...habit,
              completedDates: newDates,
              currentStreak: newStreak,
              longestStreak: newLongest,
            };
          }
        });

        set({ habits: updated });
      },
    }),
    {
      name: 'personal-app:habit-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
