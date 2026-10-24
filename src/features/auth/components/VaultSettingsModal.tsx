import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useAuthStore } from '../state/auth-store';
import { BackupService } from '@/core/utils/backup-service';

interface VaultSettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const VaultSettingsModal: React.FC<VaultSettingsModalProps> = ({ visible, onClose }) => {
  const user = useAuthStore((s) => s.user);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const signOut = useAuthStore((s) => s.signOut);
  const resetAccount = useAuthStore((s) => s.resetAccount);

  const [restoreText, setRestoreText] = useState('');
  const [showRestoreInput, setShowRestoreInput] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExportBackup = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsExporting(true);
    await BackupService.exportAndShare();
    setIsExporting(false);
  };

  const handleRestoreSubmit = async () => {
    if (!restoreText.trim()) {
      Alert.alert('Empty Content', 'Please paste the JSON backup payload to restore.');
      return;
    }

    Alert.alert(
      'Confirm Vault Restore',
      'This will restore all loans, gold holdings, job pipeline, and tasks from your backup file.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          onPress: async () => {
            const success = await BackupService.restoreBackup(restoreText);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              Alert.alert('Vault Restored! 🎉', 'Your backup was restored successfully. Please restart or unlock to see updated records.');
              setShowRestoreInput(false);
              setRestoreText('');
              onClose();
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Vault Security & Backup</Text>
              <Text style={styles.subtitle}>WhatsApp & Google Drive Sync</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* User Profile Card */}
            <GlassCard variant="highlight" style={styles.card}>
              <View style={styles.profileRow}>
                <View style={styles.avatar}>
                  <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.profileName}>{user?.name || 'Vault User'}</Text>
                  <Text style={styles.profileEmail}>{user?.email || 'Local Encrypted Session'}</Text>
                </View>
                <Badge
                  label={isBiometricEnabled ? 'Biometrics On' : 'PIN Lock'}
                  variant={isBiometricEnabled ? 'primary' : 'neutral'}
                />
              </View>
            </GlassCard>

            {/* 1. WhatsApp-Style Backup */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>1. Cloud & Chat Backup (WhatsApp Pattern)</Text>
            </View>

            <GlassCard style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconCircleDrive}>
                  <Ionicons name="cloud-upload-outline" size={22} color={Colors.cyan} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>One-Tap Vault Export</Text>
                  <Text style={styles.actionDesc}>
                    Packages your loans, gold assets, career records & tasks. Share directly to WhatsApp, Google Drive, or Gmail.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.exportBtn, isExporting && { opacity: 0.6 }]}
                onPress={handleExportBackup}
                disabled={isExporting}
              >
                <Ionicons name="logo-whatsapp" size={18} color={Colors.textInverse} />
                <Text style={styles.exportBtnText}>
                  {isExporting ? 'Packaging...' : 'Backup to WhatsApp / Drive 📤'}
                </Text>
              </TouchableOpacity>
            </GlassCard>

            {/* 2. Restore Backup */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>2. Restore From Existing Backup</Text>
            </View>

            <GlassCard style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconCircleRestore}>
                  <Ionicons name="download-outline" size={22} color={Colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionTitle}>Restore Previous Vault</Text>
                  <Text style={styles.actionDesc}>
                    Switched to a new phone? Paste your backup content below to restore all your data instantly.
                  </Text>
                </View>
              </View>

              {!showRestoreInput ? (
                <TouchableOpacity
                  style={styles.restoreToggleBtn}
                  onPress={() => setShowRestoreInput(true)}
                >
                  <Ionicons name="document-text-outline" size={16} color={Colors.textPrimary} />
                  <Text style={styles.restoreToggleText}>Paste & Restore Backup</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.restoreBox}>
                  <TextInput
                    style={styles.restoreInput}
                    value={restoreText}
                    onChangeText={setRestoreText}
                    placeholder="Paste your AAYON backup JSON code here..."
                    placeholderTextColor={Colors.textMuted}
                    multiline
                    numberOfLines={4}
                  />
                  <View style={styles.restoreActions}>
                    <TouchableOpacity
                      style={styles.restoreCancelBtn}
                      onPress={() => setShowRestoreInput(false)}
                    >
                      <Text style={styles.restoreCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.restoreConfirmBtn}
                      onPress={handleRestoreSubmit}
                    >
                      <Text style={styles.restoreConfirmText}>Confirm Restore</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </GlassCard>

            {/* Session Management */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>3. Security & Session</Text>
            </View>

            <View style={styles.sessionActionsRow}>
              <TouchableOpacity
                style={styles.lockActionBtn}
                onPress={() => {
                  onClose();
                  signOut();
                }}
              >
                <Ionicons name="lock-closed-outline" size={16} color={Colors.textPrimary} />
                <Text style={styles.lockActionText}>Lock Session</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.resetActionBtn}
                onPress={() => {
                  Alert.alert(
                    'Reset Vault?',
                    'This erases your PIN and profile lock. Local data will remain unless cleared in app storage.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Reset Credentials',
                        style: 'destructive',
                        onPress: () => {
                          onClose();
                          resetAccount();
                        },
                      },
                    ]
                  );
                }}
              >
                <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                <Text style={styles.resetActionText}>Reset Credentials</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '90%',
    paddingBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: Colors.primaryGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  sectionHeader: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
  },
  cardTop: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  iconCircleDrive: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.cyanGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleRestore: {
    width: 40,
    height: 40,
    borderRadius: Radii.full,
    backgroundColor: Colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  actionDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366', // WhatsApp Brand Green
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
  },
  exportBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  restoreToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSubtle || '#27272A',
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restoreToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  restoreBox: {
    gap: Spacing.sm,
  },
  restoreInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.sm,
    color: Colors.textPrimary,
    fontSize: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  restoreActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  restoreCancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  restoreCancelText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  restoreConfirmBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.sm,
  },
  restoreConfirmText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  sessionActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  lockActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
  },
  lockActionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  resetActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.dangerGlow,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
  },
  resetActionText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '600',
  },
});
