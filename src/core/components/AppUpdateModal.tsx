import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { AppReleaseInfo, UpdateCheckerService } from '@/core/services/update-checker';

interface AppUpdateModalProps {
  visible: boolean;
  releaseInfo: AppReleaseInfo | null;
  onClose: () => void;
}

export const AppUpdateModal: React.FC<AppUpdateModalProps> = ({
  visible,
  releaseInfo,
  onClose,
}) => {
  if (!releaseInfo) return null;

  const handleDownload = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (releaseInfo.downloadUrl) {
      await UpdateCheckerService.downloadUpdate(releaseInfo.downloadUrl);
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Ionicons name="rocket-outline" size={28} color={Colors.primary} />
          </View>

          <Text style={styles.title}>New Update Available! 🚀</Text>
          <Text style={styles.subtitle}>
            A newer version of AAYON is ready to install.
          </Text>

          {/* Version Pill */}
          <View style={styles.versionRow}>
            <View style={styles.versionPillOld}>
              <Text style={styles.versionTextOld}>Current: v{releaseInfo.currentVersion}</Text>
            </View>
            <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
            <View style={styles.versionPillNew}>
              <Text style={styles.versionTextNew}>New: v{releaseInfo.latestVersion}</Text>
            </View>
          </View>

          {/* Release Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.notesTitle}>What's New in this Build:</Text>
            <ScrollView style={styles.notesScroll} showsVerticalScrollIndicator={true}>
              <Text style={styles.notesBody}>
                {releaseInfo.releaseNotes || 'Bug fixes, performance boosts, and UI enhancements.'}
              </Text>
            </ScrollView>
          </View>

          {/* Actions */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.laterBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                onClose();
              }}
            >
              <Text style={styles.laterBtnText}>Later</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.updateBtn} onPress={handleDownload}>
              <Ionicons name="download-outline" size={16} color="#FFFFFF" />
              <Text style={styles.updateBtnText}>Download & Update</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#12131A',
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderWidth: 1,
    borderRadius: Radii.xl,
    padding: Spacing.xl,
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  versionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  versionPillOld: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
  },
  versionTextOld: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  versionPillNew: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    borderColor: 'rgba(99, 102, 241, 0.5)',
    borderWidth: 1,
  },
  versionTextNew: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  notesContainer: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesScroll: {
    maxHeight: 120,
  },
  notesBody: {
    fontSize: 13,
    color: Colors.textPrimary,
    lineHeight: 18,
  },
  actionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: Spacing.sm,
  },
  laterBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  updateBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
  },
  updateBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
