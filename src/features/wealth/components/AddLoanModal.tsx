import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import { calculateMonthlyVatti } from '@/core/utils/vatti';
import { useWealthStore } from '../state/wealth-store';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddLoanModal: React.FC<AddLoanModalProps> = ({ visible, onClose }) => {
  const addLoan = useWealthStore((s) => s.addLoan);

  const [lenderName, setLenderName] = useState('');
  const [lenderPhone, setLenderPhone] = useState('');
  const [principalText, setPrincipalText] = useState('');
  const [rateText, setRateText] = useState('');
  const [dueDayText, setDueDayText] = useState('5');

  const principal = parseFloat(principalText) || 0;
  const rate = parseFloat(rateText) || 0;
  const dueDay = parseInt(dueDayText, 10) || 5;

  const { monthlyInterestAmount, annualInterestRatePercent } = calculateMonthlyVatti(principal, rate);

  const handleSave = () => {
    if (!lenderName.trim() || principal <= 0 || rate <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addLoan({
      lenderName: lenderName.trim(),
      lenderPhone: lenderPhone.trim(),
      principalAmount: principal,
      monthlyRatePercent: rate,
      dueDayOfMonth: dueDay,
    });

    setLenderName('');
    setLenderPhone('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>New Loan & Vatti Tracker</Text>
              <Text style={styles.sheetSub}>Record borrowed money & interest schedule</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Lender Name / Person</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Kumar Anna / Bank"
              placeholderTextColor={Colors.textMuted}
              value={lenderName}
              onChangeText={setLenderName}
            />
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1.4 }]}>
              <Text style={styles.inputLabel}>Principal Amount (₹)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={principalText}
                onChangeText={setPrincipalText}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Monthly Rate (%)</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={rateText}
                onChangeText={setRateText}
              />
            </View>

            <View style={[styles.formGroup, { flex: 0.8 }]}>
              <Text style={styles.inputLabel}>Due Day</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={dueDayText}
                onChangeText={setDueDayText}
              />
            </View>
          </View>

          {/* Live Calculated Output Box */}
          <View style={styles.calculationPreviewBox}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Calculated Monthly Vatti:</Text>
              <Text style={styles.calcValue}>{formatINR(monthlyInterestAmount)} / month</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcSub}>Effective Annual Interest:</Text>
              <Text style={styles.calcSubVal}>{annualInterestRatePercent}% per year</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcSub}>Due Date Reminder:</Text>
              <Text style={styles.calcSubVal}>Auto alert on {dueDay}th of each month</Text>
            </View>
          </View>

          {/* Save Action */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.textInverse} />
            <Text style={styles.saveBtnText}>Save Loan & Activate Notifications</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sheetSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  calculationPreviewBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    gap: 6,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
  calcValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.danger,
    fontVariant: ['tabular-nums'],
  },
  calcSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  calcSubVal: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
    marginTop: Spacing.sm,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});
