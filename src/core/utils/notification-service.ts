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
