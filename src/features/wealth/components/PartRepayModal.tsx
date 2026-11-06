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
import { recalculateAfterPartPayment } from '@/core/utils/vatti';
import { useWealthStore, LoanItem } from '../state/wealth-store';

interface PartRepayModalProps {
  visible: boolean;
  loan: LoanItem | null;
  onClose: () => void;
}

export const PartRepayModal: React.FC<PartRepayModalProps> = ({ visible, loan, onClose }) => {
  const partRepayPrincipal = useWealthStore((s) => s.partRepayPrincipal);
  const accounts = useWealthStore((s) => s.accounts);

  const [amountText, setAmountText] = useState('50000');
  const [selectedAccountId, setSelectedAccountId] = useState(
    accounts.find((a) => a.type === 'cash' || a.type === 'bank' || a.type === 'wallet')?.id || accounts[0]?.id || 'acc-cash'
  );
  const repayAmount = parseFloat(amountText) || 0;

  if (!loan) return null;

  const { newPrincipal, newMonthlyInterest } = recalculateAfterPartPayment(
    loan.principalAmount,
    repayAmount,
    loan.monthlyRatePercent
  );

  const handleConfirm = () => {
    if (repayAmount <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    partRepayPrincipal(loan.id, repayAmount, selectedAccountId);
    setAmountText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.sheetTitle} numberOfLines={1}>
                Part-Repay Principal
              </Text>
              <Text style={styles.sheetSub} numberOfLines={1}>
                Reduce debt for {loan.lenderName} & lower next month's vatti
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={20} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Current Status */}
          <View style={styles.currentStatusBox}>
            <View>
              <Text style={styles.csLabel}>Current Principal</Text>
              <Text style={styles.csValue}>{formatINR(loan.principalAmount)}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.csLabel}>Current Interest</Text>
              <Text style={styles.csInterest}>{formatINR(loan.monthlyInterestAmount)} / mo</Text>
            </View>
          </View>

          {/* Amount to Repay */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Principal Return Amount (₹)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              placeholder="e.g. 50000"
              placeholderTextColor={Colors.textMuted}
              value={amountText}
              onChangeText={setAmountText}
            />
          </View>

          {/* Quick Amount Chips */}
          <View style={styles.quickChipsRow}>
            {[10000, 25000, 50000, 100000].map((amt) => (
              <TouchableOpacity
                key={amt}
                style={styles.chip}
                onPress={() => setAmountText(amt.toString())}
              >
                <Text style={styles.chipText}>+{formatINR(amt)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* New Recalculated Preview */}
          <View style={styles.recalculatedBox}>
            <View style={styles.recalcRow}>
              <Text style={styles.recalcLabel}>New Remaining Principal:</Text>
              <Text style={styles.recalcValue}>{formatINR(newPrincipal)}</Text>
            </View>
            <View style={styles.recalcRow}>
              <Text style={styles.recalcLabel}>Next Month Adjusted Vatti:</Text>
              <Text style={styles.recalcHighlight}>{formatINR(newMonthlyInterest)} / mo</Text>
            </View>
            <Text style={styles.savingsNote}>
              💡 You will save{' '}
              {formatINR(loan.monthlyInterestAmount - newMonthlyInterest)} in interest every month!
            </Text>
          </View>

          {/* Deduct From Account */}
          <View style={[styles.formGroup, { marginTop: Spacing.sm }]}>
            <Text style={styles.inputLabel}>Deduct From Account</Text>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    onPress={() => setSelectedAccountId(acc.id)}
                    style={[styles.accountChip, isSelected && styles.accountChipSelected]}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={13}
                      color={isSelected ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.accountChipText, isSelected && styles.accountChipTextSelected]}>
                      {acc.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Confirm Button */}
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.textInverse} />
            <Text style={styles.confirmBtnText}>Confirm Principal Repayment</Text>
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
    marginBottom: Spacing.md,
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentStatusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
  },
  csLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  csValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  csInterest: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.danger,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  formGroup: {
    marginBottom: Spacing.sm,
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
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  quickChipsRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  chipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  recalculatedBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginVertical: Spacing.sm,
    gap: 6,
  },
  recalcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recalcLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  recalcValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  recalcHighlight: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
  },
  savingsNote: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 4,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
    marginTop: Spacing.md,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  accountChipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.primary,
  },
  accountChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  accountChipTextSelected: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
});
