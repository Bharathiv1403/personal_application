import { Linking, Platform } from 'react-native';
import packageJson from '../../../package.json';

export interface AppReleaseInfo {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  releaseTitle?: string;
  releaseNotes?: string;
  downloadUrl?: string;
  publishedAt?: string;
}

const GITHUB_REPO = 'Bharathiv1403/personal_application';
const GITHUB_RELEASES_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

/**
 * Compares two semantic version strings (e.g. "1.1.0" vs "1.2.0" or "v1.2.0")
 * Returns > 0 if v1 > v2, < 0 if v1 < v2, 0 if equal
 */
function compareVersions(v1: string, v2: string): number {
  const clean1 = v1.replace(/^v/, '').trim();
  const clean2 = v2.replace(/^v/, '').trim();

  const parts1 = clean1.split('.').map((p) => parseInt(p, 10) || 0);
  const parts2 = clean2.split('.').map((p) => parseInt(p, 10) || 0);

  const maxLen = Math.max(parts1.length, parts2.length);
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] ?? 0;
    const num2 = parts2[i] ?? 0;
    if (num1 > num2) return 1;
    if (num1 < num2) return -1;
  }
  return 0;
}

export class UpdateCheckerService {
  /**
   * Fetches latest release from GitHub and checks if a newer APK is available
   */
  static async checkForUpdates(): Promise<AppReleaseInfo> {
    const currentVersion = packageJson.version || '1.1.0';

    try {
      const response = await fetch(GITHUB_RELEASES_API, {
        headers: {
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return {
          hasUpdate: false,
          currentVersion,
          latestVersion: currentVersion,
        };
      }

      const releaseData = await response.json();
      const latestTag = releaseData.tag_name || '';
      const latestVersion = latestTag.replace(/^v/, '');

      // Find apk asset in release
      const apkAsset = Array.isArray(releaseData.assets)
        ? releaseData.assets.find((asset: any) =>
            asset.name?.toLowerCase().endsWith('.apk')
          )
        : null;

      const downloadUrl =
        apkAsset?.browser_download_url || releaseData.html_url || '';

      const hasUpdate = compareVersions(latestVersion, currentVersion) > 0;

      return {
        hasUpdate,
        currentVersion,
        latestVersion,
        releaseTitle: releaseData.name || `Version ${latestVersion}`,
        releaseNotes: releaseData.body || 'Performance improvements and bug fixes.',
        downloadUrl,
        publishedAt: releaseData.published_at,
      };
    } catch (err) {
      console.warn('[UpdateCheckerService] Check failed:', err);
      return {
        hasUpdate: false,
        currentVersion,
        latestVersion: currentVersion,
      };
    }
  }

  /**
   * Open APK download URL in browser/package installer
   */
  static async downloadUpdate(downloadUrl?: string): Promise<boolean> {
    if (!downloadUrl) return false;
    try {
      const supported = await Linking.canOpenURL(downloadUrl);
      if (supported) {
        await Linking.openURL(downloadUrl);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}
