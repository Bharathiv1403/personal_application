import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const ACCENT_COLOR = '#6366F1';

// Configure how notifications appear when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const title = notification.request.content.title?.trim();
    const body = notification.request.content.body?.trim();

    // Prevent blank notifications with empty content from displaying
    if (!title && !body) {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // Keep background step tracker updates silent in foreground (list only, no sound/banner spam)
    const isStepTracker = notification.request.content.data?.type === 'step_tracker';
    if (isStepTracker) {
      return {
        shouldShowBanner: false,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
        priority: Notifications.AndroidNotificationPriority.LOW,
      };
    }

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    };
  },
});

export class NotificationService {
  static readonly REMINDER_CHANNEL_ID = 'executive_reminders';
  static readonly STEP_CHANNEL_ID = 'step_tracker_service';
  static readonly STEP_CATEGORY_ID = 'step_tracker_category';
  static readonly STEP_ACTION_CLOSE = 'DISMISS_STEP_NOTIFICATION';

  private static channelsInitialized = false;

  /**
   * Ensure Android notification channels exist before any local or scheduled alert
   */
  static async ensureAndroidChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync(this.REMINDER_CHANNEL_ID, {
        name: 'Executive Reminders & Alerts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        lightColor: ACCENT_COLOR,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      await Notifications.setNotificationChannelAsync(this.STEP_CHANNEL_ID, {
        name: 'Active Step Tracker',
        importance: Notifications.AndroidImportance.LOW,
        vibrationPattern: [0],
        enableVibrate: false,
        showBadge: false,
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
      });

      this.channelsInitialized = true;
    } catch (e) {
      console.warn('[NotificationService] Channel setup failed:', e);
    }
  }

  /**
   * Remove any stale legacy scheduled/presented notifications that have empty title and body
   */
  static async purgeBlankNotifications(): Promise<void> {
    try {
      const scheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const req of scheduled) {
        if (!req.content.title?.trim() && !req.content.body?.trim()) {
          await Notifications.cancelScheduledNotificationAsync(req.identifier).catch(() => {});
        }
      }

      const presented = await Notifications.getPresentedNotificationsAsync();
      for (const item of presented) {
        if (!item.request.content.title?.trim() && !item.request.content.body?.trim()) {
          await Notifications.dismissNotificationAsync(item.request.identifier).catch(() => {});
        }
      }
    } catch {
      // Ignore platforms/environments that do not support listing notifications
    }
  }

  /**
   * Request system notification permissions (Android 13+ & iOS)
   */
  static async requestPermissions(): Promise<boolean> {
    try {
      await this.ensureAndroidChannels();
      await this.purgeBlankNotifications();

      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (e) {
      console.warn('[NotificationService] Permission request failed:', e);
      return false;
    }
  }

  private static computeBillReminderDate(year: number, month: number, dueDay: number): Date {
    const safeDay = Number.isFinite(dueDay) ? Math.floor(dueDay) : 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const clampedDueDay = Math.min(Math.max(1, safeDay), daysInMonth);
    const dueDateAt9Am = new Date(year, month, clampedDueDay, 9, 0, 0, 0);
    // Remind 24 hours before due date at 9:00 AM (safe across day=1 and month-end days)
    return new Date(dueDateAt9Am.getTime() - 24 * 60 * 60 * 1000);
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
      const now = new Date();
      let targetDate = this.computeBillReminderDate(
        now.getFullYear(),
        now.getMonth(),
        dueDateDayOfMonth
      );

      if (targetDate.getTime() <= now.getTime()) {
        targetDate = this.computeBillReminderDate(
          now.getFullYear(),
          now.getMonth() + 1,
          dueDateDayOfMonth
        );
      }

      const safeTitle = billName.trim() || 'Upcoming Bill';
      const safeAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;

      const id = await Notifications.scheduleNotificationAsync({
        identifier: `bill_reminder_${billId}`,
        content: {
          title: 'Bill Due Tomorrow 💳',
          body: `${safeTitle} (₹${safeAmount.toLocaleString('en-IN')}) is due tomorrow. Tap to review in Wealth Vault.`,
          color: ACCENT_COLOR,
          data: { type: 'bill', billId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: targetDate,
          channelId: this.REMINDER_CHANNEL_ID,
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
      const parsedDate = appliedDateStr ? new Date(appliedDateStr) : new Date();
      const baseDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      const followUpDate = new Date(baseDate.getTime() + 5 * 24 * 60 * 60 * 1000);
      followUpDate.setHours(10, 0, 0, 0);

      // Only schedule if follow-up date is in future
      if (followUpDate.getTime() <= Date.now()) {
        return null;
      }

      const safeRole = role.trim() || 'your application';
      const safeCompany = company.trim() || 'the company';

      const id = await Notifications.scheduleNotificationAsync({
        identifier: `job_followup_${jobId}`,
        content: {
          title: 'Job Follow-Up Due ⏳',
          body: `5 days have passed since applying for ${safeRole} at ${safeCompany}. Generate an outreach follow-up pitch!`,
          color: ACCENT_COLOR,
          data: { type: 'job_followup', jobId },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: followUpDate,
          channelId: this.REMINDER_CHANNEL_ID,
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
      await Notifications.cancelScheduledNotificationAsync('daily_executive_briefing').catch(() => {});

      const id = await Notifications.scheduleNotificationAsync({
        identifier: 'daily_executive_briefing',
        content: {
          title: 'Good Morning, Executive ☀️',
          body: 'Your daily focus goals, career opportunities, and financial snapshot are ready in AAYON.',
          color: ACCENT_COLOR,
          data: { type: 'daily_briefing' },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 9,
          minute: 0,
          channelId: this.REMINDER_CHANNEL_ID,
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
          color: ACCENT_COLOR,
          sound: true,
          data: { type: 'hydration' },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 7200,
          repeats: true,
          channelId: this.REMINDER_CHANNEL_ID,
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
      const safeLimit = Number.isFinite(limitMinutes) ? Math.max(1, Math.round(limitMinutes)) : 120;
      const hours = Math.floor(safeLimit / 60);
      const mins = safeLimit % 60;
      const durationLabel = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

      const id = await Notifications.scheduleNotificationAsync({
        identifier: `screen_limit_${Date.now()}`,
        content: {
          title: '⚠️ Screen Time Limit Reached',
          body: `You have reached your daily limit of ${durationLabel} (${Math.round(usedMinutes)}m used).`,
          color: ACCENT_COLOR,
          sound: true,
          data: { type: 'screen_limit_alert' },
        },
        trigger: Platform.OS === 'android' ? { channelId: this.REMINDER_CHANNEL_ID } : null,
      });
      return id;
    } catch (e) {
      console.warn('[NotificationService] Screen limit alert failed:', e);
      return null;
    }
  }

  /**
   * Register notification category with close/dismiss action button
   */
  static async setupStepNotificationCategory(): Promise<void> {
    try {
      await Notifications.setNotificationCategoryAsync(this.STEP_CATEGORY_ID, [
        {
          identifier: this.STEP_ACTION_CLOSE,
          buttonTitle: 'Dismiss / Close ✕',
          options: {
            isDestructive: true,
            opensAppToForeground: false,
          },
        },
      ]);
    } catch {
      // Ignore if category setting is not supported
    }
  }

  /**
   * Display or update background step tracker notification
   */
  static async showStepTrackerNotification(steps: number, goal: number): Promise<void> {
    if (Platform.OS !== 'android') return;
    try {
      if (!this.channelsInitialized) {
        await this.ensureAndroidChannels();
      }

      const safeSteps = Number.isFinite(steps) ? Math.max(0, Math.round(steps)) : 0;
      const safeGoal = Number.isFinite(goal) && goal > 0 ? Math.round(goal) : 10000;
      const percent = Math.min(100, Math.round((safeSteps / safeGoal) * 100));

      await Notifications.scheduleNotificationAsync({
        identifier: 'aayon_step_tracker_ongoing',
        content: {
          title: 'AAYON: Step Tracker 🚶‍♂️',
          body: `${safeSteps.toLocaleString('en-IN')} / ${safeGoal.toLocaleString('en-IN')} steps (${percent}%)`,
          color: ACCENT_COLOR,
          categoryIdentifier: this.STEP_CATEGORY_ID,
          sticky: false,
          autoDismiss: true,
          priority: Notifications.AndroidNotificationPriority.LOW,
          sound: false,
          data: { type: 'step_tracker' },
        },
        trigger: {
          channelId: this.STEP_CHANNEL_ID,
        },
      });
    } catch {
      // Silently ignore notification failure
    }
  }

  /**
   * Remove background step tracker notification cleanly without scheduling empty dummy notifications
   */
  static async cancelStepTrackerNotification(): Promise<void> {
    try {
      await Notifications.dismissNotificationAsync('aayon_step_tracker_ongoing').catch(() => {});
      await Notifications.cancelScheduledNotificationAsync('aayon_step_tracker_ongoing').catch(() => {});
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
