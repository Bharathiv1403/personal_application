import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DayStepData {
  date: string; // YYYY-MM-DD
  dayLabel: string;
  steps: number;
  goal: number;
}

export interface WeightLog {
  id: string;
  date: string; // YYYY-MM-DD
  weightKg: number;
  bmi: number;
  note?: string;
}

export type ScreenTimeReasonCategory =
  | 'emergency'
  | 'time_pass'
  | 'boring'
  | 'work'
  | 'social'
  | 'other';

export interface ScreenTimeReasonLog {
  id: string;
  timestamp: string; // e.g. "10:45 AM"
  date: string; // YYYY-MM-DD
  category: ScreenTimeReasonCategory;
  reason: string;
  customNote?: string;
  actionTaken: 'continued' | 'stopped';
  extendedMinutes: number;
  screenTimeAtLimitMinutes: number;
}

interface HealthState {
  // Steps & Movement
  todaySteps: number;
  stepGoal: number;
  lastTrackedDate: string; // YYYY-MM-DD
  weeklyStepsHistory: DayStepData[];
  monthStepsHistory: DayStepData[];

  // Hydration & Sleep
  waterIntakeMl: number;
  waterGoalMl: number;
  sleepHours: number;
  sleepQuality: 'Restful' | 'Good' | 'Disturbed';
  lastNightBedtime: string;
  lastNightWakeTime: string;
  sleepDebtHours: number;

  // Weight & Ergonomics
  weightLogs: WeightLog[];
  goalWeightKg: number;
  heightCm: number;
  ergonomicsShieldActive: boolean;

  // Screen Time & Digital Wellbeing
  dailyScreenLimitMinutes: number;
  todayScreenTimeSeconds: number;
  isScreenLimitModalVisible: boolean;
  hasLimitWarningTriggeredToday: boolean;
  screenTimeLogs: ScreenTimeReasonLog[];

  // Computed Values
  caloriesBurnedKcal: number;
  distanceKm: number;
  activeMoveMinutes: number;

  // Actions
  checkAndResetDay: () => void;
  addLiveSteps: (deltaSteps: number) => void;
  setTodaySteps: (totalSteps: number) => void;
  manuallyAdjustSteps: (totalSteps: number) => void;
  setStepGoal: (goal: number) => void;
  addWater: (amountMl: number) => void;
  resetDailyWater: () => void;
  logSleep: (hours: number, quality: 'Restful' | 'Good' | 'Disturbed', bed: string, wake: string) => void;

  // Weight & Ergonomics Actions
  logWeight: (weightKg: number, note?: string) => void;
  setGoalWeight: (goalKg: number) => void;
  setHeight: (heightCm: number) => void;
  toggleErgonomicsShield: (active?: boolean) => void;

  // Screen Time Actions
  setDailyScreenLimitMinutes: (minutes: number) => void;
  addScreenTimeSeconds: (seconds: number) => void;
  setTodayScreenTimeMinutes: (minutes: number) => void;
  openScreenLimitModal: () => void;
  closeScreenLimitModal: () => void;
  handleScreenTimeStop: () => void;
  handleScreenTimeContinue: (
    category: ScreenTimeReasonCategory,
    customReason?: string,
    extendedMinutes?: number
  ) => void;
  resetScreenTimeToday: () => void;
  clearScreenTimeLogs: () => void;
}

const computeMetrics = (steps: number) => {
  const caloriesBurnedKcal = Math.round(steps * 0.045);
  const distanceKm = Number(((steps * 0.76) / 1000).toFixed(2));
  const activeMoveMinutes = Math.round(steps / 130);
  return { caloriesBurnedKcal, distanceKm, activeMoveMinutes };
};

const calculateBMI = (weightKg: number, heightCm: number): number => {
  if (heightCm <= 0) return 22.0;
  const heightM = heightCm / 100;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatCurrentTime = (): string => {
  const d = new Date();
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
};

// Generate past 7 days labels dynamically
const generateInitialWeekDays = (existingHistory?: DayStepData[]): DayStepData[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const week: DayStepData[] = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = days[d.getDay()];

    const existing = existingHistory?.find((h) => h.date === dateStr);
    week.push({
      date: dateStr,
      dayLabel,
      steps: existing ? existing.steps : 0,
      goal: 10000,
    });
  }
  return week;
};

// Generate past 30 days dynamically for monthly heatmap
const generateInitialMonthDays = (existingHistory?: DayStepData[]): DayStepData[] => {
  const today = new Date();
  const monthList: DayStepData[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const dayLabel = String(d.getDate());

    const existing = existingHistory?.find((h) => h.date === dateStr);
    monthList.push({
      date: dateStr,
      dayLabel,
      steps: existing ? existing.steps : 0,
      goal: 10000,
    });
  }
  return monthList;
};

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => {
      const initialSteps = 0;
      const initialMetrics = computeMetrics(initialSteps);
      const todayStr = getTodayDateString();

      return {
        todaySteps: initialSteps,
        stepGoal: 10000,
        lastTrackedDate: todayStr,
        weeklyStepsHistory: generateInitialWeekDays(),
        monthStepsHistory: generateInitialMonthDays(),

        waterIntakeMl: 0,
        waterGoalMl: 3000,
        sleepHours: 0,
        sleepQuality: 'Good',
        lastNightBedtime: '',
        lastNightWakeTime: '',
        sleepDebtHours: 0,

        weightLogs: [],
        goalWeightKg: 0,
        heightCm: 0,
        ergonomicsShieldActive: false,

        // Screen time defaults: 120 minutes (2 hrs)
        dailyScreenLimitMinutes: 120,
        todayScreenTimeSeconds: 0,
        isScreenLimitModalVisible: false,
        hasLimitWarningTriggeredToday: false,
        screenTimeLogs: [],

        ...initialMetrics,

        checkAndResetDay: () => {
          const currentDay = getTodayDateString();
          const lastDay = get().lastTrackedDate;

          if (currentDay !== lastDay) {
            const weekHistory = generateInitialWeekDays(get().weeklyStepsHistory);
            const monthHistory = generateInitialMonthDays(get().monthStepsHistory);

            if (weekHistory.length >= 2) {
              const yesterdayDate = weekHistory[weekHistory.length - 2].date;
              if (lastDay === yesterdayDate) {
                weekHistory[weekHistory.length - 2].steps = get().todaySteps;
              }
            }

            if (monthHistory.length >= 2) {
              const yesterdayDate = monthHistory[monthHistory.length - 2].date;
              if (lastDay === yesterdayDate) {
                monthHistory[monthHistory.length - 2].steps = get().todaySteps;
              }
            }

            set({
              lastTrackedDate: currentDay,
              todaySteps: 0,
              todayScreenTimeSeconds: 0,
              hasLimitWarningTriggeredToday: false,
              isScreenLimitModalVisible: false,
              waterIntakeMl: 0,
              weeklyStepsHistory: weekHistory,
              monthStepsHistory: monthHistory,
              ...computeMetrics(0),
            });
          }
        },

        addLiveSteps: (delta) => {
          get().checkAndResetDay();
          const newSteps = get().todaySteps + delta;
          const metrics = computeMetrics(newSteps);

          const week = [...get().weeklyStepsHistory];
          if (week.length > 0) {
            week[week.length - 1].steps = newSteps;
          }

          const month = [...get().monthStepsHistory];
          if (month.length > 0) {
            month[month.length - 1].steps = newSteps;
          }

          set({ todaySteps: newSteps, weeklyStepsHistory: week, monthStepsHistory: month, ...metrics });
        },

        setTodaySteps: (total) => {
          get().checkAndResetDay();
          const metrics = computeMetrics(total);

          const week = [...get().weeklyStepsHistory];
          if (week.length > 0) {
            week[week.length - 1].steps = total;
          }

          const month = [...get().monthStepsHistory];
          if (month.length > 0) {
            month[month.length - 1].steps = total;
          }

          set({ todaySteps: total, weeklyStepsHistory: week, monthStepsHistory: month, ...metrics });
        },

        manuallyAdjustSteps: (total) => {
          get().checkAndResetDay();
          const safeTotal = Math.max(0, Math.round(total));
          const metrics = computeMetrics(safeTotal);

          const week = [...get().weeklyStepsHistory];
          if (week.length > 0) {
            week[week.length - 1].steps = safeTotal;
          }

          const month = [...get().monthStepsHistory];
          if (month.length > 0) {
            month[month.length - 1].steps = safeTotal;
          }

          set({ todaySteps: safeTotal, weeklyStepsHistory: week, monthStepsHistory: month, ...metrics });
        },

        setStepGoal: (goal) => set({ stepGoal: goal }),

        addWater: (amount) => {
          get().checkAndResetDay();
          const updated = Math.min(get().waterGoalMl * 1.5, get().waterIntakeMl + amount);
          set({ waterIntakeMl: updated });
        },

        resetDailyWater: () => set({ waterIntakeMl: 0 }),

        logSleep: (hours, quality, bed, wake) => {
          const debt = Number(Math.max(0, 8.0 - hours).toFixed(1));
          set({
            sleepHours: hours,
            sleepQuality: quality,
            lastNightBedtime: bed,
            lastNightWakeTime: wake,
            sleepDebtHours: debt,
          });
        },

        // Weight & Ergonomics
        logWeight: (weightKg, note) => {
          const state = get();
          const safeWeight = Number(weightKg.toFixed(1));
          const bmi = calculateBMI(safeWeight, state.heightCm);
          const newEntry: WeightLog = {
            id: 'w_' + Date.now(),
            date: getTodayDateString(),
            weightKg: safeWeight,
            bmi,
            note,
          };
          set({ weightLogs: [newEntry, ...state.weightLogs] });
        },

        setGoalWeight: (goalKg) => set({ goalWeightKg: goalKg }),
        setHeight: (heightCm) => {
          const state = get();
          const updatedLogs = state.weightLogs.map((w) => ({
            ...w,
            bmi: calculateBMI(w.weightKg, heightCm),
          }));
          set({ heightCm, weightLogs: updatedLogs });
        },
        toggleErgonomicsShield: (active) => {
          const current = get().ergonomicsShieldActive;
          set({ ergonomicsShieldActive: active !== undefined ? active : !current });
        },

        // Screen Time Store Logic
        setDailyScreenLimitMinutes: (minutes) => {
          const safeMinutes = Math.max(5, minutes);
          const currentUsedSec = get().todayScreenTimeSeconds;
          const warningReset = currentUsedSec < safeMinutes * 60 ? false : get().hasLimitWarningTriggeredToday;
          set({
            dailyScreenLimitMinutes: safeMinutes,
            hasLimitWarningTriggeredToday: warningReset,
          });
        },

        addScreenTimeSeconds: (seconds) => {
          get().checkAndResetDay();
          const updatedSeconds = get().todayScreenTimeSeconds + seconds;
          const limitSeconds = get().dailyScreenLimitMinutes * 60;
          const hasTriggered = get().hasLimitWarningTriggeredToday;

          if (updatedSeconds >= limitSeconds && !hasTriggered) {
            set({
              todayScreenTimeSeconds: updatedSeconds,
              isScreenLimitModalVisible: true,
              hasLimitWarningTriggeredToday: true,
            });
          } else {
            set({ todayScreenTimeSeconds: updatedSeconds });
          }
        },

        setTodayScreenTimeMinutes: (minutes) => {
          get().checkAndResetDay();
          const seconds = Math.max(0, minutes * 60);
          set({ todayScreenTimeSeconds: seconds });
        },

        openScreenLimitModal: () => set({ isScreenLimitModalVisible: true }),
        closeScreenLimitModal: () => set({ isScreenLimitModalVisible: false }),

        handleScreenTimeStop: () => {
          const state = get();
          const usedMinutes = Math.round(state.todayScreenTimeSeconds / 60);
          const todayStr = getTodayDateString();

          const stopLog: ScreenTimeReasonLog = {
            id: 'st_log_' + Date.now(),
            timestamp: formatCurrentTime(),
            date: todayStr,
            category: 'other',
            reason: 'Stopped phone usage on limit',
            actionTaken: 'stopped',
            extendedMinutes: 0,
            screenTimeAtLimitMinutes: usedMinutes,
          };

          set({
            isScreenLimitModalVisible: false,
            screenTimeLogs: [stopLog, ...state.screenTimeLogs],
          });
        },

        handleScreenTimeContinue: (category, customReason, extendedMinutes = 30) => {
          const state = get();
          const usedMinutes = Math.round(state.todayScreenTimeSeconds / 60);
          const todayStr = getTodayDateString();

          const readableCategory: Record<ScreenTimeReasonCategory, string> = {
            emergency: 'Emergency',
            time_pass: 'Time Pass',
            boring: 'Boring / Leisure',
            work: 'Work / Study',
            social: 'Social / Family',
            other: customReason || 'Other',
          };

          const continueLog: ScreenTimeReasonLog = {
            id: 'st_log_' + Date.now(),
            timestamp: formatCurrentTime(),
            date: todayStr,
            category,
            reason: readableCategory[category] || 'Extended',
            customNote: customReason,
            actionTaken: 'continued',
            extendedMinutes,
            screenTimeAtLimitMinutes: usedMinutes,
          };

          const newLimit = state.dailyScreenLimitMinutes + extendedMinutes;

          set({
            isScreenLimitModalVisible: false,
            dailyScreenLimitMinutes: newLimit,
            hasLimitWarningTriggeredToday: false,
            screenTimeLogs: [continueLog, ...state.screenTimeLogs],
          });
        },

        resetScreenTimeToday: () => {
          set({
            todayScreenTimeSeconds: 0,
            hasLimitWarningTriggeredToday: false,
            isScreenLimitModalVisible: false,
          });
        },

        clearScreenTimeLogs: () => set({ screenTimeLogs: [] }),
      };
    },
    {
      name: 'personal-app:health-store-v4',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.checkAndResetDay();
        }
      },
    }
  )
);
