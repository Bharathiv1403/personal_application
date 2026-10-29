// KeePassDX Vault Import / Export & Clipboard Safeguards
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { VaultEntry, VaultHealthReport } from '../types';
import { PasswordGenerator } from './password-generator';

export class VaultCryptoService {
  /**
   * Evaluates the full health and vulnerability status of the vault entries.
   */
  static auditVault(entries: VaultEntry[]): VaultHealthReport {
    if (entries.length === 0) {
      return {
        totalEntries: 0,
        weakCount: 0,
        reusedCount: 0,
        oldPasswordCount: 0,
        securityScore: 100,
        weakIds: [],
        reusedIds: [],
        oldIds: [],
      };
    }

    const weakIds: string[] = [];
    const passwordUsageMap = new Map<string, string[]>();
    const oldIds: string[] = [];

    const now = Date.now();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    for (const entry of entries) {
      // 1. Weak password check
      const strength = PasswordGenerator.evaluateStrength(entry.password);
      if (strength.strength === 'very_weak' || strength.strength === 'weak') {
        weakIds.push(entry.id);
      }

      // 2. Reused password check
      if (entry.password) {
        const list = passwordUsageMap.get(entry.password) || [];
        list.push(entry.id);
        passwordUsageMap.set(entry.password, list);
      }

      // 3. Old password check (older than 90 days)
      const pwUpdatedTime = new Date(entry.passwordUpdatedAt || entry.updatedAt || entry.createdAt).getTime();
      if (!isNaN(pwUpdatedTime) && now - pwUpdatedTime > ninetyDaysMs) {
        oldIds.push(entry.id);
      }
    }

    const reusedIdsSet = new Set<string>();
    passwordUsageMap.forEach((ids) => {
      if (ids.length > 1) {
        ids.forEach((id) => reusedIdsSet.add(id));
      }
    });
    const reusedIds = Array.from(reusedIdsSet);

    // Calculate overall security score (0 to 100)
    let penalties = 0;
    penalties += (weakIds.length / entries.length) * 50;
    penalties += (reusedIds.length / entries.length) * 35;
    penalties += (oldIds.length / entries.length) * 15;

    const securityScore = Math.max(10, Math.round(100 - penalties));

    return {
      totalEntries: entries.length,
      weakCount: weakIds.length,
      reusedCount: reusedIds.length,
      oldPasswordCount: oldIds.length,
      securityScore,
      weakIds,
      reusedIds,
      oldIds,
    };
  }

  /**
   * Securely copies text to clipboard and automatically purges it after 30 seconds
   * to protect user credentials from background clipboard scrapers.
   */
  private static clipboardTimer: any = null;

  static async copySecureWithAutoPurge(text: string, label: string = 'Credential'): Promise<void> {
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (this.clipboardTimer) {
      clearTimeout(this.clipboardTimer);
    }

    // Auto-purge clipboard after 30 seconds
    this.clipboardTimer = setTimeout(async () => {
      try {
        const current = await Clipboard.getStringAsync();
        if (current === text) {
          await Clipboard.setStringAsync('');
        }
      } catch {
        // ignore
      }
    }, 30000);
  }

  /**
   * Generates a KeePassDX-compatible JSON export payload.
   */
  static exportVaultJSON(entries: VaultEntry[], appVersion: string = '1.1.0'): string {
    const payload = {
      generator: 'KeePassDX-Engine-AAYON',
      exportedAt: new Date().toISOString(),
      version: appVersion,
      entryCount: entries.length,
      entries,
    };
    return JSON.stringify(payload, null, 2);
  }

  /**
   * Imports entries from JSON / KeePass export formats.
   */
  static importVaultJSON(jsonString: string): VaultEntry[] {
    try {
      const parsed = JSON.parse(jsonString);
      let list: any[] = [];
      if (Array.isArray(parsed)) {
        list = parsed;
      } else if (parsed && Array.isArray(parsed.entries)) {
        list = parsed.entries;
      } else if (parsed && Array.isArray(parsed.items)) {
        list = parsed.items; // Bitwarden format
      }

      const imported: VaultEntry[] = [];
      const now = new Date().toISOString();

      for (const item of list) {
        if (!item) continue;
        const entry: VaultEntry = {
          id: item.id || `vault_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          title: item.title || item.name || 'Untitled Entry',
          username: item.username || item.login?.username || '',
          password: item.password || item.login?.password || '',
          url: item.url || item.login?.uris?.[0]?.uri || undefined,
          totpSecret: item.totpSecret || item.login?.totp || undefined,
          group: (item.group || item.type || 'logins') as any,
          notes: item.notes || '',
          customFields: item.customFields || [],
          tags: item.tags || [],
          isFavorite: !!item.isFavorite,
          history: item.history || [],
          createdAt: item.createdAt || now,
          updatedAt: item.updatedAt || now,
          passwordUpdatedAt: item.passwordUpdatedAt || now,
        };
        imported.push(entry);
      }
      return imported;
    } catch {
      return [];
    }
  }
}
