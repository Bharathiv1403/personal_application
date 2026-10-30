import React, { useState, useMemo, useEffect } from 'react';
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

const QUICK_TEMPLATES = [
  { label: 'Rent 🏠', title: 'House Rent', categoryId: 'housing' },
  { label: 'Groceries 🛒', title: 'Monthly Groceries', categoryId: 'groceries' },
  { label: 'Food 🍔', title: 'Food & Dining', categoryId: 'food' },
  { label: 'Petrol ⛽', title: 'Petrol / Fuel', categoryId: 'transport' },
  { label: 'EB Bill 💡', title: 'Electricity Bill', categoryId: 'utilities' },
  { label: 'EMI 💳', title: 'Loan / Card EMI', categoryId: 'emi_loans' },
  { label: 'Mobile / WiFi 📱', title: 'Recharge & Internet', categoryId: 'utilities' },
  { label: 'Tea / Snacks ☕', title: 'Tea & Snacks', categoryId: 'food' },
];

export const AddBudgetGoalModal: React.FC<Props> = ({ visible, onClose }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'history'>('log');

  // Salary state
  const monthlySalary = useWealthStore((s) => s.monthlySalary);
  const setMonthlySalary = useWealthStore((s) => s.setMonthlySalary);
  const [salaryInput, setSalaryInput] = useState('');
  const [isEditingSalary, setIsEditingSalary] = useState(false);
  const [creditSalaryToAccount, setCreditSalaryToAccount] = useState(false);
  const [selectedSalaryAccountId, setSelectedSalaryAccountId] = useState('');

  // Expense form state
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('food');
  const [selectedAccountId, setSelectedAccountId] = useState('');

  // Store data
  const accounts = useWealthStore((s) => s.accounts);
  const categories = useWealthStore((s) => s.categories);
  const transactions = useWealthStore((s) => s.transactions);
  const addTransaction = useWealthStore((s) => s.addTransaction);
  const deleteTransaction = useWealthStore((s) => s.deleteTransaction);

  const currentMonthKey = useMemo(() => new Date().toISOString().slice(0, 7), []);
  const currentMonthName = useMemo(() => {
    return new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, []);

  const prevVisibleRef = React.useRef(false);

  // Sync initial values only on modal transition to visible
  useEffect(() => {
    if (visible && !prevVisibleRef.current) {
      setSalaryInput(monthlySalary > 0 ? String(monthlySalary) : '');
      setIsEditingSalary(monthlySalary <= 0);
      setExpenseTitle('');
      setExpenseAmount('');
      setActiveTab('log');

      if (accounts.length > 0) {
        if (!selectedAccountId) setSelectedAccountId(accounts[0].id);
        if (!selectedSalaryAccountId) setSelectedSalaryAccountId(accounts[0].id);
      }
    }
    prevVisibleRef.current = visible;
  }, [visible, monthlySalary, accounts, selectedAccountId, selectedSalaryAccountId]);

  // Current month's expenses
  const monthExpenses = useMemo(() => {
    return transactions.filter(
      (t) => t.type === 'expense' && t.date.slice(0, 7) === currentMonthKey
    );
  }, [transactions, currentMonthKey]);

  const totalMonthExpense = useMemo(() => {
    return monthExpenses.reduce((sum, t) => sum + t.amount, 0);
  }, [monthExpenses]);

  const remainingSalary = Math.max(0, monthlySalary - totalMonthExpense);
  const isOverSpent = totalMonthExpense > monthlySalary && monthlySalary > 0;
  const spentPercent =
    monthlySalary > 0 ? Math.min(100, Math.round((totalMonthExpense / monthlySalary) * 100)) : 0;

  // Days remaining in month
  const { daysRemaining, dailySafeSpend } = useMemo(() => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const days = Math.max(1, lastDay - now.getDate());
    const daily = remainingSalary > 0 ? Math.round(remainingSalary / days) : 0;
    return { daysRemaining: days, dailySafeSpend: daily };
  }, [remainingSalary]);

  // Handlers
  const handleSaveSalary = () => {
    const parsed = parseFloat(salaryInput.trim());
    if (isNaN(parsed) || parsed < 0) {
      Alert.alert('Invalid Salary', 'Please enter a valid salary amount.');
      return;
    }

    setMonthlySalary(parsed);
    setIsEditingSalary(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Optionally credit to bank account
    if (creditSalaryToAccount && selectedSalaryAccountId && parsed > 0) {
      addTransaction({
        type: 'income',
        title: `${currentMonthName} Salary Inflow`,
        amount: parsed,
        categoryId: 'salary',
        accountId: selectedSalaryAccountId,
        date: new Date().toISOString().slice(0, 10),
        paymentMethod: 'Net Banking',
        merchant: 'Salary Credit',
        description: `Credited for ${currentMonthName}`,
      });
      setCreditSalaryToAccount(false);
      Alert.alert('Salary Updated', `${formatINR(parsed)} saved and credited to selected account.`);
    }
  };

  const handleApplyTemplate = (tmpl: { title: string; categoryId: string }) => {
    setExpenseTitle(tmpl.title);
    setSelectedCategoryId(tmpl.categoryId);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleAddExpense = () => {
    const numAmount = parseFloat(expenseAmount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!expenseTitle.trim()) {
      Alert.alert('Required Note', 'Please enter what this expense was for (e.g. Groceries, Rent).');
      return;
    }

    if (!selectedAccountId) {
      Alert.alert('Select Account', 'Please select an account for this payment.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addTransaction({
      type: 'expense',
      title: expenseTitle.trim(),
      amount: numAmount,
      categoryId: selectedCategoryId,
      accountId: selectedAccountId,
      date: new Date().toISOString().slice(0, 10),
      paymentMethod: 'UPI',
    });

    setExpenseTitle('');
    setExpenseAmount('');
  };

  const handleDeleteExpense = (id: string, title: string, amount: number) => {
    Alert.alert(
      'Delete Expense',
      `Delete "${title}" (${formatINR(amount)}) from this month's expenses?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Monthly Salary & Expenses</Text>
              <Text style={styles.modalSubtitle}>{currentMonthName} • Budget Tracker</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'log' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('log');
              }}
            >
              <Ionicons
                name="wallet"
                size={15}
                color={activeTab === 'log' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'log' && styles.tabBtnTextActive]}>
                Salary & Log
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'history' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('history');
              }}
            >
              <Ionicons
                name="list"
                size={15}
                color={activeTab === 'history' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'history' && styles.tabBtnTextActive]}>
                Month Expenses ({monthExpenses.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* SALARY & IN-HAND LIVE CASHFLOW CARD */}
            <View style={styles.salaryCard}>
              <View style={styles.salaryCardTop}>
                <View>
                  <Text style={styles.salaryLabel}>Monthly Salary Budget</Text>
                  {isEditingSalary ? (
                    <View style={styles.salaryInputRow}>
                      <Text style={styles.rupeePrefix}>₹</Text>
                      <TextInput
                        style={styles.salaryInlineInput}
                        placeholder="e.g. 50000"
                        placeholderTextColor={Colors.textMuted}
                        keyboardType="numeric"
                        value={salaryInput}
                        onChangeText={setSalaryInput}
                        autoFocus
                      />
                      <TouchableOpacity style={styles.salarySaveBtn} onPress={handleSaveSalary}>
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        <Text style={styles.salarySaveBtnText}>Save</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.salaryDisplayRow}
                      onPress={() => setIsEditingSalary(true)}
                    >
                      <Text style={styles.salaryAmountText}>{formatINR(monthlySalary)}</Text>
                      <Ionicons name="pencil" size={15} color="#38BDF8" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  )}
                </View>

                {!isEditingSalary && (
                  <TouchableOpacity
                    style={styles.editSalaryPill}
                    onPress={() => setIsEditingSalary(true)}
                  >
                    <Text style={styles.editSalaryPillText}>Change</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Optional checkbox to credit salary into account */}
              {isEditingSalary && accounts.length > 0 && (
                <View style={styles.creditCheckboxContainer}>
                  <TouchableOpacity
                    style={styles.checkboxRow}
                    onPress={() => setCreditSalaryToAccount(!creditSalaryToAccount)}
                  >
                    <Ionicons
                      name={creditSalaryToAccount ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={creditSalaryToAccount ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={styles.checkboxLabel}>Credit this salary to account</Text>
                  </TouchableOpacity>

                  {creditSalaryToAccount && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {accounts.map((acc) => (
                        <TouchableOpacity
                          key={acc.id}
                          style={[
                            styles.accChip,
                            selectedSalaryAccountId === acc.id && styles.accChipActive,
                          ]}
                          onPress={() => setSelectedSalaryAccountId(acc.id)}
                        >
                          <Ionicons name={acc.icon as any} size={12} color={acc.color} />
                          <Text style={styles.accChipText}>{acc.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                </View>
              )}

              {/* Metrics Divider */}
              <View style={styles.cardDivider} />

              {/* Live Spent vs Remaining */}
              <View style={styles.metricsRow}>
                <View style={styles.metricCol}>
                  <Text style={styles.metricSubLabel}>Spent This Month</Text>
                  <Text style={[styles.metricValue, { color: '#F87171' }]}>
                    -{formatINR(totalMonthExpense)}
                  </Text>
                </View>

                <View style={styles.metricCol}>
                  <Text style={styles.metricSubLabel}>In-Hand Balance</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: isOverSpent ? '#EF4444' : '#4ADE80' },
                    ]}
                  >
                    {isOverSpent
                      ? `-${formatINR(totalMonthExpense - monthlySalary)}`
                      : formatINR(remainingSalary)}
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${spentPercent}%`,
                      backgroundColor:
                        isOverSpent
                          ? '#EF4444'
                          : spentPercent >= 80
                          ? '#F59E0B'
                          : '#10B981',
                    },
                  ]}
                />
              </View>

              <View style={styles.progressMetaRow}>
                <Text style={styles.progressMetaText}>
                  {isOverSpent
                    ? `Over budget by ${formatINR(totalMonthExpense - monthlySalary)} ⚠️`
                    : `${spentPercent}% spent (${formatINR(remainingSalary)} left)`}
                </Text>
                <Text style={[styles.progressMetaText, { color: '#38BDF8' }]}>
                  {dailySafeSpend > 0
                    ? `₹${dailySafeSpend}/day safe (${daysRemaining}d left)`
                    : `${daysRemaining} days left`}
                </Text>
              </View>
            </View>

            {/* TAB 1: LOG EXPENSE VIEW */}
            {activeTab === 'log' && (
              <>
                {/* Quick Expense Templates */}
                <Text style={styles.sectionHeading}>Quick Expense Templates</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templatesScroll}>
                  {QUICK_TEMPLATES.map((tmpl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.templateChip}
                      onPress={() => handleApplyTemplate(tmpl)}
                    >
                      <Text style={styles.templateChipText}>{tmpl.label}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Add Expense Form */}
                <View style={styles.formContainer}>
                  <Text style={styles.sectionHeading}>Note New Expense</Text>

                  {/* Expense Title */}
                  <Text style={styles.inputLabel}>What was it for? *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. Vegetables, Petrol, Tea, Rent"
                    placeholderTextColor={Colors.textMuted}
                    value={expenseTitle}
                    onChangeText={setExpenseTitle}
                  />

                  {/* Expense Amount */}
                  <Text style={styles.inputLabel}>Amount (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 350"
                    placeholderTextColor={Colors.textMuted}
                    keyboardType="numeric"
                    value={expenseAmount}
                    onChangeText={setExpenseAmount}
                  />

                  {/* Category Chips */}
                  <Text style={styles.inputLabel}>Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {categories
                      .filter((c) => c.type === 'expense')
                      .map((c) => (
                        <TouchableOpacity
                          key={c.id}
                          style={[
                            styles.categoryChip,
                            selectedCategoryId === c.id && {
                              backgroundColor: c.color + '33',
                              borderColor: c.color,
                            },
                          ]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                            setSelectedCategoryId(c.id);
                          }}
                        >
                          <Ionicons name={c.icon as any} size={14} color={c.color} />
                          <Text
                            style={[
                              styles.categoryChipText,
                              selectedCategoryId === c.id && { color: '#FFFFFF', fontWeight: '700' },
                            ]}
                          >
                            {c.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </ScrollView>

                  {/* Paid From Account */}
                  {accounts.length > 0 && (
                    <>
                      <Text style={styles.inputLabel}>Paid From Account</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {accounts.map((acc) => (
                          <TouchableOpacity
                            key={acc.id}
                            style={[
                              styles.accChip,
                              selectedAccountId === acc.id && styles.accChipActive,
                            ]}
                            onPress={() => setSelectedAccountId(acc.id)}
                          >
                            <Ionicons name={acc.icon as any} size={13} color={acc.color} />
                            <Text style={styles.accChipText}>
                              {acc.name} ({formatINR(acc.balance)})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {/* Submit Button */}
                  <TouchableOpacity style={styles.addExpenseBtn} onPress={handleAddExpense}>
                    <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.addExpenseBtnText}>+ Record Expense</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}

            {/* TAB 2: MONTH EXPENSES HISTORY */}
            {activeTab === 'history' && (
              <View style={styles.historyContainer}>
                <View style={styles.historyHeaderRow}>
                  <Text style={styles.sectionHeading}>
                    Expenses Logged ({monthExpenses.length})
                  </Text>
                  <Text style={styles.historyTotalText}>
                    Total: {formatINR(totalMonthExpense)}
                  </Text>
                </View>

                {monthExpenses.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
                    <Text style={styles.emptyStateTitle}>No Expenses Recorded</Text>
                    <Text style={styles.emptyStateSubtitle}>
                      Switch to "Salary & Log" tab to start adding your expenses for this month.
                    </Text>
                  </View>
                ) : (
                  monthExpenses.map((tx) => {
                    const cat = categories.find((c) => c.id === tx.categoryId);
                    const acc = accounts.find((a) => a.id === tx.accountId);

                    return (
                      <View key={tx.id} style={styles.expenseItemRow}>
                        <View
                          style={[
                            styles.expenseIconBox,
                            { backgroundColor: (cat?.color || '#64748B') + '26' },
                          ]}
                        >
                          <Ionicons
                            name={(cat?.icon as any) || 'pricetag'}
                            size={18}
                            color={cat?.color || '#64748B'}
                          />
                        </View>

                        <View style={styles.expenseInfo}>
                          <Text style={styles.expenseTitle}>{tx.title}</Text>
                          <Text style={styles.expenseSub}>
                            {cat?.name || 'Expense'} • {tx.date}{' '}
                            {acc ? `• ${acc.name}` : ''}
                          </Text>
                        </View>

                        <View style={styles.expenseActionCol}>
                          <Text style={styles.expenseAmount}>-{formatINR(tx.amount)}</Text>
                          <TouchableOpacity
                            style={styles.deleteExpenseBtn}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            onPress={() => handleDeleteExpense(tx.id, tx.title, tx.amount)}
                          >
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.md,
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Salary Live Card
  salaryCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: Spacing.md,
  },
  salaryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  salaryLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salaryDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  salaryAmountText: {
    fontSize: 24,
    fontWeight: '800',
    color: '#38BDF8',
  },
  editSalaryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  editSalaryPillText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  salaryInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  rupeePrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  salaryInlineInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    minWidth: 120,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  salarySaveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  salarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  creditCheckboxContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  cardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  metricCol: {
    flex: 1,
  },
  metricSubLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },

  // Templates
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    marginTop: 4,
  },
  templatesScroll: {
    marginBottom: 12,
  },
  templateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 8,
  },
  templateChipText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },

  // Form
  formContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radii.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 6,
    gap: 5,
  },
  categoryChipText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  accChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 6,
    gap: 6,
  },
  accChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: Colors.primary,
  },
  accChipText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addExpenseBtn: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.lg,
    marginTop: 10,
    gap: 6,
  },
  addExpenseBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // History List
  historyContainer: {
    marginTop: 4,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  historyTotalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F87171',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: Spacing.xl,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  expenseItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  expenseIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expenseSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  expenseActionCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  expenseAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#F87171',
  },
  deleteExpenseBtn: {
    padding: 3,
  },
});
