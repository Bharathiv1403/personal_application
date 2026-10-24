import { Share, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface BackupPayload {
  app: string;
  version: string;
  timestamp: string;
  profile: string | null;
  biometricPref: string | null;
  health: string | null;
  wealth: string | null;
  career: string | null;
  candidateProfile: string | null;
  tasks: string | null;
}

const STORAGE_KEYS = {
  profile: '@nova:user_profile',
  biometrics: '@nova:biometric_enabled',
  health: 'personal-app:health-store-v2',
  wealth: 'personal-app:wealth-store-v2',
  career: 'personal-app:career-jobs-v2',
  candidateProfile: 'personal-app:candidate-profile-v1',
  tasks: '@personal_app:daily_tasks_v2',
};

export class BackupService {
  /**
   * Bundles all local sandboxed app data into a portable JSON backup payload
   */
  static async generateBackup(): Promise<string> {
    const [profile, biometrics, health, wealth, career, candidateProfile, tasks] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.profile),
      AsyncStorage.getItem(STORAGE_KEYS.biometrics),
      AsyncStorage.getItem(STORAGE_KEYS.health),
      AsyncStorage.getItem(STORAGE_KEYS.wealth),
      AsyncStorage.getItem(STORAGE_KEYS.career),
      AsyncStorage.getItem(STORAGE_KEYS.candidateProfile),
      AsyncStorage.getItem(STORAGE_KEYS.tasks),
    ]);

    const payload: BackupPayload = {
      app: 'AAYON',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      profile,
      biometricPref: biometrics,
      health,
      wealth,
      career,
      candidateProfile,
      tasks,
    };

    return JSON.stringify(payload, null, 2);
  }

  /**
   * WhatsApp-style Share: Opens the system share drawer to save to Google Drive, WhatsApp, or Email
   */
  static async exportAndShare(): Promise<boolean> {
    try {
      const backupJson = await this.generateBackup();
      const dateStr = new Date().toISOString().split('T')[0];

      const result = await Share.share(
        {
          title: `AAYON Vault Backup (${dateStr})`,
          message: backupJson,
        },
        {
          dialogTitle: 'Save Backup to Google Drive / WhatsApp',
        }
      );

      return result.action === Share.sharedAction;
    } catch (error) {
      console.warn('[BackupService] Share error:', error);
      Alert.alert('Backup Failed', 'Could not export backup data.');
      return false;
    }
  }

  /**
   * Restores an exported JSON backup into local storage
   */
  static async restoreBackup(jsonString: string): Promise<boolean> {
    try {
      const payload: BackupPayload = JSON.parse(jsonString.trim());

      if ((payload.app !== 'AAYON' && payload.app !== 'Nova Life OS') || !payload.timestamp) {
        Alert.alert('Invalid Backup', 'This file is not a valid AAYON backup.');
        return false;
      }

      const writes: [string, string][] = [];
      if (payload.profile) writes.push([STORAGE_KEYS.profile, payload.profile]);
      if (payload.biometricPref) writes.push([STORAGE_KEYS.biometrics, payload.biometricPref]);
      if (payload.health) writes.push([STORAGE_KEYS.health, payload.health]);
      if (payload.wealth) writes.push([STORAGE_KEYS.wealth, payload.wealth]);
      if (payload.career) writes.push([STORAGE_KEYS.career, payload.career]);
      if (payload.candidateProfile) writes.push([STORAGE_KEYS.candidateProfile, payload.candidateProfile]);
      if (payload.tasks) writes.push([STORAGE_KEYS.tasks, payload.tasks]);

      await AsyncStorage.multiSet(writes);
      return true;
    } catch (err) {
      console.warn('[BackupService] Restore error:', err);
      Alert.alert('Restore Failed', 'Could not parse backup content. Ensure valid JSON format.');
      return false;
    }
  }
}
