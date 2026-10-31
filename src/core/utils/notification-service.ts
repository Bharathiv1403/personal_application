import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  /**
   * Request system notification permissions (Android 13+ & iOS)
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        return false;
      }

      // Android Notification Channel
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('executive_reminders', {
          name: 'Executive Reminders & Alerts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#6366F1',
        });

        await Notifications.setNotificationChannelAsync('step_tracker_service', {
          name: 'Active Step Tracker',
          importance: Notifications.AndroidImportance.LOW,
          vibrationPattern: [0],
          enableVibrate: false,
          showBadge: false,
        });
      }

      return true;
    } catch (e) {
      console.warn('[NotificationService] Permission request failed:', e);
      return false;
    }
  }

  /**
   * Schedule alert for bill payments 24 hours before due date
   */
  static async scheduleBillReminder(
    billId: string,
    billName: string,
    amount: number,
    dueDateDayOfMonth: number
  ): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      // Calculate next trigger date: 1 day before due date
      const now = new Date();
      let targetDate = new Date(now.getFullYear(), now.getMonth(), dueDateDayOfMonth - 1, 9, 0, 0);

      // If already passed for this month, schedule for next month
      if (targetDate.getTime() <= now.getTime()) {
        targetDate = new Date(now.getFullYear(), now.getMonth() + 1, dueDateDayOfMonth - 1, 9, 0, 0);
      }

      const id = await Notifications.scheduleNotificationAsync({
        identifier: `bill_reminder_${billId}`,
        content: {
          title: 'Bill Due Tomorrow 💳',
          body: `${billName} (₹${amount.toLocaleString()}) is due tomorrow. Tap to review in Wealth Vault.`,
          data: { type: 'bill', billId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
        },
      });

      return id;
    } catch (e) {
      console.warn('[NotificationService] Bill schedule failed:', e);
      return null;
    }
  }

  /**
   * Schedule job application follow-up nudge (5 days post-application)
   */
  static async scheduleJobFollowUpReminder(
    jobId: string,
    company: string,
    role: string,
    appliedDateStr?: string
  ): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const baseDate = appliedDateStr ? new Date(appliedDateStr) : new Date();
      const followUpDate = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000);
      followUpDate.setHours(10, 0, 0, 0);

      // Only schedule if follow-up date is in future
      if (followUpDate.getTime() <= Date.now()) {
        return null;
      }

      const id = await Notifications.scheduleNotificationAsync({
        identifier: `job_followup_${jobId}`,
        content: {
          title: 'Job Follow-Up Due ⏳',
          body: `5 days have passed since applying for ${role} at ${company}. Generate an outreach follow-up pitch!`,
          data: { type: 'job_followup', jobId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: followUpDate,
        },
      });

      return id;
    } catch (e) {
      console.warn('[NotificationService] Job follow-up schedule failed:', e);
      return null;
    }
  }

  /**
   * Schedule Daily Executive Standup Briefing at 9:00 AM
   */
  static async scheduleDailyBriefing(): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      // Cancel previous briefing to avoid duplicates
      await Notifications.cancelScheduledNotificationAsync('daily_executive_briefing').catch(() => {});

      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'daily_executive_briefing',
        content: {
          title: 'Good Morning, Executive ☀️',
          body: 'Your daily focus goals, career opportunities, and financial snapshot are ready in AAYON.',
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
        },
      });

      return id;
    } catch (e) {
      console.warn('[NotificationService] Daily briefing schedule failed:', e);
      return null;
    }
  }

  /**
   * Schedule gentle hydration reminder every 2 hours
   */
  static async scheduleHydrationReminder(): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      await Notifications.cancelScheduledNotificationAsync('hourly_hydration_nudge').catch(() => {});
      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'hourly_hydration_nudge',
        content: {
          title: 'Hydration Check 💧',
          body: 'Time for a glass of water! Stay energized and maintain peak cognitive focus.',
          sound: true,
          data: { type: 'hydration' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 7200, // Every 2 hours
          repeats: true,
        },
      });
      return id;
    } catch (e) {
      console.warn('[NotificationService] Hydration schedule failed:', e);
      return null;
    }
  }

  /**
   * Send instant notification when daily screen limit is reached
   */
  static async sendScreenLimitAlert(usedMinutes: number, limitMinutes: number): Promise<string | null> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return null;

    try {
      const id = await Notifications.scheduleNotificationAsync({
        identifier: `screen_limit_${Date.now()}`,
        content: {
          title: '⚠️ Screen Time Limit Reached',
          body: `You have reached your daily limit of ${Math.round(limitMinutes / 60)}h ${limitMinutes % 60}m. Stop or continue?`,
          sound: true,
          data: { type: 'screen_limit_alert' },
        },
        trigger: null, // immediate
      });
      return id;
    } catch (e) {
      console.warn('[NotificationService] Screen limit alert failed:', e);
      return null;
    }
  }

  /**
   * Display or update sticky background step tracker notification
   */
  static async showStepTrackerNotification(steps: number, goal: number): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      const percent = Math.min(100, Math.round((steps / (goal || 10000)) * 100));
      await Notifications.scheduleNotificationAsync({
        identifier: 'aayon_step_tracker_ongoing',
        content: {
          title: 'AAYON: Step Tracker 🚶‍♂️',
          body: `${steps.toLocaleString('en-IN')} / ${goal.toLocaleString('en-IN')} steps (${percent}%)`,
          sticky: true,
          autoDismiss: false,
          priority: Notifications.AndroidNotificationPriority.LOW,
          sound: false,
          data: { type: 'step_tracker' },
        },
        trigger: null,
      });
    } catch (e) {
      // Silently ignore notification failure
    }
  }

  /**
   * Remove sticky background step tracker notification
   */
  static async cancelStepTrackerNotification(): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync('aayon_step_tracker_ongoing');
    } catch {
      // Silently ignore
    }
  }

  /**
   * Cancel a scheduled notification by identifier
   */
  static async cancelReminder(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier);
    } catch (e) {
      console.warn('[NotificationService] Cancel failed:', e);
    }
  }
}
