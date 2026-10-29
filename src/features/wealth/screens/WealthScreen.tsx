import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import {
  useWealthStore,
  Account,
  Transaction,
  TransactionType,
  LoanItem,
  Bill,
  SavingsGoal,
} from '../state/wealth-store';
import { AddTransactionModal } from '../components/AddTransactionModal';
import { AddAccountModal } from '../components/AddAccountModal';
import { AddBudgetGoalModal } from '../components/AddBudgetGoalModal';
import { AiInsightsModal } from '../components/AiInsightsModal';
import { AddLoanModal } from '../components/AddLoanModal';
import { AddGoldModal } from '../components/AddGoldModal';
import { PartRepayModal } from '../components/PartRepayModal';
import { AddBillModal } from '../components/AddBillModal';
import { AddTripModal } from '../components/AddTripModal';
import { TripManageModal } from '../components/TripManageModal';
import { AddPeerDebtModal } from '../components/AddPeerDebtModal';
import { AddSavingsPotModal } from '../components/AddSavingsPotModal';
import { PartialPaymentModal } from '../components/PartialPaymentModal';
import { SelfTransferModal } from '../components/SelfTransferModal';
import { RestoreBackupModal } from '../components/RestoreBackupModal';
import { SipCalculatorModal } from '../components/SipCalculatorModal';
import { PeerDebt, PeerDebtType, Trip } from '../state/wealth-store';

type NavTab =
  | 'Overview'
  | 'Accounts'
  | 'Budgets'
  | 'Trips & Tours'
  | 'Friends Khata'
  | 'Savings Pots'
  | 'Bills & Debt';
type TimeFilter = 'Today' | 'Week' | 'Month' | 'All';

export const WealthScreen: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTab>('Overview');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('Month');

  // Modals
  const [addTxModalVisible, setAddTxModalVisible] = useState(false);
  const [txModalDefaultType, setTxModalDefaultType] = useState<TransactionType>('expense');
  const [addAccountModalVisible, setAddAccountModalVisible] = useState(false);
  const [addBudgetGoalModalVisible, setAddBudgetGoalModalVisible] = useState(false);
  const [aiInsightsModalVisible, setAiInsightsModalVisible] = useState(false);
  const [addLoanModalVisible, setAddLoanModalVisible] = useState(false);
  const [addGoldModalVisible, setAddGoldModalVisible] = useState(false);
  const [addBillModalVisible, setAddBillModalVisible] = useState(false);
  const [addTripModalVisible, setAddTripModalVisible] = useState(false);
  const [selectedTripForManage, setSelectedTripForManage] = useState<Trip | null>(null);
  const [addPeerDebtModalVisible, setAddPeerDebtModalVisible] = useState(false);
  const [peerDebtDefaultType, setPeerDebtDefaultType] = useState<PeerDebtType>('gave');
  const [addSavingsPotModalVisible, setAddSavingsPotModalVisible] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<LoanItem | null>(null);
  const [selectedDebtForPartial, setSelectedDebtForPartial] = useState<PeerDebt | null>(null);
  const [partialPaymentModalVisible, setPartialPaymentModalVisible] = useState(false);
  const [selfTransferModalVisible, setSelfTransferModalVisible] = useState(false);
  const [restoreBackupModalVisible, setRestoreBackupModalVisible] = useState(false);
  const [sipCalculatorModalVisible, setSipCalculatorModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Store Bindings
  const isStealthMode = useWealthStore((s) => s.isStealthMode);
  const toggleStealthMode = useWealthStore((s) => s.toggleStealthMode);
  const money = (val: number) => formatINR(val, isStealthMode);
  const accounts = useWealthStore((s) => s.accounts);
  const transactions = useWealthStore((s) => s.transactions);
  const categories = useWealthStore((s) => s.categories);
  const budgets = useWealthStore((s) => s.budgets);
  const bills = useWealthStore((s) => s.bills);
  const savingsGoals = useWealthStore((s) => s.savingsGoals);
  const loans = useWealthStore((s) => s.loans);
  const goldItems = useWealthStore((s) => s.goldItems);
  const trips = useWealthStore((s) => s.trips);
  const peerDebts = useWealthStore((s) => s.peerDebts);
  const currentGoldRate = useWealthStore((s) => s.currentGoldRatePerGram);
  const monthlySalary = useWealthStore((s) => s.monthlySalary);

  const addTransaction = useWealthStore((s) => s.addTransaction);
  const deleteTransaction = useWealthStore((s) => s.deleteTransaction);
  const payBill = useWealthStore((s) => s.payBill);
  const payMonthlyVatti = useWealthStore((s) => s.payMonthlyVatti);
  const deleteLoan = useWealthStore((s) => s.deleteLoan);
  const deleteGoldItem = useWealthStore((s) => s.deleteGoldItem);
  const depositToGoal = useWealthStore((s) => s.depositToGoal);
  const withdrawFromGoal = useWealthStore((s) => s.withdrawFromGoal);
  const deleteGoal = useWealthStore((s) => s.deleteGoal);
  const deleteTrip = useWealthStore((s) => s.deleteTrip);
  const settlePeerDebt = useWealthStore((s) => s.settlePeerDebt);
  const deletePeerDebt = useWealthStore((s) => s.deletePeerDebt);

  // -------------------------------------------------------------
  // Filtered Transactions Calculation (Time, Search, Category)
  // -------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return transactions.filter((t) => {
      // Time filter
      if (timeFilter === 'Today' && t.date !== todayStr) return false;
      if (timeFilter === 'Week') {
        const txDate = new Date(t.date);
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        if (diffDays > 7) return false;
      }
      if (timeFilter === 'Month' && t.date.slice(0, 7) !== selectedMonth) return false;

      // Category filter
      if (selectedCategoryFilter !== 'All' && t.categoryId !== selectedCategoryFilter) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = t.title.toLowerCase().includes(q);
        const matchesMerchant = t.merchant?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesMerchant && !matchesDesc) return false;
      }

      return true;
    });
  }, [transactions, timeFilter, selectedMonth, selectedCategoryFilter, searchQuery]);

  // Month navigation & cashflow metrics
  const monthTransactions = useMemo(() => {
    return transactions.filter((t) => t.date.slice(0, 7) === selectedMonth);
  }, [transactions, selectedMonth]);

  const monthIncome = useMemo(() => {
    return monthTransactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  }, [monthTransactions]);

  const monthExpense = useMemo(() => {
    return monthTransactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  }, [monthTransactions]);

  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m - 2, 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${d.getFullYear()}-${mm}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const d = new Date(y, m, 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    setSelectedMonth(`${d.getFullYear()}-${mm}`);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const formatMonthLabel = (ym: string) => {
    const [y, m] = ym.split('-').map(Number);
    const d = new Date(y, m - 1, 1);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  };

  // -------------------------------------------------------------
  // Key Metrics
  // -------------------------------------------------------------
  const liquidCashBalance = accounts
    .filter((a) => a.type !== 'credit_card')
    .reduce((sum, a) => sum + a.balance, 0);

  const creditCardOutstanding = accounts
    .filter((a) => a.type === 'credit_card')
    .reduce((sum, a) => sum + a.balance, 0);

  const totalGoldGrams = goldItems.reduce((acc, g) => acc + g.weightGrams, 0);
  const totalGoldSovereigns = Number((totalGoldGrams / 8).toFixed(2));
  const totalGoldNetWorth = Math.round(totalGoldGrams * currentGoldRate);

  const totalOutstandingLoanPrincipal = loans
    .filter((l) => l.status === 'active')
    .reduce((acc, l) => acc + l.principalAmount, 0);

  const totalMonthlyVattiDue = loans
    .filter((l) => l.status === 'active')
    .reduce((acc, l) => acc + l.monthlyInterestAmount, 0);

  const netWorth =
    liquidCashBalance + totalGoldNetWorth - creditCardOutstanding - totalOutstandingLoanPrincipal;

  const totalIncome = filteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

  // Overall Monthly Budget
  const overallBudget = budgets.find((b) => !b.categoryId)?.amount || 50000;
  const budgetUsedPercent = overallBudget > 0 ? Math.min(100, Math.round((totalExpense / overallBudget) * 100)) : 0;

  // Category Spend Distribution
  const categorySpendMap = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      });
    return map;
  }, [filteredTransactions]);

  // Friends Khata & Savings Calculations
  const totalKhataToGet = (peerDebts || [])
    .filter((d) => d.status === 'pending' && d.type === 'gave')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalKhataToPay = (peerDebts || [])
    .filter((d) => d.status === 'pending' && d.type === 'took')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalSavedInPots = (savingsGoals || []).reduce((sum, g) => sum + g.currentAmount, 0);

  // Subscriptions & Recurring Commitments
  const subscriptionBills = useMemo(() => {
    return bills.filter(
      (b) =>
        b.categoryId === 'entertainment' ||
        b.title.toLowerCase().includes('netflix') ||
        b.title.toLowerCase().includes('spotify') ||
        b.title.toLowerCase().includes('prime') ||
        b.title.toLowerCase().includes('hotstar') ||
        b.title.toLowerCase().includes('youtube') ||
        b.title.toLowerCase().includes('sub')
    );
  }, [bills]);

  const monthlySubscriptionBurn = useMemo(() => {
    return subscriptionBills.reduce((acc, b) => {
      if (b.recurring === 'yearly') return acc + Math.round(b.amount / 12);
      return acc + b.amount;
    }, 0);
  }, [subscriptionBills]);

  // -------------------------------------------------------------
  // Action Handlers
  // -------------------------------------------------------------
  const openAddTx = (type: TransactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEditingTransaction(null);
    setTxModalDefaultType(type);
    setAddTxModalVisible(true);
  };

  const handleEditTx = (tx: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEditingTransaction(tx);
    setTxModalDefaultType(tx.type);
    setAddTxModalVisible(true);
  };

  const handleQuickExportCSV = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (transactions.length === 0) {
      Alert.alert('No Transactions', 'Record at least one income or expense before exporting.');
      return;
    }
    const targetList = filteredTransactions.length > 0 ? filteredTransactions : transactions;
    const headers = 'Date,Type,Title,Amount(INR),Category,Account,Payment Method\n';
    const rows = targetList
      .map((t) => {
        const cat = categories.find((c) => c.id === t.categoryId)?.name || t.categoryId;
        const acc = accounts.find((a) => a.id === t.accountId)?.name || t.accountId;
        return `"${t.date}","${t.type}","${t.title.replace(/"/g, '""')}","${t.amount}","${cat}","${acc}","${t.paymentMethod || 'UPI'}"`;
      })
      .join('\n');
    const csvContent = headers + rows;
    try {
      await Share.share({
        title: `Expenses_${selectedMonth}.csv`,
        message: csvContent,
      });
    } catch {
      Alert.alert('Export Failed', 'Unable to share financial statement.');
    }
  };

  const handleExportStatement = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert('Export & Backup Financial Data', 'Choose your format:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: '📊 CSV Statement (Excel)',
        onPress: async () => {
          if (transactions.length === 0) {
            Alert.alert('No Transactions', 'Record at least one income or expense before exporting.');
            return;
          }
          const headers = 'Date,Type,Title,Amount(INR),Category,Account,Payment Method\n';
          const rows = transactions
            .map((t) => {
              const cat = categories.find((c) => c.id === t.categoryId)?.name || t.categoryId;
              const acc = accounts.find((a) => a.id === t.accountId)?.name || t.accountId;
              return `"${t.date}","${t.type}","${t.title.replace(/"/g, '""')}","${t.amount}","${cat}","${acc}","${t.paymentMethod}"`;
            })
            .join('\n');
          const csvContent = headers + rows;
          try {
            await Share.share({
              title: 'Financial_Statement.csv',
              message: csvContent,
            });
          } catch {
            Alert.alert('Export Failed', 'Unable to share financial statement.');
          }
        },
      },
      {
        text: '💾 Full Backup (JSON)',
        onPress: async () => {
          const state = useWealthStore.getState();
          const backupData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            monthlySalary: state.monthlySalary,
            accounts: state.accounts,
            transactions: state.transactions,
            budgets: state.budgets,
            bills: state.bills,
            savingsGoals: state.savingsGoals,
            loans: state.loans,
            goldItems: state.goldItems,
            trips: state.trips,
            peerDebts: state.peerDebts,
          };
          const jsonStr = JSON.stringify(backupData, null, 2);
          try {
            await Share.share({
              title: `Finance_Backup_${new Date().toISOString().slice(0, 10)}.json`,
              message: jsonStr,
            });
          } catch {
            Alert.alert('Backup Failed', 'Unable to export backup.');
          }
        },
      },
      {
        text: '📥 Restore Backup (JSON)',
        onPress: () => setRestoreBackupModalVisible(true),
      },
      {
        text: '📈 SIP Wealth Calculator',
        onPress: () => setSipCalculatorModalVisible(true),
      },
    ]);
  };

  const handlePayCreditCardBill = (cardAcc: Account) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const bankAcc = accounts.find((a) => a.type === 'bank') || accounts[0];
    if (!bankAcc) {
      Alert.alert('No Bank Account', 'Please add a bank account to pay your credit card bill.');
      return;
    }

    Alert.alert(
      'Pay Credit Card Bill',
      `Pay outstanding bill of ${formatINR(cardAcc.balance)} for "${cardAcc.name}" from "${bankAcc.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Pay Full ${formatINR(cardAcc.balance)} 💳`,
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            addTransaction({
              type: 'transfer',
              title: `Credit Card Bill: ${cardAcc.name}`,
              amount: cardAcc.balance,
              accountId: bankAcc.id,
              toAccountId: cardAcc.id,
              categoryId: 'emi_loans',
              date: new Date().toISOString().slice(0, 10),
              paymentMethod: 'Net Banking',
            });
            Alert.alert(
              'Bill Paid Successfully! 🎉',
              `${formatINR(cardAcc.balance)} paid. Outstanding due is now ₹0.`
            );
          },
        },
      ]
    );
  };

  const handleSendKhataReminder = (debt: PeerDebt) => {
    const pending = Math.max(0, debt.amount - (debt.paidAmount || 0));
    const msg = `Hi ${debt.personName}, friendly reminder regarding the ${formatINR(pending)} pending for ${debt.note || 'hand loan / expense split'}. Please GPay/PhonePe when convenient. Thank you! 🙏`;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    if (debt.personPhone) {
      const cleanPhone = debt.personPhone.replace(/[^0-9]/g, '');
      const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
      const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`;
      Linking.canOpenURL(url)
        .then((supported) => {
          if (supported) {
            Linking.openURL(url);
          } else {
            Share.share({ message: msg });
          }
        })
        .catch(() => {
          Share.share({ message: msg });
        });
    } else {
      Share.share({ message: msg });
    }
  };

  const handleCreditSalaryToBank = () => {
    if (!monthlySalary || monthlySalary <= 0) {
      Alert.alert('Set Salary First', 'Please set your monthly salary in the budget planner first.');
      return;
    }

    const primaryAcc =
      accounts.find((a) => a.type === 'bank') || accounts[0];
    if (!primaryAcc) {
      Alert.alert('No Account', 'Please add a bank account first.');
      return;
    }

    const monthName = new Date().toLocaleString('default', { month: 'long' });

    Alert.alert(
      'Credit Monthly Salary?',
      `Deposit ${formatINR(monthlySalary)} into "${primaryAcc.name}" as ${monthName} Salary?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Credit to Bank 💰',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            addTransaction({
              type: 'income',
              title: `${monthName} Salary Credit`,
              amount: monthlySalary,
              accountId: primaryAcc.id,
              categoryId: 'salary',
              date: new Date().toISOString().slice(0, 10),
              paymentMethod: 'Net Banking',
              merchant: 'Employer / Company',
            });
            Alert.alert(
              'Salary Credited!',
              `${formatINR(monthlySalary)} credited into ${primaryAcc.name}. New Balance: ${formatINR(
                primaryAcc.balance + monthlySalary
              )}.`
            );
          },
        },
      ]
    );
  };

  const handlePayBill = (bill: Bill) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const defaultAccount = accounts.find((a) => a.type === 'bank') || accounts[0];

    Alert.alert(
      'Pay Bill Online',
      `Pay ${bill.title} (${formatINR(bill.amount)}) from ${defaultAccount.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Pay',
          onPress: () => {
            payBill(bill.id, defaultAccount.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Alert.alert('Payment Successful ✅', `${bill.title} has been marked as paid.`);
          },
        },
      ]
    );
  };

  const handleDepositToGoal = (goal: SavingsGoal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const defaultAccount = accounts.find((a) => a.type === 'bank') || accounts[0];
    const depositAmt = 5000;

    Alert.alert(
      'Add Savings',
      `Transfer ${formatINR(depositAmt)} from ${defaultAccount.name} to ${goal.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deposit ₹5,000',
          onPress: () => {
            depositToGoal(goal.id, depositAmt, defaultAccount.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  const handleWithdrawFromGoal = (goal: SavingsGoal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (goal.currentAmount <= 0) {
      Alert.alert('Zero Balance', 'This savings pot currently has no accumulated funds to withdraw.');
      return;
    }
    const defaultAccount = accounts.find((a) => a.type === 'bank') || accounts[0];
    const withdrawAmt = Math.min(5000, goal.currentAmount);

    Alert.alert(
      'Withdraw from Savings Pot',
      `Withdraw ${formatINR(withdrawAmt)} from "${goal.name}" into ${defaultAccount.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Withdraw ${formatINR(withdrawAmt)}`,
          onPress: () => {
            withdrawFromGoal(goal.id, withdrawAmt, defaultAccount.id, 'Emergency / Spend');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            Alert.alert('Withdrawn Successfully ✅', `${formatINR(withdrawAmt)} transferred to ${defaultAccount.name}.`);
          },
        },
      ]
    );
  };

  const handleSettlePeerDebt = (debt: PeerDebt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    Alert.alert(
      'Settle Debt',
      `Mark "${debt.personName}" (${formatINR(debt.amount)}) as fully settled?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark as Settled ✓',
          onPress: () => {
            settlePeerDebt(debt.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  const handleDeletePeerDebt = (debtId: string) => {
    Alert.alert('Delete Record', 'Delete this debt entry from your Khata?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePeerDebt(debtId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        },
      },
    ]);
  };

  const handleDeleteTrip = (tripId: string, name: string) => {
    Alert.alert('Delete Trip', `Are you sure you want to delete "${name}" and all its logged expenses?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete Trip',
        style: 'destructive',
        onPress: () => {
          deleteTrip(tripId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        },
      },
    ]);
  };

  const handleDeleteTx = (tx: Transaction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Delete Transaction',
      `Are you sure you want to delete "${tx.title}" (${formatINR(tx.amount)})? Account balances will be automatically restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(tx.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ========================================================= */}
        {/* TOP HEADER */}
        {/* ========================================================= */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <Text style={styles.screenTitle} numberOfLines={1}>Executive Finance OS</Text>
            <Text style={styles.screenSubtitle} numberOfLines={1}>Enterprise Cashflow, Budgets & Accounts</Text>
          </View>
          <View style={styles.headerActionsWrap}>
            <TouchableOpacity
              style={[styles.stealthToggleBtn, isStealthMode && styles.stealthToggleBtnActive]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                toggleStealthMode();
              }}
              accessibilityLabel="Privacy Stealth Mode"
            >
              <Ionicons
                name={isStealthMode ? 'eye-off' : 'eye-outline'}
                size={16}
                color={isStealthMode ? '#F59E0B' : Colors.textMuted}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.exportHeaderBtn}
              onPress={handleExportStatement}
            >
              <Ionicons name="download-outline" size={13} color="#38BDF8" />
              <Text style={styles.exportHeaderBtnText}>Export</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.aiButton}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAiInsightsModalVisible(true);
              }}
            >
              <Ionicons name="sparkles" size={13} color="#F59E0B" />
              <Text style={styles.aiButtonText}>AI</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================= */}
        {/* EXECUTIVE FINANCIAL SUMMARY HERO CARDS */}
        {/* ========================================================= */}
        <GlassCard style={styles.heroCard} variant="elevated">
          <View style={styles.heroTopRow}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.heroLabel}>Total Estimated Net Worth</Text>
                {isStealthMode && (
                  <Badge label="Privacy Masked 🔒" variant="gold" />
                )}
              </View>
              <Text style={styles.heroNetWorth}>{money(netWorth)}</Text>
            </View>
            <Badge
              label={savingsRate >= 50 ? `Savings Rate: ${savingsRate}% 🔥` : `Savings Rate: ${savingsRate}%`}
              variant={savingsRate >= 50 ? 'primary' : 'neutral'}
            />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroMetricsGrid}>
            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>Liquid Balance</Text>
              <Text style={[styles.metricValue, { color: '#38BDF8' }]}>
                {money(liquidCashBalance)}
              </Text>
            </View>

            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>Total Inflow</Text>
              <Text style={[styles.metricValue, { color: '#4ADE80' }]}>
                +{money(totalIncome)}
              </Text>
            </View>

            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>Total Outflow</Text>
              <Text style={[styles.metricValue, { color: '#F87171' }]}>
                -{money(totalExpense)}
              </Text>
            </View>

            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>Net Saved</Text>
              <Text style={[styles.metricValue, { color: netSavings >= 0 ? '#4ADE80' : '#F87171' }]}>
                {money(netSavings)}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* ========================================================= */}
        {/* QUICK ACTION BAR */}
        {/* ========================================================= */}
        <View style={styles.quickActionBar}>
          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: '#EF4444' }]}
            onPress={() => openAddTx('expense')}
          >
            <Ionicons name="arrow-up" size={14} color="#EF4444" />
            <Text style={[styles.quickActionText, { color: '#EF4444' }]} numberOfLines={1}>Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}
            onPress={() => openAddTx('income')}
          >
            <Ionicons name="arrow-down" size={14} color="#10B981" />
            <Text style={[styles.quickActionText, { color: '#10B981' }]} numberOfLines={1}>Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }]}
            onPress={() => openAddTx('transfer')}
          >
            <Ionicons name="swap-horizontal" size={14} color="#3B82F6" />
            <Text style={[styles.quickActionText, { color: '#3B82F6' }]} numberOfLines={1}>Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: '#A855F7' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAddAccountModalVisible(true);
            }}
          >
            <Ionicons name="card" size={14} color="#A855F7" />
            <Text style={[styles.quickActionText, { color: '#A855F7' }]} numberOfLines={1}>Account</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* MONTHLY SALARY & EXPENSE TRACKER PROMPT BANNER */}
        {/* ========================================================= */}
        <TouchableOpacity
          style={styles.salaryPlannerBanner}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setAddBudgetGoalModalVisible(true);
          }}
        >
          <View style={styles.salaryBannerLeft}>
            <View style={styles.salaryBannerIconWrap}>
              <Ionicons name="wallet" size={18} color="#10B981" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.salaryBannerTitle}>Monthly Salary & Expense Planner</Text>
              <Text style={styles.salaryBannerSub} numberOfLines={2}>
                {monthlySalary > 0
                  ? `Salary: ${formatINR(monthlySalary)} • Spent: ${formatINR(totalExpense)}\nLeft: ${formatINR(Math.max(0, monthlySalary - totalExpense))}`
                  : 'Tap to add your monthly salary & start logging expenses'}
              </Text>
            </View>
          </View>
          <View style={styles.salaryBannerAction}>
            <Text style={styles.salaryBannerActionText}>Plan</Text>
            <Ionicons name="chevron-forward" size={14} color="#38BDF8" />
          </View>
        </TouchableOpacity>

        {/* ========================================================= */}
        {/* NAVIGATION SEGMENTED TABS */}
        {/* ========================================================= */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabScrollContent}
        >
          {(
            [
              'Overview',
              'Accounts',
              'Budgets',
              'Trips & Tours',
              'Friends Khata',
              'Savings Pots',
              'Bills & Debt',
            ] as NavTab[]
          ).map((tab) => {
              const isActive = activeTab === tab;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.navTabChip, isActive && styles.navTabChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setActiveTab(tab);
                  }}
                >
                  <Text style={[styles.navTabChipText, isActive && styles.navTabChipTextActive]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW & CASHFLOW */}
        {/* ========================================================= */}
        {activeTab === 'Overview' && (
          <View style={styles.tabContent}>
            {/* Monthly Budget Burn Meter */}
            <GlassCard style={styles.budgetGaugeCard}>
              <View style={styles.budgetHeader}>
                <View style={styles.budgetTitleRow}>
                  <Ionicons name="pie-chart" size={18} color={Colors.primary} />
                  <Text style={styles.cardHeaderTitle}>Monthly Budget Gauge</Text>
                </View>
                <Text style={styles.budgetRatio}>
                  {formatINR(totalExpense)} / {formatINR(overallBudget)}
                </Text>
              </View>

              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${budgetUsedPercent}%`,
                      backgroundColor:
                        budgetUsedPercent >= 90
                          ? '#EF4444'
                          : budgetUsedPercent >= 75
                          ? '#F59E0B'
                          : Colors.primary,
                    },
                  ]}
                />
              </View>

              <View style={styles.budgetFooter}>
                <Text style={styles.budgetPercentText}>{budgetUsedPercent}% spent</Text>
                <Text style={styles.budgetRemainingText}>
                  {formatINR(Math.max(0, overallBudget - totalExpense))} remaining
                </Text>
              </View>
            </GlassCard>

            {/* Category Spend Pills */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Spending Categories</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catSpendScroll}>
              {categories
                .filter((c) => c.type === 'expense' && (categorySpendMap[c.id] || 0) > 0)
                .map((cat) => {
                  const spend = categorySpendMap[cat.id] || 0;
                  const percent = totalExpense > 0 ? Math.round((spend / totalExpense) * 100) : 0;
                  return (
                    <View key={cat.id} style={styles.catSpendCard}>
                      <View style={[styles.catIconWrap, { backgroundColor: cat.color + '26' }]}>
                        <Ionicons name={cat.icon as any} size={18} color={cat.color} />
                      </View>
                      <Text style={styles.catSpendName} numberOfLines={1}>
                        {cat.name}
                      </Text>
                      <Text style={styles.catSpendAmount}>{formatINR(spend)}</Text>
                      <Text style={styles.catSpendPercent}>{percent}% of spend</Text>
                    </View>
                  );
                })}
            </ScrollView>

            {/* Transactions Header with Time Filter & CSV Export */}
            <View style={styles.txHeaderCol}>
              <View style={styles.txHeaderTop}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.sectionTitle}>Transactions</Text>
                  <Text style={styles.sectionSubtitle}>Tap to edit • Hold to delete</Text>
                </View>
                <TouchableOpacity
                  style={styles.exportCsvBtn}
                  onPress={handleQuickExportCSV}
                >
                  <Ionicons name="share-outline" size={13} color="#60A5FA" />
                  <Text style={styles.exportCsvText}>Export CSV</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.timeFilterScroll}
                contentContainerStyle={styles.timeFilterRow}
              >
                {(['Today', 'Week', 'Month', 'All'] as TimeFilter[]).map((f) => (
                  <TouchableOpacity
                    key={f}
                    style={[styles.timeChip, timeFilter === f && styles.timeChipActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      setTimeFilter(f);
                    }}
                  >
                    <Text style={[styles.timeChipText, timeFilter === f && styles.timeChipTextActive]}>
                      {f}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Month Navigator Bar (visible when timeFilter is Month) */}
            {timeFilter === 'Month' && (
              <View style={styles.monthNavRow}>
                <TouchableOpacity
                  onPress={handlePrevMonth}
                  style={styles.monthNavBtn}
                  accessibilityLabel="Previous Month"
                >
                  <Ionicons name="chevron-back" size={16} color="#FFFFFF" />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                  <Text style={styles.monthNavTitle}>{formatMonthLabel(selectedMonth)}</Text>
                  <Text style={styles.monthNavSubtitle}>
                    In: +{formatINR(monthIncome)} • Out: -{formatINR(monthExpense)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={handleNextMonth}
                  style={styles.monthNavBtn}
                  accessibilityLabel="Next Month"
                >
                  <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Search Bar & Category Filter */}
            <View style={styles.searchBarRow}>
              <Ionicons name="search" size={16} color={Colors.textMuted} style={{ marginLeft: 10 }} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search expenses (e.g. Swiggy, Petrol, Rent...)"
                placeholderTextColor={Colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 6 }}>
                  <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catFilterScroll}>
              {['All', ...categories.filter((c) => c.type === 'expense').map((c) => c.id)].map((catId) => {
                const catObj = categories.find((c) => c.id === catId);
                const label = catId === 'All' ? 'All Categories' : catObj?.name || catId;
                const isSelected = selectedCategoryFilter === catId;
                return (
                  <TouchableOpacity
                    key={catId}
                    style={[styles.catFilterChip, isSelected && styles.catFilterChipActive]}
                    onPress={() => {
                      setSelectedCategoryFilter(catId);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    }}
                  >
                    <Text style={[styles.catFilterChipText, isSelected && styles.catFilterChipTextActive]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Transaction List */}
            {filteredTransactions.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={40} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No Transactions Recorded</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "+ Expense" or "+ Income" to record cashflow.
                </Text>
              </View>
            ) : (
              filteredTransactions.map((tx) => {
                const cat = categories.find((c) => c.id === tx.categoryId);
                const acc = accounts.find((a) => a.id === tx.accountId);
                const isExpense = tx.type === 'expense';
                const isIncome = tx.type === 'income';

                return (
                  <TouchableOpacity
                    key={tx.id}
                    style={styles.txCard}
                    onPress={() => handleEditTx(tx)}
                    onLongPress={() => handleDeleteTx(tx)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.txIconWrap,
                        {
                          backgroundColor: isExpense
                            ? 'rgba(239, 68, 68, 0.15)'
                            : isIncome
                            ? 'rgba(16, 185, 129, 0.15)'
                            : 'rgba(59, 130, 246, 0.15)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={
                          cat?.icon
                            ? (cat.icon as any)
                            : isExpense
                            ? 'arrow-up'
                            : isIncome
                            ? 'arrow-down'
                            : 'swap-horizontal'
                        }
                        size={18}
                        color={isExpense ? '#EF4444' : isIncome ? '#10B981' : '#3B82F6'}
                      />
                    </View>

                    <View style={styles.txInfo}>
                      <Text style={styles.txTitle} numberOfLines={1}>
                        {tx.title}
                      </Text>
                      <View style={styles.txMetaRow}>
                        <Text style={styles.txMetaText}>{acc?.name || 'Account'}</Text>
                        <Text style={styles.txMetaDot}>•</Text>
                        <Text style={styles.txMetaText}>{tx.paymentMethod}</Text>
                        <Text style={styles.txMetaDot}>•</Text>
                        <Text style={styles.txMetaText}>{tx.date}</Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        styles.txAmount,
                        {
                          color: isExpense ? '#F87171' : isIncome ? '#4ADE80' : '#60A5FA',
                        },
                      ]}
                    >
                      {isExpense ? '-' : isIncome ? '+' : ''}
                      {money(tx.amount)}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ACCOUNTS & CARDS */}
        {/* ========================================================= */}
        {activeTab === 'Accounts' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Linked Accounts & Cards</Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={[
                    styles.smallAddBtn,
                    {
                      backgroundColor: 'rgba(56, 189, 248, 0.15)',
                      borderWidth: 1,
                      borderColor: '#38BDF8',
                    },
                  ]}
                  onPress={() => setSelfTransferModalVisible(true)}
                >
                  <Ionicons name="swap-horizontal" size={14} color="#38BDF8" />
                  <Text style={[styles.smallAddBtnText, { color: '#38BDF8' }]}>Transfer</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.smallAddBtn}
                  onPress={() => setAddAccountModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            {accounts.map((acc) => {
              const isCredit = acc.type === 'credit_card';
              const availableLimit = isCredit && acc.creditLimit ? acc.creditLimit - acc.balance : 0;

              return (
                <GlassCard key={acc.id} style={styles.accountCard} variant="elevated">
                  <View style={styles.accountTopRow}>
                    <View style={styles.accountTitleRow}>
                      <View style={[styles.accountIconBox, { backgroundColor: acc.color + '26' }]}>
                        <Ionicons name={acc.icon as any} size={20} color={acc.color} />
                      </View>
                      <View>
                        <Text style={styles.accountName}>{acc.name}</Text>
                        <Text style={styles.accountType}>
                          {acc.type.toUpperCase().replace('_', ' ')} {acc.accountNumberMasked ? `• ${acc.accountNumberMasked}` : ''}
                        </Text>
                      </View>
                    </View>
                    <Badge
                      label={isCredit ? 'Credit Card' : 'Active'}
                      variant={isCredit ? 'danger' : 'primary'}
                    />
                  </View>

                  <View style={styles.accountDivider} />

                  <View style={styles.accountBottomRow}>
                    <View>
                      <Text style={styles.accountBalLabel}>
                        {isCredit ? 'Outstanding Due' : 'Available Balance'}
                      </Text>
                      <Text style={[styles.accountBalValue, isCredit && { color: '#F87171' }]}>
                        {money(acc.balance)}
                      </Text>
                    </View>

                    {isCredit && (
                      <View style={{ alignItems: 'flex-end', gap: 6 }}>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.accountBalLabel}>Available Credit</Text>
                          <Text style={[styles.accountBalValue, { color: '#4ADE80' }]}>
                            {money(availableLimit)}
                          </Text>
                        </View>
                        {acc.balance > 0 && (
                          <TouchableOpacity
                            style={styles.payCardBtn}
                            onPress={() => handlePayCreditCardBill(acc)}
                          >
                            <Ionicons name="card" size={12} color="#FFFFFF" />
                            <Text style={styles.payCardBtnText}>Pay Bill</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BUDGETS & SAVINGS GOALS */}
        {/* ========================================================= */}
        {activeTab === 'Budgets' && (
          <View style={styles.tabContent}>
            {/* Monthly Salary & In-Hand Live Overview Card */}
            <GlassCard style={styles.salaryOverviewCard} variant="elevated">
              <View style={styles.salaryCardTop}>
                <View>
                  <Text style={styles.salaryCardLabel}>Monthly Salary Budget</Text>
                  <Text style={styles.salaryCardAmount}>
                    {monthlySalary > 0 ? money(monthlySalary) : 'Not Set (₹0)'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.salaryManageBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setAddBudgetGoalModalVisible(true);
                  }}
                >
                  <Ionicons name="wallet-outline" size={14} color="#FFFFFF" />
                  <Text style={styles.salaryManageBtnText}>
                    {monthlySalary > 0 ? 'Manage Salary & Plan' : '+ Set Salary & Plan'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.salaryCardDivider} />

              <View style={styles.salaryMetricsRow}>
                <View>
                  <Text style={styles.salaryMetricLabel}>Spent This Month</Text>
                  <Text style={[styles.salaryMetricValue, { color: '#F87171' }]}>
                    -{money(totalExpense)}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.salaryMetricLabel}>In-Hand Balance</Text>
                  <Text
                    style={[
                      styles.salaryMetricValue,
                      { color: totalExpense > monthlySalary ? '#EF4444' : '#4ADE80' },
                    ]}
                  >
                    {money(Math.max(0, monthlySalary - totalExpense))}
                  </Text>
                </View>
              </View>

              {monthlySalary > 0 && (
                <TouchableOpacity
                  style={styles.creditSalaryBtn}
                  onPress={handleCreditSalaryToBank}
                >
                  <Ionicons name="card-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.creditSalaryBtnText}>
                    + Credit {formatINR(monthlySalary)} to Bank Account
                  </Text>
                </TouchableOpacity>
              )}
            </GlassCard>

            {/* Budgets Section */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Category Spending Budgets</Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={styles.smallAddBtn}
                  onPress={() => setAddBudgetGoalModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>+ Salary & Plan</Text>
                </TouchableOpacity>
              </View>
            </View>

            {budgets.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="pie-chart-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No Category Budgets Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Set your monthly salary above to start tracking your salary & monthly expenses cleanly.
                </Text>
              </View>
            ) : (
              budgets.map((b) => {
                const spent = b.categoryId ? categorySpendMap[b.categoryId] || 0 : totalExpense;
                const percent = b.amount > 0 ? Math.min(100, Math.round((spent / b.amount) * 100)) : 0;
                const remaining = Math.max(0, b.amount - spent);
              const isOver = spent > b.amount;

              return (
                <GlassCard key={b.id} style={styles.budgetItemCard}>
                  <View style={styles.budgetCardHeader}>
                    <Text style={styles.budgetCardTitle}>{b.name}</Text>
                    <Badge
                      label={isOver ? 'Exceeded ⚠️' : `${percent}%`}
                      variant={isOver ? 'danger' : percent >= 80 ? 'gold' : 'primary'}
                    />
                  </View>

                  <View style={styles.budgetCardTrack}>
                    <View
                      style={[
                        styles.budgetCardFill,
                        {
                          width: `${percent}%`,
                          backgroundColor: isOver ? '#EF4444' : percent >= 80 ? '#F59E0B' : '#10B981',
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.budgetCardMeta}>
                    <Text style={styles.budgetCardMetaText}>
                      Spent: <Text style={{ color: '#FFFFFF' }}>{money(spent)}</Text> of{' '}
                      {money(b.amount)}
                    </Text>
                    <Text style={[styles.budgetCardMetaText, { color: isOver ? '#EF4444' : '#4ADE80' }]}>
                      {isOver ? `Over by ${money(spent - b.amount)}` : `${money(remaining)} left`}
                    </Text>
                  </View>
                </GlassCard>
              );
            })
          )}

            {/* Savings Goals Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Savings Goals & Milestones</Text>
                <Text style={styles.sectionSubtitle}>Plan targets & calculate compound growth</Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={[styles.smallAddBtn, { backgroundColor: 'rgba(99, 102, 241, 0.25)', borderColor: '#6366F1' }]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSipCalculatorModalVisible(true);
                  }}
                >
                  <Ionicons name="trending-up" size={14} color="#818CF8" />
                  <Text style={[styles.smallAddBtnText, { color: '#C7D2FE' }]}>SIP Simulator</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.smallAddBtn}
                  onPress={() => setAddBudgetGoalModalVisible(true)}
                >
                  <Ionicons name="flag" size={14} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>+ Goal</Text>
                </TouchableOpacity>
              </View>
            </View>

            {savingsGoals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="flag-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No Savings Goals Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Track your future milestones and savings goals here.
                </Text>
              </View>
            ) : (
              savingsGoals.map((goal) => {
              const percent = goal.targetAmount > 0
                ? Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100))
                : 0;

              return (
                <GlassCard key={goal.id} style={styles.goalCard}>
                  <View style={styles.goalHeaderRow}>
                    <View style={styles.goalTitleRow}>
                      <View style={[styles.goalIconWrap, { backgroundColor: goal.color + '26' }]}>
                        <Ionicons name={goal.categoryIcon as any} size={18} color={goal.color} />
                      </View>
                      <View>
                        <Text style={styles.goalName}>{goal.name}</Text>
                        <Text style={styles.goalDate}>Target: {goal.targetDate}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.depositBtn}
                      onPress={() => handleDepositToGoal(goal)}
                    >
                      <Text style={styles.depositBtnText}>+ Deposit</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.goalProgressTrack}>
                    <View style={[styles.goalProgressFill, { width: `${percent}%`, backgroundColor: goal.color }]} />
                  </View>

                  <View style={styles.goalFooter}>
                    <Text style={styles.goalSavedText}>
                      Saved: <Text style={{ color: '#FFFFFF' }}>{money(goal.currentAmount)}</Text>
                    </Text>
                    <Text style={styles.goalTargetText}>Target: {money(goal.targetAmount)} ({percent}%)</Text>
                  </View>
                </GlassCard>
              );
            })
          )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: BILLS & DEBT (VATTI / LOANS) */}
        {/* ========================================================= */}
        {activeTab === 'Bills & Debt' && (
          <View style={styles.tabContent}>
            {/* Upcoming Bills & Subscriptions */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Upcoming Bills & Subscriptions</Text>
                <Text style={styles.sectionSubtitle}>Recurring commitments & payment reminders</Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={styles.smallAddBtn}
                  onPress={() => setAddBillModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>+ Bill</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Subscriptions & OTT Audit Tracker */}
            {subscriptionBills.length > 0 && (
              <GlassCard style={styles.subscriptionsCard}>
                <View style={styles.subsTopRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Ionicons name="sparkles" size={18} color="#A78BFA" />
                    <Text style={styles.subsCardTitle}>Active Subscriptions & OTT</Text>
                  </View>
                  <Badge label={`${subscriptionBills.length} Active`} variant="primary" />
                </View>
                <View style={styles.subsStatsRow}>
                  <View style={styles.subsStatCol}>
                    <Text style={styles.subsStatLabel}>Monthly Recurring Burn</Text>
                    <Text style={styles.subsStatVal}>{money(monthlySubscriptionBurn)}/mo</Text>
                  </View>
                  <View style={styles.subsStatDivider} />
                  <View style={styles.subsStatCol}>
                    <Text style={styles.subsStatLabel}>Annualized SaaS / OTT</Text>
                    <Text style={[styles.subsStatVal, { color: '#F59E0B' }]}>{money(monthlySubscriptionBurn * 12)}/yr</Text>
                  </View>
                </View>
                <View style={styles.subsTagsWrap}>
                  {subscriptionBills.map((sb) => (
                    <View key={sb.id} style={styles.subsPill}>
                      <Text style={styles.subsPillText}>{sb.title}</Text>
                      <Text style={styles.subsPillAmount}>{money(sb.amount)}</Text>
                    </View>
                  ))}
                </View>
              </GlassCard>
            )}

            {bills.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="calendar-outline" size={32} color={Colors.textMuted} />
                <Text style={styles.emptyTitle}>No Upcoming Bills</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "+ Bill" to add your Rent, EB Bill, WiFi, EMI, or Subscriptions.
                </Text>
              </View>
            ) : (
              bills.map((bill) => {
                const now = new Date();
                const todayStr = now.toISOString().slice(0, 10);
                const dueStr = bill.dueDate || '';
                let urgencyBadge = null;

                if (bill.isPaid) {
                  urgencyBadge = <Badge label="Paid ✓" variant="primary" />;
                } else if (dueStr) {
                  const diffTime = new Date(dueStr).getTime() - new Date(todayStr).getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  if (diffDays < 0) {
                    urgencyBadge = <Badge label={`Overdue ${Math.abs(diffDays)}d 🚨`} variant="danger" />;
                  } else if (diffDays === 0) {
                    urgencyBadge = <Badge label="Due Today! ⚠️" variant="danger" />;
                  } else if (diffDays <= 3) {
                    urgencyBadge = <Badge label={`Due in ${diffDays}d ⏳`} variant="gold" />;
                  } else {
                    urgencyBadge = <Badge label={`Due in ${diffDays}d`} variant="neutral" />;
                  }
                }

                return (
                  <View key={bill.id} style={styles.billCard}>
                    <View style={styles.billInfo}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.billTitle}>{bill.title}</Text>
                        {urgencyBadge}
                      </View>
                      <Text style={styles.billDue}>Due: {bill.dueDate} • {bill.recurring}</Text>
                    </View>
                    <View style={styles.billActionRow}>
                      <Text style={styles.billAmount}>{money(bill.amount)}</Text>
                      {bill.isPaid ? (
                        <Badge label="Paid ✓" variant="primary" />
                      ) : (
                        <TouchableOpacity
                          style={styles.payNowBtn}
                          onPress={() => handlePayBill(bill)}
                        >
                          <Text style={styles.payNowBtnText}>Pay Now</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })
            )}

            {/* Loan & Vatti (Interest) Engine */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Loan & Vatti (Interest) Engine</Text>
                <Text style={styles.sectionSubtitle}>
                  Monthly Due: {money(totalMonthlyVattiDue)} • Total Debt: {money(totalOutstandingLoanPrincipal)}
                </Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={styles.smallAddBtn}
                  onPress={() => setAddLoanModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>+ Loan</Text>
                </TouchableOpacity>
              </View>
            </View>

            {loans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-checkmark-outline" size={40} color="#10B981" />
                <Text style={styles.emptyTitle}>Zero Outstanding Loans</Text>
                <Text style={styles.emptySubtitle}>You are debt-free! Tap "+ Loan" to track borrower/lender terms.</Text>
              </View>
            ) : (
              loans.map((loan) => (
                <GlassCard key={loan.id} style={styles.loanCard}>
                  <View style={styles.loanHeader}>
                    <View>
                      <Text style={styles.loanLender}>{loan.lenderName}</Text>
                      <Text style={styles.loanRate}>
                        {loan.monthlyRatePercent}% / month ({loan.monthlyRatePercent * 12}% per year)
                      </Text>
                    </View>
                    <Badge
                      label={loan.status === 'active' ? `Due Day ${loan.dueDayOfMonth}` : 'Settled'}
                      variant={loan.status === 'active' ? 'gold' : 'primary'}
                    />
                  </View>

                  <View style={styles.loanMetricsRow}>
                    <View>
                      <Text style={styles.loanMetricLabel}>Principal</Text>
                      <Text style={styles.loanMetricVal}>{money(loan.principalAmount)}</Text>
                    </View>
                    <View>
                      <Text style={styles.loanMetricLabel}>Monthly Vatti</Text>
                      <Text style={[styles.loanMetricVal, { color: '#F87171' }]}>
                        {money(loan.monthlyInterestAmount)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.loanMetricLabel}>Interest Paid</Text>
                      <Text style={styles.loanMetricVal}>{money(loan.lifetimeInterestPaid)}</Text>
                    </View>
                  </View>

                  {loan.status === 'active' && (
                    <View style={styles.loanActions}>
                      <TouchableOpacity
                        style={styles.loanActionBtnSecondary}
                        onPress={() => setSelectedLoanForRepay(loan)}
                      >
                        <Text style={styles.loanActionTextSec}>Part Repay Principal</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.loanActionBtnPrimary}
                        onPress={() => {
                          payMonthlyVatti(loan.id);
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                          Alert.alert('Payment Recorded', `Logged ${formatINR(loan.monthlyInterestAmount)} vatti paid.`);
                        }}
                      >
                        <Text style={styles.loanActionTextPrim}>Pay Vatti</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </GlassCard>
              ))
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB: TRIPS & TOURS (FUEL, DRIVER, TOLL, REPAIR, SPLIT) */}
        {/* ========================================================= */}
        {activeTab === 'Trips & Tours' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Trip & Tour Manager</Text>
                <Text style={styles.sectionSubtitle}>
                  Petrol, Diesel, Toll, Driver Batta & Friends Split
                </Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={styles.smallAddBtn}
                  onPress={() => setAddTripModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>+ Plan Trip</Text>
                </TouchableOpacity>
              </View>
            </View>

            {trips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="airplane-outline" size={40} color="#38BDF8" />
                <Text style={styles.emptyTitle}>No Trips Planned Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "+ Plan Trip" to set budget, add friends (e.g. Alex, Sam, Chris), track fuel, rooms & split expenses.
                </Text>
              </View>
            ) : (
              trips.map((t) => {
                const isSolo = t.tripType === 'solo';
                const totalPool = (t.contributions || []).reduce((sum, c) => sum + c.amount, 0);
                const spent = (t.expenses || []).reduce((sum, e) => sum + e.amount, 0);
                const poolLeft = Math.max(0, totalPool - spent);
                const soloLeft = Math.max(0, t.budget - spent);

                return (
                  <GlassCard key={t.id} style={styles.tripCardElevated} variant="elevated">
                    <View style={styles.tripCardTop}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <Text style={styles.tripCardTitle}>{t.name}</Text>
                          <View
                            style={{
                              backgroundColor: isSolo ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)',
                              paddingHorizontal: 8,
                              paddingVertical: 2,
                              borderRadius: 12,
                            }}
                          >
                            <Text
                              style={{
                                color: isSolo ? '#38BDF8' : '#D8B4FE',
                                fontSize: 11,
                                fontWeight: '700',
                              }}
                            >
                              {isSolo ? '👤 Solo Trip' : '👥 Group Trip'}
                            </Text>
                          </View>
                        </View>
                        <Text style={styles.tripCardMeta}>
                          {isSolo ? 'Personal Solo Trip' : `${t.members.length} Members: ${t.members.join(', ')}`}
                        </Text>
                      </View>
                      <Badge
                        label={t.status === 'completed' ? 'Completed ✓' : 'Active 🏖️'}
                        variant={t.status === 'completed' ? 'neutral' : 'primary'}
                      />
                    </View>

                    {/* Metrics Grid */}
                    <View style={styles.tripMetricsGrid}>
                      {isSolo ? (
                        <>
                          <View style={styles.tripMetricCell}>
                            <Text style={styles.tripMetricLabel}>Solo Budget</Text>
                            <Text style={styles.tripMetricVal}>{formatINR(t.budget)}</Text>
                          </View>
                          <View style={styles.tripMetricCell}>
                            <Text style={styles.tripMetricLabel}>Spent So Far</Text>
                            <Text style={[styles.tripMetricVal, { color: '#F87171' }]}>
                              -{formatINR(spent)}
                            </Text>
                          </View>
                          <View style={styles.tripMetricCell}>
                            <Text style={styles.tripMetricLabel}>Remaining</Text>
                            <Text style={[styles.tripMetricVal, { color: '#4ADE80' }]}>
                              {formatINR(soloLeft)}
                            </Text>
                          </View>
                        </>
                      ) : (
                        <>
                          <View style={styles.tripMetricCell}>
                            <Text style={styles.tripMetricLabel}>Trip Budget</Text>
                            <Text style={styles.tripMetricVal}>{formatINR(t.budget)}</Text>
                          </View>
                          <View style={styles.tripMetricCell}>
                            <Text style={styles.tripMetricLabel}>Pool Collected</Text>
                            <Text style={[styles.tripMetricVal, { color: '#38BDF8' }]}>
                              {formatINR(totalPool)}
                            </Text>
                          </View>
                          <View style={styles.tripMetricCell}>
                            <Text style={styles.tripMetricLabel}>Spent So Far</Text>
                            <Text style={[styles.tripMetricVal, { color: '#F87171' }]}>
                              -{formatINR(spent)}
                            </Text>
                          </View>
                          <View style={styles.tripMetricCell}>
                            <Text style={styles.tripMetricLabel}>Pool Cash Left</Text>
                            <Text style={[styles.tripMetricVal, { color: '#4ADE80' }]}>
                              {formatINR(poolLeft)}
                            </Text>
                          </View>
                        </>
                      )}
                    </View>

                    {/* Action Row */}
                    <View style={styles.tripActionRow}>
                      <TouchableOpacity
                        style={styles.tripManageBtn}
                        onPress={() => setSelectedTripForManage(t)}
                      >
                        <Ionicons name="receipt-outline" size={15} color="#FFFFFF" />
                        <Text style={styles.tripManageBtnText}>
                          {isSolo ? 'Manage Solo Expenses' : 'Manage Expenses & Split'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.tripDeleteBtn}
                        onPress={() => handleDeleteTrip(t.id, t.name)}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB: FRIENDS KHATA (I GAVE / I TOOK - கடன் கொடுத்தது / வாங்கியது) */}
        {/* ========================================================= */}
        {activeTab === 'Friends Khata' && (
          <View style={styles.tabContent}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Friends Khata (கொடுத்தது / வாங்கியது)</Text>
                <Text style={styles.sectionSubtitle}>
                  Track money lent to or borrowed from friends & family
                </Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={[styles.smallAddBtn, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    setPeerDebtDefaultType('gave');
                    setAddPeerDebtModalVisible(true);
                  }}
                >
                  <Ionicons name="arrow-up" size={14} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>I Gave</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.smallAddBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => {
                    setPeerDebtDefaultType('took');
                    setAddPeerDebtModalVisible(true);
                  }}
                >
                  <Ionicons name="arrow-down" size={14} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>I Took</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Khata Hero Cards */}
            <View style={styles.khataHeroRow}>
              <GlassCard style={[styles.khataHeroCard, { borderColor: 'rgba(74, 222, 128, 0.3)' }]}>
                <Text style={styles.khataHeroLabel}>You'll Get Back (அவர்கள் தர வேண்டியது)</Text>
                <Text style={[styles.khataHeroAmount, { color: '#4ADE80' }]}>
                  {money(totalKhataToGet)}
                </Text>
              </GlassCard>

              <GlassCard style={[styles.khataHeroCard, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
                <Text style={styles.khataHeroLabel}>You Owe (நீங்கள் தர வேண்டியது)</Text>
                <Text style={[styles.khataHeroAmount, { color: '#F87171' }]}>
                  {money(totalKhataToPay)}
                </Text>
              </GlassCard>
            </View>

            {/* List of Debts */}
            {peerDebts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={40} color="#10B981" />
                <Text style={styles.emptyTitle}>Zero Pending Debts</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "+ I Gave" or "+ I Took" to track dinner bills, petrol split, or hand loans.
                </Text>
              </View>
            ) : (
              peerDebts.map((d) => {
                const isGave = d.type === 'gave';
                const isSettled = d.status === 'settled';
                const paid = d.paidAmount || 0;
                const pending = Math.max(0, d.amount - paid);

                return (
                  <GlassCard key={d.id} style={styles.khataItemCard}>
                    <View style={styles.khataPersonRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View
                          style={[
                            styles.khataIconBox,
                            { backgroundColor: isGave ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)' },
                          ]}
                        >
                          <Ionicons
                            name={isGave ? 'arrow-up' : 'arrow-down'}
                            size={16}
                            color={isGave ? '#EF4444' : '#10B981'}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.khataPersonName}>{d.personName}</Text>
                          <Text style={styles.khataNote}>
                            {d.note || (isGave ? 'Lent' : 'Borrowed')} • {d.date}
                            {d.personPhone ? ` • ${d.personPhone}` : ''}
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end', gap: 2 }}>
                        <Text style={[styles.khataAmount, { color: isGave ? '#4ADE80' : '#F87171' }]}>
                          {isGave ? `+${money(pending)}` : `-${money(pending)}`}
                        </Text>
                        {paid > 0 && !isSettled && (
                          <Text style={{ fontSize: 10, color: '#38BDF8', fontWeight: '600' }}>
                            Paid {money(paid)} / {money(d.amount)}
                          </Text>
                        )}
                        <Text style={styles.khataTypeDesc}>
                          {isSettled ? 'Settled' : isGave ? "You'll get" : 'You owe'}
                        </Text>
                      </View>
                    </View>

                    {/* Settle Row */}
                    <View style={styles.khataActionRow}>
                      {isSettled ? (
                        <Badge label="Settled ✓" variant="primary" />
                      ) : (
                        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          {isGave && (
                            <TouchableOpacity
                              style={[
                                styles.settleBtn,
                                {
                                  backgroundColor: 'rgba(37, 211, 102, 0.15)',
                                  borderWidth: 1,
                                  borderColor: '#25D366',
                                },
                              ]}
                              onPress={() => handleSendKhataReminder(d)}
                            >
                              <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
                              <Text style={[styles.settleBtnText, { color: '#25D366' }]}>Remind</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={[
                              styles.settleBtn,
                              {
                                backgroundColor: 'rgba(56, 189, 248, 0.12)',
                                borderWidth: 1,
                                borderColor: 'rgba(56, 189, 248, 0.3)',
                              },
                            ]}
                            onPress={() => {
                              setSelectedDebtForPartial(d);
                              setPartialPaymentModalVisible(true);
                            }}
                          >
                            <Ionicons name="cash-outline" size={13} color="#38BDF8" />
                            <Text style={[styles.settleBtnText, { color: '#38BDF8' }]}>+ Partial Pay</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.settleBtn}
                            onPress={() => handleSettlePeerDebt(d)}
                          >
                            <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.settleBtnText}>Full Settle</Text>
                          </TouchableOpacity>
                        </View>
                      )}

                      <TouchableOpacity onPress={() => handleDeletePeerDebt(d.id)}>
                        <Ionicons name="trash-outline" size={15} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })
            )}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB: SAVINGS POTS (HEALTH, EMERGENCY, TRIPS) & GOLD */}
        {/* ========================================================= */}
        {activeTab === 'Savings Pots' && (
          <View style={styles.tabContent}>
            {/* Header */}
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Purpose Savings Pots</Text>
                <Text style={styles.sectionSubtitle}>
                  Health Reserve 🏥, Emergency 🛡️, Trip Savings 🏖️
                </Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={[styles.smallAddBtn, { backgroundColor: '#10B981' }]}
                  onPress={() => setAddSavingsPotModalVisible(true)}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.smallAddBtnText}>+ Create Pot</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Total In Pots Hero Card */}
            <GlassCard style={styles.potsHeroCard} variant="elevated">
              <Text style={styles.potsHeroLabel}>Total Accumulated Savings in Pots</Text>
              <Text style={styles.potsHeroVal}>{money(totalSavedInPots)}</Text>
              <Text style={styles.potsHeroSub}>
                {savingsGoals.length} Active Pots • Dedicated safety reserves
              </Text>
            </GlassCard>

            {/* Savings Pots List */}
            {savingsGoals.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="shield-checkmark-outline" size={40} color="#10B981" />
                <Text style={styles.emptyTitle}>No Savings Pots Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Tap "+ Create Pot" to set up Health Emergency, Trip Savings, or Vehicle Maintenance.
                </Text>
              </View>
            ) : (
              savingsGoals.map((pot) => {
                const percent = pot.targetAmount > 0
                  ? Math.min(100, Math.round((pot.currentAmount / pot.targetAmount) * 100))
                  : 0;

                return (
                  <GlassCard key={pot.id} style={styles.potCard}>
                    <View style={styles.potTopRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={[styles.potIconBox, { backgroundColor: pot.color + '26' }]}>
                          <Ionicons name={pot.categoryIcon as any} size={20} color={pot.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.potName}>{pot.name}</Text>
                          <Text style={styles.potDate}>Target: {pot.targetDate}</Text>
                        </View>
                      </View>
                      <Badge label={`${percent}%`} variant={percent >= 80 ? 'gold' : 'primary'} />
                    </View>

                    {/* Progress Track */}
                    <View style={styles.potProgressTrack}>
                      <View
                        style={[
                          styles.potProgressFill,
                          { width: `${percent}%`, backgroundColor: pot.color },
                        ]}
                      />
                    </View>

                    {/* Meta Values */}
                    <View style={styles.potFooterRow}>
                      <Text style={styles.potMetaText}>
                        Saved: <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{money(pot.currentAmount)}</Text>
                      </Text>
                      <Text style={styles.potMetaText}>
                        Target: {money(pot.targetAmount)}
                      </Text>
                    </View>

                    {/* Actions */}
                    <View style={styles.potActionRow}>
                      <TouchableOpacity
                        style={styles.potDepositBtn}
                        onPress={() => handleDepositToGoal(pot)}
                      >
                        <Ionicons name="add" size={14} color="#FFFFFF" />
                        <Text style={styles.potDepositBtnText}>Deposit ₹5,000</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.potWithdrawBtn}
                        onPress={() => handleWithdrawFromGoal(pot)}
                      >
                        <Ionicons name="arrow-up" size={14} color="#38BDF8" />
                        <Text style={styles.potWithdrawBtnText}>Withdraw</Text>
                      </TouchableOpacity>

                      <TouchableOpacity onPress={() => deleteGoal(pot.id)} style={{ padding: 4 }}>
                        <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </GlassCard>
                );
              })
            )}

            {/* Gold Assets Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <View style={styles.sectionHeaderTitleWrap}>
                <Text style={styles.sectionTitle}>Physical Gold Portfolio</Text>
                <Text style={styles.sectionSubtitle}>
                  {totalGoldSovereigns} Sovereigns • Market Valuation: {money(totalGoldNetWorth)}
                </Text>
              </View>
              <View style={styles.sectionHeaderActionsWrap}>
                <TouchableOpacity
                  style={styles.smallAddBtn}
                  onPress={() => setAddGoldModalVisible(true)}
                >
                  <Ionicons name="sparkles" size={14} color={Colors.gold} />
                  <Text style={styles.smallAddBtnText}>+ Gold</Text>
                </TouchableOpacity>
              </View>
            </View>

            {goldItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="sparkles-outline" size={36} color={Colors.gold} />
                <Text style={styles.emptyTitle}>No Gold Assets Added</Text>
                <Text style={styles.emptySubtitle}>Track 22K/24K gold ornaments, coins & sovereigns.</Text>
              </View>
            ) : (
              goldItems.map((g) => (
                <View key={g.id} style={styles.goldCard}>
                  <View>
                    <Text style={styles.goldName}>{g.name}</Text>
                    <Text style={styles.goldMeta}>
                      {g.weightGrams}g ({g.sovereigns} Savaran) • {g.purity} • {g.location}
                    </Text>
                  </View>
                  <Text style={styles.goldWorth}>
                    {money(Math.round(g.weightGrams * currentGoldRate))}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ========================================================= */}
      {/* ALL MODALS */}
      {/* ========================================================= */}
      <AddTransactionModal
        visible={addTxModalVisible}
        onClose={() => {
          setAddTxModalVisible(false);
          setEditingTransaction(null);
        }}
        defaultType={txModalDefaultType}
        initialTransaction={editingTransaction}
      />
      <AddAccountModal
        visible={addAccountModalVisible}
        onClose={() => setAddAccountModalVisible(false)}
      />
      <AddBudgetGoalModal
        visible={addBudgetGoalModalVisible}
        onClose={() => setAddBudgetGoalModalVisible(false)}
      />
      <AiInsightsModal
        visible={aiInsightsModalVisible}
        onClose={() => setAiInsightsModalVisible(false)}
      />
      <AddLoanModal
        visible={addLoanModalVisible}
        onClose={() => setAddLoanModalVisible(false)}
      />
      <AddGoldModal
        visible={addGoldModalVisible}
        onClose={() => setAddGoldModalVisible(false)}
      />
      <AddBillModal
        visible={addBillModalVisible}
        onClose={() => setAddBillModalVisible(false)}
      />
      <AddTripModal
        visible={addTripModalVisible}
        onClose={() => setAddTripModalVisible(false)}
      />
      <TripManageModal
        visible={Boolean(selectedTripForManage)}
        trip={selectedTripForManage}
        onClose={() => setSelectedTripForManage(null)}
      />
      <AddPeerDebtModal
        visible={addPeerDebtModalVisible}
        defaultType={peerDebtDefaultType}
        onClose={() => setAddPeerDebtModalVisible(false)}
      />
      <AddSavingsPotModal
        visible={addSavingsPotModalVisible}
        onClose={() => setAddSavingsPotModalVisible(false)}
      />
      <PartRepayModal
        visible={Boolean(selectedLoanForRepay)}
        loan={selectedLoanForRepay}
        onClose={() => setSelectedLoanForRepay(null)}
      />
      <PartialPaymentModal
        visible={partialPaymentModalVisible}
        debt={selectedDebtForPartial}
        onClose={() => {
          setPartialPaymentModalVisible(false);
          setSelectedDebtForPartial(null);
        }}
      />
      <SelfTransferModal
        visible={selfTransferModalVisible}
        onClose={() => setSelfTransferModalVisible(false)}
      />
      <RestoreBackupModal
        visible={restoreBackupModalVisible}
        onClose={() => setRestoreBackupModalVisible(false)}
      />
      <SipCalculatorModal
        visible={sipCalculatorModalVisible}
        onClose={() => setSipCalculatorModalVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 160,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 8,
    flexWrap: 'wrap',
  },
  headerTitleWrap: {
    flex: 1,
    minWidth: 160,
    marginRight: 6,
  },
  headerActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
    flexWrap: 'wrap',
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: '#F59E0B',
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: Radii.full,
    gap: 4,
  },
  aiButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },

  // Hero Card
  heroCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderRadius: Radii.xl,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  heroNetWorth: {
    fontSize: 30,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
    letterSpacing: -1,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: Spacing.md,
  },
  heroMetricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroMetricItem: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '700',
  },

  // Quick Action Bar
  quickActionBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 2,
    borderRadius: Radii.lg,
    borderWidth: 1,
    gap: 3,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Nav Tabs
  tabScroll: {
    marginBottom: Spacing.lg,
  },
  tabScrollContent: {
    paddingRight: Spacing.xl,
  },
  navTabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 8,
  },
  navTabChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  navTabChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  navTabChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  tabContent: {
    gap: Spacing.md,
  },

  // Budget Gauge
  budgetGaugeCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  budgetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardHeaderTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  budgetRatio: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetPercentText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  budgetRemainingText: {
    fontSize: 11,
    color: '#4ADE80',
    fontWeight: '600',
  },

  // Category Spend
  sectionHeader: {
    marginTop: Spacing.sm,
    marginBottom: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 8,
  },
  sectionHeaderTitleWrap: {
    flex: 1,
    minWidth: 150,
    marginRight: 6,
  },
  sectionHeaderActionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  smallAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.md,
    gap: 4,
  },
  smallAddBtnText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  catSpendScroll: {
    marginBottom: Spacing.sm,
  },
  catSpendCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    padding: 12,
    marginRight: 10,
    width: 120,
    alignItems: 'flex-start',
  },
  catIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  catSpendName: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  catSpendAmount: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  catSpendPercent: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },

  // Transactions
  txHeaderCol: {
    marginTop: Spacing.md,
    marginBottom: 6,
  },
  txHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  timeFilterScroll: {
    marginBottom: 4,
  },
  exportCsvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(96, 165, 250, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  exportCsvText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#60A5FA',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  monthNavBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthNavTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  monthNavSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  timeFilterRow: {
    flexDirection: 'row',
    gap: 4,
  },
  timeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  timeChipActive: {
    backgroundColor: Colors.primary,
  },
  timeChipText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: '#FFFFFF',
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  txIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  txMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  txMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  txMetaDot: {
    fontSize: 11,
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '800',
  },

  // Accounts
  accountCard: {
    padding: Spacing.lg,
    borderRadius: Radii.xl,
  },
  accountTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accountIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  accountType: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  accountDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: Spacing.md,
  },
  accountBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountBalLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  accountBalValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  payCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    marginTop: 4,
  },
  payCardBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Budgets Card
  budgetItemCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
  },
  budgetCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  budgetCardTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  budgetCardFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  budgetCardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  budgetCardMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Goals
  goalCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  goalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  goalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goalDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  depositBtn: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  depositBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  goalProgressTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.full,
    overflow: 'hidden',
  },
  goalProgressFill: {
    height: '100%',
    borderRadius: Radii.full,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  goalSavedText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  goalTargetText: {
    fontSize: 11,
    color: Colors.textMuted,
  },

  // Bills
  billCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  billInfo: {
    flex: 1,
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  billDue: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  billActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  billAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  payNowBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
  },
  payNowBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Loans / Vatti
  loanCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  loanLender: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loanRate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  loanMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.md,
    padding: 10,
    marginVertical: 10,
  },
  loanMetricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  loanMetricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  loanActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  loanActionBtnSecondary: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  loanActionTextSec: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  loanActionBtnPrimary: {
    flex: 1,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  loanActionTextPrim: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Gold & Trips
  goldCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  goldName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  goldMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  goldWorth: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.gold,
  },
  tripCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tripMembers: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tripBudget: {
    fontSize: 13,
    fontWeight: '700',
    color: '#38BDF8',
    marginTop: 6,
  },

  // Empty state
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },

  // Salary Planner Banner
  salaryPlannerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Radii.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  salaryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
    marginRight: 8,
  },
  salaryBannerIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  salaryBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  salaryBannerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  salaryBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    gap: 2,
  },
  salaryBannerActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },

  // Salary Overview Card in Budgets
  salaryOverviewCard: {
    padding: Spacing.md,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  salaryCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  salaryCardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  salaryCardAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#38BDF8',
    marginTop: 2,
  },
  salaryManageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.md,
    gap: 5,
  },
  salaryManageBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  salaryCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 10,
  },
  salaryMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  salaryMetricLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  salaryMetricValue: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  exportHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    gap: 4,
  },
  exportHeaderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },

  // Trips & Tours
  tripCardElevated: {
    padding: Spacing.md,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
  },
  tripCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  tripCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tripCardMeta: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  tripMetricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  tripMetricCell: {
    flex: 1,
    alignItems: 'center',
  },
  tripMetricLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  tripMetricVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  tripActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    gap: 8,
    flexWrap: 'wrap',
  },
  tripManageBtn: {
    flex: 1,
    minWidth: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radii.md,
    gap: 6,
  },
  tripManageBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tripDeleteBtn: {
    padding: 6,
  },

  // Friends Khata
  khataHeroRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  khataHeroCard: {
    flex: 1,
    padding: Spacing.md,
    borderRadius: Radii.xl,
    borderWidth: 1,
  },
  khataHeroLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  khataHeroAmount: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  khataItemCard: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
  },
  khataPersonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  khataIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  khataPersonName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  khataNote: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  khataAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  khataTypeDesc: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  khataActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.04)',
    flexWrap: 'wrap',
    gap: 8,
  },
  settleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.full,
    gap: 4,
  },
  settleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38BDF8',
  },

  // Savings Pots
  potsHeroCard: {
    padding: Spacing.md,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
    alignItems: 'center',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  potsHeroLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  potsHeroVal: {
    fontSize: 26,
    fontWeight: '800',
    color: '#10B981',
    marginTop: 2,
  },
  potsHeroSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  potCard: {
    padding: Spacing.md,
    borderRadius: Radii.xl,
    marginBottom: Spacing.md,
  },
  potTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  potIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  potName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  potDate: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  potProgressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginBottom: 6,
  },
  potProgressFill: {
    height: '100%',
    borderRadius: 3,
  },
  potFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  potMetaText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  potActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  potDepositBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    gap: 4,
  },
  potDepositBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  potWithdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.md,
    gap: 4,
  },
  potWithdrawBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 8,
  },
  searchBarInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    paddingHorizontal: 8,
    paddingVertical: 10,
  },
  catFilterScroll: {
    marginBottom: Spacing.md,
  },
  catFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginRight: 6,
  },
  catFilterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catFilterChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  catFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  creditSalaryBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radii.lg,
    marginTop: Spacing.md,
    gap: 6,
  },
  creditSalaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  stealthToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stealthToggleBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  subscriptionsCard: {
    padding: Spacing.md,
    borderRadius: Radii.xl,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.25)',
  },
  subsTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subsCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  subsStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  subsStatCol: {
    flex: 1,
    alignItems: 'center',
  },
  subsStatDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  subsStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subsStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 2,
  },
  subsTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subsPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
  },
  subsPillText: {
    fontSize: 11,
    color: '#E2E8F0',
  },
  subsPillAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A78BFA',
  },
});
