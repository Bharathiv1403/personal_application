import { Pedometer } from 'expo-sensors';

export interface PedometerStatus {
  isAvailable: boolean;
  permissionGranted: boolean;
}

export class PedometerService {
  private static subscription: { remove: () => void } | null = null;

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
      };
    } catch {
      return { isAvailable: false, permissionGranted: false };
    }
  }

  static async getTodaySteps(): Promise<number> {
    try {
      const { isAvailable, permissionGranted } = await this.checkAvailability();
      if (!isAvailable || !permissionGranted) return 0;

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();

      const result = await Pedometer.getStepCountAsync(start, end);
      return result ? result.steps : 0;
    } catch {
      return 0;
    }
  }

  static subscribeLiveSteps(onStepChange: (liveStepsTaken: number) => void): () => void {
    try {
      this.subscription = Pedometer.watchStepCount((result) => {
        if (result && typeof result.steps === 'number') {
          onStepChange(result.steps);
        }
      });

      return () => {
        if (this.subscription) {
          this.subscription.remove();
          this.subscription = null;
        }
      };
    } catch {
      return () => {};
    }
  }
}
