import { PedometerService } from '@/core/native-bridges/pedometer-adapter';
import { useHealthStore } from '@/features/health/state/health-store';

export class StepTracker {
  private static isInitialized = false;
  private static unsubscribePedometer: (() => void) | null = null;

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

        // Single global listener for live steps across the entire app
        this.unsubscribePedometer = PedometerService.subscribeLiveSteps((delta) => {
          if (delta > 0) {
            useHealthStore.getState().addLiveSteps(delta);
          }
        });
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
    this.isInitialized = false;
  }
}
