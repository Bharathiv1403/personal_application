import { AppState, AppStateStatus } from 'react-native';
import { PedometerService } from '@/core/native-bridges/pedometer-adapter';
import { useHealthStore } from '@/features/health/state/health-store';
import { NotificationService } from '@/core/utils/notification-service';

export class StepTracker {
  private static isInitialized = false;
  private static unsubscribePedometer: (() => void) | null = null;
  private static appStateSubscription: { remove: () => void } | null = null;
  private static lastNotificationUpdateTime = 0;

  static async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Reset daily counters if day has changed
    useHealthStore.getState().checkAndResetDay();

    try {
      const { isAvailable, permissionGranted, hasHistoricalSupport } =
        await PedometerService.checkAvailability();

      if (isAvailable && permissionGranted) {
        if (hasHistoricalSupport) {
          const realSteps = await PedometerService.getTodaySteps();
          if (realSteps > 0) {
            useHealthStore.getState().setTodaySteps(realSteps);
          }
        }

        // Show initial ongoing background notification
        const state = useHealthStore.getState();
        NotificationService.showStepTrackerNotification(state.todaySteps, state.stepGoal);

        // Single global listener for live steps across the entire app
        this.unsubscribePedometer = PedometerService.subscribeLiveSteps((delta) => {
          if (delta > 0) {
            const store = useHealthStore.getState();
            store.addLiveSteps(delta);

            // Update persistent notification throttled every 10s to conserve battery
            const now = Date.now();
            if (now - this.lastNotificationUpdateTime > 10000) {
              this.lastNotificationUpdateTime = now;
              NotificationService.showStepTrackerNotification(
                store.todaySteps + delta,
                store.stepGoal
              );
            }
          }
        });

        // Listen for AppState changes to ensure midnight resets and sync on resume
        this.appStateSubscription = AppState.addEventListener(
          'change',
          (nextState: AppStateStatus) => {
            if (nextState === 'active') {
              useHealthStore.getState().checkAndResetDay();
              const cur = useHealthStore.getState();
              NotificationService.showStepTrackerNotification(cur.todaySteps, cur.stepGoal);
            }
          }
        );
      }
    } catch (err) {
      console.warn('[StepTracker] Initialization failed:', err);
    }
  }

  static destroy(): void {
    if (this.unsubscribePedometer) {
      this.unsubscribePedometer();
      this.unsubscribePedometer = null;
    }
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    NotificationService.cancelStepTrackerNotification();
    this.isInitialized = false;
  }
}
