import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DayStepData {
  dayLabel: string;
  steps: number;
  goal: number;
}

interface HealthState {
  todaySteps: number;
  stepGoal: number;
  waterIntakeMl: number;
  waterGoalMl: number;
  sleepHours: number;
  sleepQuality: 'Restful' | 'Good' | 'Disturbed';
  lastNightBedtime: string;
  lastNightWakeTime: string;
  weeklyStepsHistory: DayStepData[];

  // Computed Values
  caloriesBurnedKcal: number;
  distanceKm: number;
  activeMoveMinutes: number;

  // Actions
  addLiveSteps: (deltaSteps: number) => void;
  setTodaySteps: (totalSteps: number) => void;
  setStepGoal: (goal: number) => void;
  addWater: (amountMl: number) => void;
  resetDailyWater: () => void;
  logSleep: (hours: number, quality: 'Restful' | 'Good' | 'Disturbed', bed: string, wake: string) => void;
}

const computeMetrics = (steps: number) => {
  const caloriesBurnedKcal = Math.round(steps * 0.045);
  const distanceKm = Number(((steps * 0.76) / 1000).toFixed(2));
  const activeMoveMinutes = Math.round(steps / 130);
  return { caloriesBurnedKcal, distanceKm, activeMoveMinutes };
};

// Generate past 7 days labels dynamically
const generateInitialWeekDays = (): DayStepData[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const week: DayStepData[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    week.push({
      dayLabel: days[d.getDay()],
      steps: 0,
      goal: 10000,
    });
  }
  return week;
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => {
      const initialSteps = 0;
      const initialMetrics = computeMetrics(initialSteps);

      return {
        todaySteps: initialSteps,
        stepGoal: 10000,
        waterIntakeMl: 0,
        waterGoalMl: 3000,
        sleepHours: 0,
        sleepQuality: 'Good',
        lastNightBedtime: '--:--',
        lastNightWakeTime: '--:--',
        weeklyStepsHistory: generateInitialWeekDays(),
        ...initialMetrics,

        addLiveSteps: (delta) => {
          const newSteps = get().todaySteps + delta;
          const metrics = computeMetrics(newSteps);
          set({ todaySteps: newSteps, ...metrics });
        },

        setTodaySteps: (total) => {
          const metrics = computeMetrics(total);
          // Update today's bar in weekly history
          const history = [...get().weeklyStepsHistory];
          if (history.length > 0) {
            history[history.length - 1].steps = total;
          }
          set({ todaySteps: total, weeklyStepsHistory: history, ...metrics });
        },

        setStepGoal: (goal) => set({ stepGoal: goal }),

        addWater: (amount) => {
          const updated = Math.min(get().waterGoalMl * 1.5, get().waterIntakeMl + amount);
          set({ waterIntakeMl: updated });
        },

        resetDailyWater: () => set({ waterIntakeMl: 0 }),

        logSleep: (hours, quality, bed, wake) => {
          set({
            sleepHours: hours,
            sleepQuality: quality,
            lastNightBedtime: bed,
            lastNightWakeTime: wake,
          });
        },
      };
    },
    {
      name: 'personal-app:health-store-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
