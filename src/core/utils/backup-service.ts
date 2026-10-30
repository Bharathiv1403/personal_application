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
  todos?: string | null;
  vault?: string | null;
  aiProvider?: string | null;
  notes?: string | null;
  habits?: string | null;
}

const STORAGE_KEYS = {
  profile: '@nova:user_profile',
  biometrics: '@nova:biometric_enabled',
  health: 'personal-app:health-store-v2',
  wealth: 'personal-app:finance-store-fresh-v1',
  legacyWealth: 'personal-app:wealth-store-v2',
  career: 'personal-app:career-jobs-v2',
  candidateProfile: 'aayon:candidate-profile-v3',
  tasks: '@personal_app:daily_tasks_v2',
  todos: 'personal-app:todo-store-v1',
  vault: '@nova:keepass_vault',
  aiProvider: '@aayon:ai_preferred_provider',
  notes: 'second-brain-notes-storage',
  habits: 'personal-app:habit-store-v1',
};

export class BackupService {
  /**
   * Bundles all local sandboxed app data (Wealth, Career, KeePass Vault, Health, Todos) into a portable JSON backup payload
   */
  static async generateBackup(): Promise<string> {
    const candidateV3 = await AsyncStorage.getItem(STORAGE_KEYS.candidateProfile);
    const candidateFallback =
      candidateV3 ||
      (await AsyncStorage.getItem('personal-app:candidate-profile-v2')) ||
      (await AsyncStorage.getItem('personal-app:candidate-profile-v1'));

    const [
      profile,
      biometrics,
      health,
      wealthFresh,
      wealthLegacy,
      career,
      tasks,
      todos,
      vault,
      aiProvider,
      notes,
      habits,
    ] = await Promise.all([
      AsyncStorage.getItem(STORAGE_KEYS.profile),
      AsyncStorage.getItem(STORAGE_KEYS.biometrics),
      AsyncStorage.getItem(STORAGE_KEYS.health),
      AsyncStorage.getItem(STORAGE_KEYS.wealth),
      AsyncStorage.getItem(STORAGE_KEYS.legacyWealth),
      AsyncStorage.getItem(STORAGE_KEYS.career),
      AsyncStorage.getItem(STORAGE_KEYS.tasks),
      AsyncStorage.getItem(STORAGE_KEYS.todos),
      AsyncStorage.getItem(STORAGE_KEYS.vault),
      AsyncStorage.getItem(STORAGE_KEYS.aiProvider),
      AsyncStorage.getItem(STORAGE_KEYS.notes),
      AsyncStorage.getItem(STORAGE_KEYS.habits),
    ]);

    const payload: BackupPayload = {
      app: 'AAYON',
      version: '1.1.0',
      timestamp: new Date().toISOString(),
      profile,
      biometricPref: biometrics,
      health,
      wealth: wealthFresh || wealthLegacy,
      career,
      candidateProfile: candidateFallback,
      tasks,
      todos,
      vault,
      aiProvider,
      notes,
      habits,
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
          title: `AAYON Complete Vault Backup (${dateStr})`,
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
   * Restores an exported JSON backup into local storage and hydrates all active stores
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
      if (payload.wealth) {
        writes.push([STORAGE_KEYS.wealth, payload.wealth]);
        writes.push([STORAGE_KEYS.legacyWealth, payload.wealth]);
      }
      if (payload.career) writes.push([STORAGE_KEYS.career, payload.career]);
      if (payload.candidateProfile) {
        writes.push([STORAGE_KEYS.candidateProfile, payload.candidateProfile]);
        writes.push(['personal-app:candidate-profile-v2', payload.candidateProfile]);
      }
      if (payload.tasks) writes.push([STORAGE_KEYS.tasks, payload.tasks]);
      if (payload.todos) writes.push([STORAGE_KEYS.todos, payload.todos]);
      if (payload.vault) writes.push([STORAGE_KEYS.vault, payload.vault]);
      if (payload.aiProvider) writes.push([STORAGE_KEYS.aiProvider, payload.aiProvider]);
      if (payload.notes) writes.push([STORAGE_KEYS.notes, payload.notes]);
      if (payload.habits) writes.push([STORAGE_KEYS.habits, payload.habits]);

      await AsyncStorage.multiSet(writes);

      // Rehydrate active Zustand stores dynamically
      try {
        const { useCandidateProfileStore } = require('../../features/career/state/candidate-profile-store');
        useCandidateProfileStore.persist?.rehydrate?.();
      } catch (e) {
        console.warn('[BackupService] Candidate profile rehydrate note:', e);
      }
      try {
        const { useJobStore } = require('../../features/career/state/job-store');
        useJobStore.persist?.rehydrate?.();
      } catch (e) {
        console.warn('[BackupService] Job store rehydrate note:', e);
      }
      try {
        const { useWealthStore } = require('../../features/wealth/state/wealth-store');
        useWealthStore.persist?.rehydrate?.();
      } catch (e) {
        console.warn('[BackupService] Wealth store rehydrate note:', e);
      }
      try {
        const { useTodoStore } = require('../../features/todo/state/todo-store');
        useTodoStore.persist?.rehydrate?.();
      } catch (e) {
        console.warn('[BackupService] Todo store rehydrate note:', e);
      }
      try {
        const { useVaultStore } = require('../../features/vault/state/vault-store');
        useVaultStore.persist?.rehydrate?.();
      } catch (e) {
        console.warn('[BackupService] Vault store rehydrate note:', e);
      }
      try {
        const { useNoteStore } = require('../../features/notes/state/note-store');
        useNoteStore.persist?.rehydrate?.();
      } catch (e) {
        console.warn('[BackupService] Note store rehydrate note:', e);
      }
      try {
        const { useHabitStore } = require('../../features/today/state/habit-store');
        useHabitStore.persist?.rehydrate?.();
      } catch (e) {
        console.warn('[BackupService] Habit store rehydrate note:', e);
      }

      return true;
    } catch (err) {
      console.warn('[BackupService] Restore error:', err);
      Alert.alert('Restore Failed', 'Could not parse backup content. Ensure valid JSON format.');
      return false;
    }
  }
}
