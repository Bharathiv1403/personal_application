import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useHealthStore } from '@/features/health/state/health-store';
import { NotificationService } from '@/core/utils/notification-service';

export class ScreenTimeTracker {
  private static timer: ReturnType<typeof setInterval> | null = null;
  private static appStateSubscription: { remove: () => void } | null = null;
  private static isInitialized = false;

  static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Check midnight reset on launch
    useHealthStore.getState().checkAndResetDay();

    // Start tracking if app starts in active state
    if (AppState.currentState === 'active') {
      this.startTimer();
    }

    this.appStateSubscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        useHealthStore.getState().checkAndResetDay();
        this.startTimer();
      } else {
        this.stopTimer();
      }
    });
  }

  private static startTimer(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      const store = useHealthStore.getState();
      const prevUsed = store.todayScreenTimeSeconds;
      const limitSec = store.dailyScreenLimitMinutes * 60;
      const alreadyWarned = store.hasLimitWarningTriggeredToday;

      store.addScreenTimeSeconds(5);

      // Check if this increment crossed the limit
      if (prevUsed < limitSec && prevUsed + 5 >= limitSec && !alreadyWarned) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
        NotificationService.sendScreenLimitAlert(
          Math.round((prevUsed + 5) / 60),
          store.dailyScreenLimitMinutes
        ).catch(() => {});
      }
    }, 5000);
  }

  private static stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  static destroy(): void {
    this.stopTimer();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    this.isInitialized = false;
  }
}
