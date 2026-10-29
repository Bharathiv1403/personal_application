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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import { PeerDebt, useWealthStore } from '../state/wealth-store';

interface Props {
  visible: boolean;
  debt: PeerDebt | null;
  onClose: () => void;
}

export const PartialPaymentModal: React.FC<Props> = ({ visible, debt, onClose }) => {
  const [amount, setAmount] = useState('');
  const recordPartialPayment = useWealthStore((s) => s.recordPeerDebtPartialPayment);

  React.useEffect(() => {
    if (visible) {
      setAmount('');
    }
  }, [visible]);

  if (!debt) return null;

  const isGave = debt.type === 'gave';
  const total = debt.amount;
  const alreadyPaid = debt.paidAmount || 0;
  const remaining = Math.max(0, total - alreadyPaid);

  const handleSave = () => {
    const num = parseFloat(amount.trim());
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (num > remaining) {
      Alert.alert(
        'Amount Exceeds Balance',
        `The pending balance is only ${formatINR(remaining)}. Enter up to ${formatINR(remaining)}.`
      );
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    recordPartialPayment(debt.id, num);
    onClose();
  };

  const quickPicks = [
    Math.round(remaining * 0.25),
    Math.round(remaining * 0.5),
    remaining,
  ].filter((v, idx, arr) => v > 0 && arr.indexOf(v) === idx);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>
                {isGave ? 'Received Partial Payment' : 'Paid Partial Amount'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {debt.personName} • {isGave ? "You'll get back" : 'You owe'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Balance Breakdown Card */}
          <View style={styles.breakdownBox}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Total Amount</Text>
              <Text style={styles.breakdownVal}>{formatINR(total)}</Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Already Paid</Text>
              <Text style={[styles.breakdownVal, { color: '#38BDF8' }]}>
                {formatINR(alreadyPaid)}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownLabel}>Remaining</Text>
              <Text style={[styles.breakdownVal, { color: isGave ? '#4ADE80' : '#F87171' }]}>
                {formatINR(remaining)}
              </Text>
            </View>
          </View>

          {/* Quick Amounts */}
          <Text style={styles.fieldLabel}>Quick Amount</Text>
          <View style={styles.quickPickRow}>
            {quickPicks.map((val) => (
              <TouchableOpacity
                key={val}
                style={styles.quickPickBtn}
                onPress={() => {
                  setAmount(val.toString());
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }}
              >
                <Text style={styles.quickPickText}>
                  {val === remaining ? `Full ${formatINR(val)}` : formatINR(val)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom Input */}
          <Text style={styles.fieldLabel}>Amount Paid Today (₹) *</Text>
          <TextInput
            style={styles.textInput}
            placeholder={`Enter up to ${remaining}`}
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Update Partial Balance</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: '#11131B',
    borderRadius: 24,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  breakdownBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  breakdownItem: {
    flex: 1,
    alignItems: 'center',
  },
  breakdownLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  breakdownVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  quickPickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
  },
  quickPickText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 15,
    marginBottom: Spacing.lg,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    gap: 6,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
