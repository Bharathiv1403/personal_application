import { Pedometer } from 'expo-sensors';
import { Platform } from 'react-native';

export interface PedometerStatus {
  isAvailable: boolean;
  permissionGranted: boolean;
  hasHistoricalSupport: boolean;
}

export class PedometerService {
  private static nativeSubscription: { remove: () => void } | null = null;
  private static listeners = new Set<(deltaSteps: number) => void>();
  private static lastCumulativeSteps: number | null = null;

  static async checkAvailability(): Promise<PedometerStatus> {
    try {
      const isAvailable = await Pedometer.isAvailableAsync();
      const permissions = await Pedometer.getPermissionsAsync();
      let granted = permissions.granted;

      if (!granted && permissions.canAskAgain) {
        const req = await Pedometer.requestPermissionsAsync();
        granted = req.granted;
      }

      return {
        isAvailable,
        permissionGranted: granted,
        hasHistoricalSupport: Platform.OS === 'ios',
      };
    } catch {
      return { isAvailable: false, permissionGranted: false, hasHistoricalSupport: false };
    }
  }

  static async getTodaySteps(): Promise<number> {
    try {
      const { isAvailable, permissionGranted } = await this.checkAvailability();
      if (!isAvailable || !permissionGranted) return 0;

      // Note: getStepCountAsync is only supported on iOS in expo-sensors
      if (Platform.OS !== 'ios') {
        return 0;
      }

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      const result = await Pedometer.getStepCountAsync(start, end);
      return result ? result.steps : 0;
    } catch {
      return 0;
    }
  }

  /**
   * Subscribes to live step updates.
   * Calculates delta between consecutive events instead of feeding cumulative steps.
   * Prevents initial sensor reading jump and filters out sensor noise.
   */
  static subscribeLiveSteps(onStepChange: (deltaSteps: number) => void): () => void {
    try {
      this.listeners.add(onStepChange);

      if (!this.nativeSubscription) {
        this.lastCumulativeSteps = null;
        this.nativeSubscription = Pedometer.watchStepCount((result) => {
          if (result && typeof result.steps === 'number') {
            const currentSteps = result.steps;

            // FIRST SENSOR EVENT: Establish base reading!
            // Do NOT treat the phone hardware's cumulative counter as newly taken steps!
            if (this.lastCumulativeSteps === null) {
              this.lastCumulativeSteps = currentSteps;
              return;
            }

            const delta = currentSteps - this.lastCumulativeSteps;
            this.lastCumulativeSteps = currentSteps;

            // Allow realistic delta (including batched steps accumulated while phone screen was locked/off).
            // Cap at 10,000 steps per event to filter out device reboot jumps or corrupt hardware spikes.
            if (delta > 0 && delta <= 10000) {
              this.listeners.forEach((listener) => {
                try {
                  listener(delta);
                } catch (err) {
                  console.warn('[PedometerService] Listener error:', err);
                }
              });
            } else if (delta < 0) {
              // Phone was rebooted or hardware counter reset
              this.lastCumulativeSteps = currentSteps;
            }
          }
        });
      }

      return () => {
        this.listeners.delete(onStepChange);
        if (this.listeners.size === 0 && this.nativeSubscription) {
          this.nativeSubscription.remove();
          this.nativeSubscription = null;
          this.lastCumulativeSteps = null;
        }
      };
    } catch {
      return () => {};
    }
  }
}
