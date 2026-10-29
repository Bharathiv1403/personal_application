import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useWealthStore } from '../state/wealth-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const RestoreBackupModal: React.FC<Props> = ({ visible, onClose }) => {
  const [jsonInput, setJsonInput] = useState('');
  const restoreBackupData = useWealthStore((s) => s.restoreBackupData);

  React.useEffect(() => {
    if (visible) {
      setJsonInput('');
    }
  }, [visible]);

  // Try parsing preview
  let previewStats: {
    accounts?: number;
    transactions?: number;
    trips?: number;
    debts?: number;
    date?: string;
  } | null = null;

  try {
    if (jsonInput.trim().startsWith('{')) {
      const parsed = JSON.parse(jsonInput.trim());
      previewStats = {
        accounts: Array.isArray(parsed.accounts) ? parsed.accounts.length : 0,
        transactions: Array.isArray(parsed.transactions) ? parsed.transactions.length : 0,
        trips: Array.isArray(parsed.trips) ? parsed.trips.length : 0,
        debts: Array.isArray(parsed.peerDebts) ? parsed.peerDebts.length : 0,
        date: parsed.exportedAt,
      };
    }
  } catch {
    previewStats = null;
  }

  const handleRestore = () => {
    if (!jsonInput.trim()) {
      Alert.alert('Empty Input', 'Please paste the backup JSON text.');
      return;
    }

    Alert.alert(
      'Confirm Data Restore',
      'This will merge/restore your backed-up accounts, transactions, trips, and khata records. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now ✅',
          onPress: () => {
            const success = restoreBackupData(jsonInput.trim());
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
              Alert.alert('Success!', 'All your financial records have been restored successfully.');
              onClose();
            } else {
              Alert.alert('Invalid Backup', 'The pasted text is not a valid backup JSON format.');
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Restore Backup Data</Text>
              <Text style={styles.modalSubtitle}>Paste your exported JSON backup to recover records</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.fieldLabel}>Paste Backup JSON Text *</Text>
            <TextInput
              style={styles.textArea}
              placeholder='Paste JSON here: {"version":"1.0", "accounts":[...], ...}'
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={8}
              value={jsonInput}
              onChangeText={setJsonInput}
            />

            {previewStats && (
              <View style={styles.previewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <Ionicons name="checkmark-circle" size={18} color="#4ADE80" />
                  <Text style={styles.previewTitle}>Valid Backup Detected</Text>
                </View>
                <Text style={styles.previewMeta}>
                  • Accounts: {previewStats.accounts} | Transactions: {previewStats.transactions}
                </Text>
                <Text style={styles.previewMeta}>
                  • Trips: {previewStats.trips} | Khata Debts: {previewStats.debts}
                </Text>
                {previewStats.date && (
                  <Text style={styles.previewDate}>
                    Exported: {new Date(previewStats.date).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity
              style={[styles.restoreBtn, !previewStats && { opacity: 0.7 }]}
              onPress={handleRestore}
            >
              <Ionicons name="cloud-upload" size={18} color="#FFFFFF" />
              <Text style={styles.restoreBtnText}>Restore Financial Data</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#11131B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textArea: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 140,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  previewCard: {
    backgroundColor: 'rgba(74, 222, 128, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(74, 222, 128, 0.25)',
    borderRadius: Radii.lg,
    padding: 12,
    marginBottom: 14,
  },
  previewTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ADE80',
  },
  previewMeta: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  previewDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
  },
  restoreBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    gap: 8,
  },
  restoreBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
