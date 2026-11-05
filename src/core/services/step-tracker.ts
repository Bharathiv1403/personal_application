import { AppState, AppStateStatus, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { PedometerService } from '@/core/native-bridges/pedometer-adapter';
import { useHealthStore } from '@/features/health/state/health-store';
import { NotificationService } from '@/core/utils/notification-service';

export class StepTracker {
  private static isInitialized = false;
  private static unsubscribePedometer: (() => void) | null = null;
  private static appStateSubscription: { remove: () => void } | null = null;
  private static notificationResponseSubscription: { remove: () => void } | null = null;
  private static lastNotificationUpdateTime = 0;

  static async init(): Promise<void> {
    if (this.isInitialized) return;
    this.isInitialized = true;

    // Reset daily counters if day has changed
    useHealthStore.getState().checkAndResetDay();

    // Register notification action category (Dismiss / Close button on notification)
    await NotificationService.setupStepNotificationCategory();

    // Listen for notification action button taps (e.g. user taps "Dismiss / Close ✕" from notification bar)
    if (!this.notificationResponseSubscription) {
      this.notificationResponseSubscription = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          if (response.actionIdentifier === NotificationService.STEP_ACTION_CLOSE) {
            useHealthStore.getState().setStepNotificationEnabled(false);
            NotificationService.cancelStepTrackerNotification();
          }
        }
      );
    }

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

        // Show initial ongoing background notification if user enabled it
        const state = useHealthStore.getState();
        if (state.isStepNotificationEnabled) {
          NotificationService.showStepTrackerNotification(state.todaySteps, state.stepGoal);
        } else {
          NotificationService.cancelStepTrackerNotification();
        }

        // Single global listener for live steps across the entire app
        this.unsubscribePedometer = PedometerService.subscribeLiveSteps((delta) => {
          if (delta > 0) {
            const store = useHealthStore.getState();
            store.addLiveSteps(delta);

            // Update notification throttled every 10s to conserve battery
            const now = Date.now();
            if (now - this.lastNotificationUpdateTime > 10000) {
              this.lastNotificationUpdateTime = now;
              if (store.isStepNotificationEnabled) {
                NotificationService.showStepTrackerNotification(
                  store.todaySteps,
                  store.stepGoal
                );
              }
            }
          }
        });

        // Listen for AppState changes to ensure midnight resets and sync on resume
        this.appStateSubscription = AppState.addEventListener(
          'change',
          (nextState: AppStateStatus) => {
            if (nextState === 'active') {
              useHealthStore.getState().checkAndResetDay();

              // On iOS, sync historical steps from CoreMotion
              if (Platform.OS === 'ios') {
                PedometerService.getTodaySteps().then((realSteps) => {
                  if (realSteps > 0) {
                    useHealthStore.getState().setTodaySteps(realSteps);
                  }
                });
              }

              const cur = useHealthStore.getState();
              if (cur.isStepNotificationEnabled) {
                NotificationService.showStepTrackerNotification(cur.todaySteps, cur.stepGoal);
              } else {
                NotificationService.cancelStepTrackerNotification();
              }
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
    if (this.notificationResponseSubscription) {
      this.notificationResponseSubscription.remove();
      this.notificationResponseSubscription = null;
    }
    NotificationService.cancelStepTrackerNotification();
    this.isInitialized = false;
  }
}
