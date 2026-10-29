import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useWealthStore, TransactionType, PaymentMethod, Transaction } from '../state/wealth-store';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultType?: TransactionType;
  initialTransaction?: Transaction | null;
}

export const AddTransactionModal: React.FC<Props> = ({
  visible,
  onClose,
  defaultType = 'expense',
  initialTransaction,
}) => {
  const [type, setType] = useState<TransactionType>(defaultType);
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('food');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedToAccountId, setSelectedToAccountId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');

  const accounts = useWealthStore((s) => s.accounts);
  const categories = useWealthStore((s) => s.categories);
  const addTransaction = useWealthStore((s) => s.addTransaction);
  const updateTransaction = useWealthStore((s) => s.updateTransaction);

  // Set default account / populate editing transaction when modal opens
  React.useEffect(() => {
    if (visible) {
      if (initialTransaction) {
        setType(initialTransaction.type);
        setAmount(initialTransaction.amount.toString());
        setTitle(initialTransaction.title);
        setSelectedCategoryId(initialTransaction.categoryId);
        setSelectedAccountId(initialTransaction.accountId);
        setSelectedToAccountId(initialTransaction.toAccountId || '');
        setPaymentMethod(initialTransaction.paymentMethod || 'UPI');
        setMerchant(initialTransaction.merchant || '');
        setDescription(initialTransaction.description || '');
      } else {
        setType(defaultType);
        setAmount('');
        setTitle('');
        setMerchant('');
        setDescription('');
        setPaymentMethod('UPI');
        if (accounts.length > 0) {
          setSelectedAccountId(accounts[0].id);
          if (accounts.length > 1) setSelectedToAccountId(accounts[1].id);
        }
      }
    }
  }, [visible, initialTransaction, accounts, defaultType]);

  const filteredCategories = categories.filter((c) =>
    type === 'expense' ? c.type === 'expense' : c.type === 'income'
  );

  const handleSave = () => {
    const numAmount = parseFloat(amount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Required Title', 'Please enter a title or note for this transaction.');
      return;
    }

    if (!selectedAccountId) {
      Alert.alert('Select Account', 'Please select a valid account.');
      return;
    }

    if (type === 'transfer' && selectedAccountId === selectedToAccountId) {
      Alert.alert('Invalid Transfer', 'Source and destination accounts must be different.');
      return;
    }

    const executeSave = () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      if (initialTransaction) {
        updateTransaction(initialTransaction.id, {
          type,
          title: title.trim(),
          amount: numAmount,
          categoryId: type === 'transfer' ? 'misc' : selectedCategoryId,
          accountId: selectedAccountId,
          toAccountId: type === 'transfer' ? selectedToAccountId : undefined,
          paymentMethod,
          merchant: merchant.trim() || undefined,
          description: description.trim() || undefined,
        });
      } else {
        addTransaction({
          type,
          title: title.trim(),
          amount: numAmount,
          categoryId: type === 'transfer' ? 'misc' : selectedCategoryId,
          accountId: selectedAccountId,
          toAccountId: type === 'transfer' ? selectedToAccountId : undefined,
          date: new Date().toISOString().slice(0, 10),
          paymentMethod,
          merchant: merchant.trim() || undefined,
          description: description.trim() || undefined,
        });
      }

      setAmount('');
      setTitle('');
      setMerchant('');
      setDescription('');
      onClose();
    };

    // Budget overspend alert check
    if (type === 'expense') {
      const budgets = useWealthStore.getState().budgets;
      const targetBudget = budgets.find((b) => b.categoryId === selectedCategoryId);
      if (targetBudget && targetBudget.amount > 0) {
        const currentSpend = useWealthStore.getState().transactions
          .filter((t) => t.type === 'expense' && t.categoryId === selectedCategoryId && t.id !== initialTransaction?.id)
          .reduce((sum, t) => sum + t.amount, 0);

        if (currentSpend + numAmount > targetBudget.amount) {
          const excess = Math.round(currentSpend + numAmount - targetBudget.amount);
          const catName = categories.find((c) => c.id === selectedCategoryId)?.name || 'this category';
          Alert.alert(
            '⚠️ Budget Warning',
            `Adding this ₹${numAmount} will exceed your monthly ${catName} budget (₹${targetBudget.amount}) by ₹${excess}.\n\nDo you want to proceed?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Proceed Anyway', style: 'destructive', onPress: executeSave },
            ]
          );
          return;
        }
      }
    }

    executeSave();
  };

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
              <Text style={styles.modalTitle}>
                {initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
              </Text>
              <Text style={styles.modalSubtitle}>
                {initialTransaction
                  ? 'Update amount, category or account'
                  : 'Manage your income, expense & transfers'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Type Selector Tabs */}
            <View style={styles.typeSelector}>
              {(['expense', 'income', 'transfer'] as TransactionType[]).map((t) => {
                const isActive = type === t;
                const activeColor =
                  t === 'expense' ? '#EF4444' : t === 'income' ? '#10B981' : '#3B82F6';

                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeTab,
                      isActive && { backgroundColor: activeColor, borderColor: activeColor },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setType(t);
                    }}
                  >
                    <Ionicons
                      name={
                        t === 'expense'
                          ? 'arrow-up-circle'
                          : t === 'income'
                          ? 'arrow-down-circle'
                          : 'swap-horizontal'
                      }
                      size={16}
                      color={isActive ? '#FFFFFF' : Colors.textMuted}
                    />
                    <Text style={[styles.typeTabText, isActive && styles.typeTabTextActive]}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Amount Input */}
            <View style={styles.amountCard}>
              <Text style={styles.amountCurrency}>₹</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0"
                placeholderTextColor="rgba(255,255,255,0.2)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
                autoFocus
              />
            </View>

            {/* Title / Note */}
            <Text style={styles.fieldLabel}>Title / Purpose *</Text>
            <TextInput
              style={styles.textInput}
              placeholder={
                type === 'expense'
                  ? 'e.g. Swiggy Food, Groceries, Petrol'
                  : type === 'income'
                  ? 'e.g. October Salary, Freelance project'
                  : 'e.g. ATM Cash Withdrawal'
              }
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Category Selector (For Expense & Income) */}
            {type !== 'transfer' && (
              <>
                <Text style={styles.fieldLabel}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {filteredCategories.map((cat) => {
                    const isSelected = selectedCategoryId === cat.id;
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[
                          styles.categoryChip,
                          isSelected && { backgroundColor: cat.color + '26', borderColor: cat.color },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setSelectedCategoryId(cat.id);
                        }}
                      >
                        <Ionicons
                          name={cat.icon as any}
                          size={15}
                          color={isSelected ? cat.color : Colors.textMuted}
                        />
                        <Text
                          style={[
                            styles.categoryChipText,
                            isSelected && { color: '#FFFFFF', fontWeight: '700' },
                          ]}
                        >
                          {cat.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </>
            )}

            {/* Source Account Selector */}
            <Text style={styles.fieldLabel}>{type === 'transfer' ? 'From Account' : 'Account'}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
              {accounts.map((acc) => {
                const isSelected = selectedAccountId === acc.id;
                return (
                  <TouchableOpacity
                    key={acc.id}
                    style={[
                      styles.accountChip,
                      isSelected && { borderColor: Colors.primary, backgroundColor: 'rgba(99, 102, 241, 0.15)' },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setSelectedAccountId(acc.id);
                    }}
                  >
                    <Ionicons name={acc.icon as any} size={15} color={acc.color} />
                    <View style={{ marginLeft: 6 }}>
                      <Text style={[styles.accountChipName, isSelected && { color: '#FFFFFF' }]}>
                        {acc.name}
                      </Text>
                      <Text style={styles.accountChipBal}>
                        {acc.type === 'credit_card' ? `Due: ₹${acc.balance}` : `Bal: ₹${acc.balance}`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Destination Account (For Transfer) */}
            {type === 'transfer' && (
              <>
                <Text style={styles.fieldLabel}>To Account</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accountScroll}>
                  {accounts
                    .filter((a) => a.id !== selectedAccountId)
                    .map((acc) => {
                      const isSelected = selectedToAccountId === acc.id;
                      return (
                        <TouchableOpacity
                          key={acc.id}
                          style={[
                            styles.accountChip,
                            isSelected && { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                            setSelectedToAccountId(acc.id);
                          }}
                        >
                          <Ionicons name={acc.icon as any} size={15} color={acc.color} />
                          <View style={{ marginLeft: 6 }}>
                            <Text style={[styles.accountChipName, isSelected && { color: '#FFFFFF' }]}>
                              {acc.name}
                            </Text>
                            <Text style={styles.accountChipBal}>Bal: ₹{acc.balance}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </>
            )}

            {/* Payment Method */}
            <Text style={styles.fieldLabel}>Payment Mode</Text>
            <View style={styles.methodRow}>
              {(['UPI', 'Cash', 'Card', 'Net Banking'] as PaymentMethod[]).map((m) => {
                const isSelected = paymentMethod === m;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.methodChip, isSelected && styles.methodChipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setPaymentMethod(m);
                    }}
                  >
                    <Text style={[styles.methodChipText, isSelected && styles.methodChipTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Merchant / Vendor (Optional) */}
            <Text style={styles.fieldLabel}>Merchant / Person (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Swiggy, Amazon, Friend Name"
              placeholderTextColor={Colors.textMuted}
              value={merchant}
              onChangeText={setMerchant}
            />
          </ScrollView>

          {/* Submit Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              {initialTransaction
                ? 'Update Transaction'
                : `Save ${type.charAt(0).toUpperCase() + type.slice(1)}`}
            </Text>
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
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
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
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    marginBottom: Spacing.lg,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
  },
  typeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  typeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  amountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.xl,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: Spacing.lg,
  },
  amountCurrency: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.primary,
    marginRight: 6,
  },
  amountInput: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 120,
    textAlign: 'center',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 8,
    marginTop: 12,
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
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  accountScroll: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  accountChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 10,
  },
  accountChipName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  accountChipBal: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  methodRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  methodChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    borderColor: Colors.primary,
  },
  methodChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  methodChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: Radii.lg,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
