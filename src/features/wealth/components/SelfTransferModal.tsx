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
import { formatINR } from '@/core/utils/currency';
import { useWealthStore } from '../state/wealth-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const SelfTransferModal: React.FC<Props> = ({ visible, onClose }) => {
  const [transferType, setTransferType] = useState<'atm' | 'bank_transfer'>('atm');
  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  const accounts = useWealthStore((s) => s.accounts);
  const addTransaction = useWealthStore((s) => s.addTransaction);
  const addAccount = useWealthStore((s) => s.addAccount);

  React.useEffect(() => {
    if (visible && accounts.length > 0) {
      setAmount('');
      // Default from account to first bank account
      const bankAcc = accounts.find((a) => a.type === 'bank') || accounts[0];
      setFromAccountId(bankAcc.id);

      // Default to account to cash account if ATM, or second account
      const cashAcc = accounts.find((a) => a.type === 'cash');
      if (cashAcc) {
        setToAccountId(cashAcc.id);
      } else if (accounts.length > 1) {
        setToAccountId(accounts[1].id);
      }
    }
  }, [visible, accounts]);

  const handleSave = () => {
    const num = parseFloat(amount.trim());
    if (isNaN(num) || num <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid transfer amount.');
      return;
    }

    if (!fromAccountId) {
      Alert.alert('Select Source', 'Please select source bank account.');
      return;
    }

    let targetId = toAccountId;

    // If ATM withdrawal and no cash account exists, auto-create "Cash in Hand" account
    if (transferType === 'atm') {
      let cashAcc = accounts.find((a) => a.type === 'cash');
      if (!cashAcc) {
        addAccount({
          name: 'Cash in Hand (பணம்)',
          type: 'cash',
          balance: 0,
          icon: 'cash',
          color: '#10B981',
        });
        // Find newly added cash account
        const updatedAccounts = useWealthStore.getState().accounts;
        const newCash = updatedAccounts.find((a) => a.type === 'cash');
        if (newCash) targetId = newCash.id;
      } else {
        targetId = cashAcc.id;
      }
    }

    if (fromAccountId === targetId) {
      Alert.alert('Same Account', 'Source and destination accounts cannot be the same.');
      return;
    }

    const sourceAcc = accounts.find((a) => a.id === fromAccountId);
    if (sourceAcc && sourceAcc.balance < num) {
      Alert.alert('Insufficient Balance', `${sourceAcc.name} has only ${formatINR(sourceAcc.balance)}.`);
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addTransaction({
      type: 'transfer',
      title: transferType === 'atm' ? 'ATM Cash Withdrawal' : 'Self Transfer',
      amount: num,
      categoryId: 'misc',
      accountId: fromAccountId,
      toAccountId: targetId,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: transferType === 'atm' ? 'Cash' : 'Net Banking',
    });

    onClose();
    Alert.alert(
      'Transfer Successful',
      transferType === 'atm'
        ? `${formatINR(num)} withdrawn from ATM and added to Cash in Hand.`
        : `${formatINR(num)} transferred successfully.`
    );
  };

  const quickPicks = [500, 1000, 2000, 5000];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Self Transfer / ATM Cash</Text>
              <Text style={styles.modalSubtitle}>Bank-to-Cash ATM withdrawal or Bank-to-Bank</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Type Selector */}
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, transferType === 'atm' && styles.typeBtnActive]}
                onPress={() => setTransferType('atm')}
              >
                <Ionicons
                  name="cash"
                  size={16}
                  color={transferType === 'atm' ? '#FFFFFF' : Colors.textMuted}
                />
                <Text style={[styles.typeBtnText, transferType === 'atm' && styles.typeBtnTextActive]}>
                  ATM Cash (பணம் எடுத்தல்)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, transferType === 'bank_transfer' && styles.typeBtnActive]}
                onPress={() => setTransferType('bank_transfer')}
              >
                <Ionicons
                  name="swap-horizontal"
                  size={16}
                  color={transferType === 'bank_transfer' ? '#FFFFFF' : Colors.textMuted}
                />
                <Text style={[styles.typeBtnText, transferType === 'bank_transfer' && styles.typeBtnTextActive]}>
                  Bank to Bank
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Amount Chips */}
            <Text style={styles.fieldLabel}>Quick Amount</Text>
            <View style={styles.quickPickRow}>
              {quickPicks.map((v) => (
                <TouchableOpacity
                  key={v}
                  style={styles.quickPickBtn}
                  onPress={() => {
                    setAmount(v.toString());
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }}
                >
                  <Text style={styles.quickPickText}>{formatINR(v)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Amount Input */}
            <Text style={styles.fieldLabel}>Withdrawal / Transfer Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Source Account */}
            <Text style={styles.fieldLabel}>Withdraw From (Source Bank Account)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {accounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={[styles.accountChip, fromAccountId === acc.id && styles.accountChipActive]}
                  onPress={() => setFromAccountId(acc.id)}
                >
                  <Ionicons
                    name={acc.type === 'cash' ? 'cash' : 'business'}
                    size={14}
                    color={fromAccountId === acc.id ? '#FFFFFF' : Colors.textMuted}
                  />
                  <Text style={[styles.accountChipText, fromAccountId === acc.id && styles.accountChipTextActive]}>
                    {acc.name} ({formatINR(acc.balance)})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Destination Account (if bank to bank) */}
            {transferType === 'bank_transfer' && (
              <>
                <Text style={styles.fieldLabel}>Transfer To (Destination Account)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {accounts
                    .filter((a) => a.id !== fromAccountId)
                    .map((acc) => (
                      <TouchableOpacity
                        key={acc.id}
                        style={[styles.accountChip, toAccountId === acc.id && styles.accountChipActive]}
                        onPress={() => setToAccountId(acc.id)}
                      >
                        <Ionicons
                          name={acc.type === 'cash' ? 'cash' : 'business'}
                          size={14}
                          color={toAccountId === acc.id ? '#FFFFFF' : Colors.textMuted}
                        />
                        <Text style={[styles.accountChipText, toAccountId === acc.id && styles.accountChipTextActive]}>
                          {acc.name} ({formatINR(acc.balance)})
                        </Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </>
            )}

            {transferType === 'atm' && (
              <View style={styles.infoBox}>
                <Ionicons name="information-circle-outline" size={16} color="#38BDF8" />
                <Text style={styles.infoText}>
                  Bank balance-la irundhu kuraindhu, ungaloda 'Cash in Hand' pocket cash-kku automatic-ah maarum.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {transferType === 'atm' ? 'Complete ATM Withdrawal' : 'Transfer Funds'}
              </Text>
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
    backgroundColor: 'rgba(0,0,0,0.80)',
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
  typeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: 3,
    marginBottom: Spacing.md,
    gap: 4,
  },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
  },
  typeBtnActive: {
    backgroundColor: Colors.primary,
  },
  typeBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  typeBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickPickRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  quickPickBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
  },
  quickPickText: {
    fontSize: 12,
    color: '#38BDF8',
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
    marginBottom: 6,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
    gap: 6,
  },
  accountChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  accountChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  accountChipTextActive: {
    color: '#FFFFFF',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: Radii.md,
    padding: 10,
    marginTop: 8,
    marginBottom: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.md,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
