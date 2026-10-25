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
import { useWealthStore, AccountType } from '../state/wealth-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AddAccountModal: React.FC<Props> = ({ visible, onClose }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState<AccountType>('bank');
  const [balance, setBalance] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [accountNumber, setAccountNumber] = useState('');

  const addAccount = useWealthStore((s) => s.addAccount);

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Name', 'Please enter account or card name.');
      return;
    }

    const numBalance = parseFloat(balance.trim()) || 0;
    const numLimit = parseFloat(creditLimit.trim()) || 0;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const color =
      type === 'bank' ? '#2563EB' : type === 'cash' ? '#D97706' : type === 'credit_card' ? '#DC2626' : '#8B5CF6';

    const icon =
      type === 'bank' ? 'business' : type === 'cash' ? 'cash' : type === 'credit_card' ? 'card' : 'wallet';

    addAccount({
      name: name.trim(),
      type,
      balance: numBalance,
      creditLimit: type === 'credit_card' ? numLimit : undefined,
      accountNumberMasked: accountNumber.trim() ? `•••• ${accountNumber.trim().slice(-4)}` : undefined,
      icon,
      color,
    });

    setName('');
    setBalance('');
    setCreditLimit('');
    setAccountNumber('');
    onClose();
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
              <Text style={styles.modalTitle}>Add Account or Card</Text>
              <Text style={styles.modalSubtitle}>Link bank, cash wallet or credit card</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Account Type Tabs */}
          <View style={styles.typeRow}>
            {(['bank', 'cash', 'credit_card', 'wallet'] as AccountType[]).map((t) => {
              const isSelected = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeChip, isSelected && styles.typeChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setType(t);
                  }}
                >
                  <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                    {t === 'credit_card' ? 'Credit Card' : t.charAt(0).toUpperCase() + t.slice(1)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Name */}
          <Text style={styles.fieldLabel}>Account / Card Name *</Text>
          <TextInput
            style={styles.textInput}
            placeholder={
              type === 'bank'
                ? 'e.g. SBI Salary, ICICI Savings'
                : type === 'credit_card'
                ? 'e.g. HDFC Regalia, Axis Magnus'
                : 'e.g. Daily Cash Wallet'
            }
            placeholderTextColor={Colors.textMuted}
            value={name}
            onChangeText={setName}
          />

          {/* Balance or Due */}
          <Text style={styles.fieldLabel}>
            {type === 'credit_card' ? 'Current Outstanding Due (₹)' : 'Current Balance (₹)'}
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="0"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            value={balance}
            onChangeText={setBalance}
          />

          {/* Credit Limit (If Credit Card) */}
          {type === 'credit_card' && (
            <>
              <Text style={styles.fieldLabel}>Credit Limit (₹)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 150000"
                placeholderTextColor={Colors.textMuted}
                keyboardType="numeric"
                value={creditLimit}
                onChangeText={setCreditLimit}
              />
            </>
          )}

          {/* Masked Last 4 Digits */}
          <Text style={styles.fieldLabel}>Last 4 Digits (Optional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 4892"
            placeholderTextColor={Colors.textMuted}
            keyboardType="numeric"
            maxLength={4}
            value={accountNumber}
            onChangeText={setAccountNumber}
          />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="add-circle" size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#12131A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 4,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radii.md,
  },
  typeChipActive: {
    backgroundColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.xl,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
