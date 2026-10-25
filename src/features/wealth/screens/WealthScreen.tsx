import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
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

type NavTab = 'Overview' | 'Accounts' | 'Budgets' | 'Bills & Debt' | 'Gold & Trips';
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
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<LoanItem | null>(null);

  // Store Bindings
  const accounts = useWealthStore((s) => s.accounts);
  const transactions = useWealthStore((s) => s.transactions);
  const categories = useWealthStore((s) => s.categories);
  const budgets = useWealthStore((s) => s.budgets);
  const bills = useWealthStore((s) => s.bills);
  const savingsGoals = useWealthStore((s) => s.savingsGoals);
  const loans = useWealthStore((s) => s.loans);
  const goldItems = useWealthStore((s) => s.goldItems);
  const trips = useWealthStore((s) => s.trips);
  const currentGoldRate = useWealthStore((s) => s.currentGoldRatePerGram);

  const deleteTransaction = useWealthStore((s) => s.deleteTransaction);
  const payBill = useWealthStore((s) => s.payBill);
  const payMonthlyVatti = useWealthStore((s) => s.payMonthlyVatti);
  const deleteLoan = useWealthStore((s) => s.deleteLoan);
  const deleteGoldItem = useWealthStore((s) => s.deleteGoldItem);
  const depositToGoal = useWealthStore((s) => s.depositToGoal);

  // -------------------------------------------------------------
  // Filtered Transactions Calculation
  // -------------------------------------------------------------
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);

    return transactions.filter((t) => {
      if (timeFilter === 'All') return true;
      if (timeFilter === 'Today') return t.date === todayStr;
      if (timeFilter === 'Week') {
        const txDate = new Date(t.date);
        const diffDays = (now.getTime() - txDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (timeFilter === 'Month') {
        return t.date.slice(0, 7) === todayStr.slice(0, 7);
      }
      return true;
    });
  }, [transactions, timeFilter]);

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
  const budgetUsedPercent = Math.min(100, Math.round((totalExpense / overallBudget) * 100));

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

  // -------------------------------------------------------------
  // Action Handlers
  // -------------------------------------------------------------
  const openAddTx = (type: TransactionType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setTxModalDefaultType(type);
    setAddTxModalVisible(true);
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
          <View>
            <Text style={styles.screenTitle}>Executive Finance OS</Text>
            <Text style={styles.screenSubtitle}>Accounts, Budgets, Cashflow & Debt Tracker</Text>
          </View>
          <TouchableOpacity
            style={styles.aiButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAiInsightsModalVisible(true);
            }}
          >
            <Ionicons name="sparkles" size={14} color="#F59E0B" />
            <Text style={styles.aiButtonText}>AI Insights</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* EXECUTIVE FINANCIAL SUMMARY HERO CARDS */}
        {/* ========================================================= */}
        <GlassCard style={styles.heroCard} variant="elevated">
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>Total Estimated Net Worth</Text>
              <Text style={styles.heroNetWorth}>{formatINR(netWorth)}</Text>
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
                {formatINR(liquidCashBalance)}
              </Text>
            </View>

            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>Total Inflow</Text>
              <Text style={[styles.metricValue, { color: '#4ADE80' }]}>
                +{formatINR(totalIncome)}
              </Text>
            </View>

            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>Total Outflow</Text>
              <Text style={[styles.metricValue, { color: '#F87171' }]}>
                -{formatINR(totalExpense)}
              </Text>
            </View>

            <View style={styles.heroMetricItem}>
              <Text style={styles.metricLabel}>Net Saved</Text>
              <Text style={[styles.metricValue, { color: netSavings >= 0 ? '#4ADE80' : '#F87171' }]}>
                {formatINR(netSavings)}
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
            <Ionicons name="arrow-up" size={16} color="#EF4444" />
            <Text style={[styles.quickActionText, { color: '#EF4444' }]}>+ Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981' }]}
            onPress={() => openAddTx('income')}
          >
            <Ionicons name="arrow-down" size={16} color="#10B981" />
            <Text style={[styles.quickActionText, { color: '#10B981' }]}>+ Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: 'rgba(59, 130, 246, 0.15)', borderColor: '#3B82F6' }]}
            onPress={() => openAddTx('transfer')}
          >
            <Ionicons name="swap-horizontal" size={16} color="#3B82F6" />
            <Text style={[styles.quickActionText, { color: '#3B82F6' }]}>⇄ Transfer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.quickActionBtn, { backgroundColor: 'rgba(168, 85, 247, 0.15)', borderColor: '#A855F7' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setAddAccountModalVisible(true);
            }}
          >
            <Ionicons name="card" size={16} color="#A855F7" />
            <Text style={[styles.quickActionText, { color: '#A855F7' }]}>+ Account</Text>
          </TouchableOpacity>
        </View>

        {/* ========================================================= */}
        {/* NAVIGATION SEGMENTED TABS */}
        {/* ========================================================= */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {(['Overview', 'Accounts', 'Budgets', 'Bills & Debt', 'Gold & Trips'] as NavTab[]).map(
            (tab) => {
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

            {/* Transactions Header with Time Filter */}
            <View style={styles.txHeaderRow}>
              <Text style={styles.sectionTitle}>Recent Transactions</Text>
              <View style={styles.timeFilterRow}>
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
              </View>
            </View>

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
                      {formatINR(tx.amount)}
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
              <Text style={styles.sectionTitle}>Linked Accounts & Cards</Text>
              <TouchableOpacity
                style={styles.smallAddBtn}
                onPress={() => setAddAccountModalVisible(true)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.smallAddBtnText}>Add</Text>
              </TouchableOpacity>
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
                        {formatINR(acc.balance)}
                      </Text>
                    </View>

                    {isCredit && (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.accountBalLabel}>Available Credit</Text>
                        <Text style={[styles.accountBalValue, { color: '#4ADE80' }]}>
                          {formatINR(availableLimit)}
                        </Text>
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
            {/* Budgets Section */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Monthly Budgets</Text>
              <TouchableOpacity
                style={styles.smallAddBtn}
                onPress={() => setAddBudgetGoalModalVisible(true)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.smallAddBtnText}>+ Limit</Text>
              </TouchableOpacity>
            </View>

            {budgets.map((b) => {
              const spent = b.categoryId ? categorySpendMap[b.categoryId] || 0 : totalExpense;
              const percent = Math.min(100, Math.round((spent / b.amount) * 100));
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
                      Spent: <Text style={{ color: '#FFFFFF' }}>{formatINR(spent)}</Text> of{' '}
                      {formatINR(b.amount)}
                    </Text>
                    <Text style={[styles.budgetCardMetaText, { color: isOver ? '#EF4444' : '#4ADE80' }]}>
                      {isOver ? `Over by ${formatINR(spent - b.amount)}` : `${formatINR(remaining)} left`}
                    </Text>
                  </View>
                </GlassCard>
              );
            })}

            {/* Savings Goals Section */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <Text style={styles.sectionTitle}>Savings Goals</Text>
              <TouchableOpacity
                style={styles.smallAddBtn}
                onPress={() => setAddBudgetGoalModalVisible(true)}
              >
                <Ionicons name="flag" size={14} color="#FFFFFF" />
                <Text style={styles.smallAddBtnText}>+ Goal</Text>
              </TouchableOpacity>
            </View>

            {savingsGoals.map((goal) => {
              const percent = Math.min(
                100,
                Math.round((goal.currentAmount / goal.targetAmount) * 100)
              );

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
                      Saved: <Text style={{ color: '#FFFFFF' }}>{formatINR(goal.currentAmount)}</Text>
                    </Text>
                    <Text style={styles.goalTargetText}>Target: {formatINR(goal.targetAmount)} ({percent}%)</Text>
                  </View>
                </GlassCard>
              );
            })}
          </View>
        )}

        {/* ========================================================= */}
        {/* TAB 4: BILLS & DEBT (VATTI / LOANS) */}
        {/* ========================================================= */}
        {activeTab === 'Bills & Debt' && (
          <View style={styles.tabContent}>
            {/* Upcoming Bills */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Bills & Subscriptions</Text>
            </View>

            {bills.map((bill) => (
              <View key={bill.id} style={styles.billCard}>
                <View style={styles.billInfo}>
                  <Text style={styles.billTitle}>{bill.title}</Text>
                  <Text style={styles.billDue}>Due: {bill.dueDate} • {bill.recurring}</Text>
                </View>
                <View style={styles.billActionRow}>
                  <Text style={styles.billAmount}>{formatINR(bill.amount)}</Text>
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
            ))}

            {/* Loan & Vatti (Interest) Engine */}
            <View style={[styles.sectionHeaderRow, { marginTop: Spacing.xl }]}>
              <View>
                <Text style={styles.sectionTitle}>Loan & Vatti (Interest) Engine</Text>
                <Text style={styles.sectionSubtitle}>
                  Monthly Due: {formatINR(totalMonthlyVattiDue)} • Total Debt: {formatINR(totalOutstandingLoanPrincipal)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.smallAddBtn}
                onPress={() => setAddLoanModalVisible(true)}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.smallAddBtnText}>+ Loan</Text>
              </TouchableOpacity>
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
                      <Text style={styles.loanMetricVal}>{formatINR(loan.principalAmount)}</Text>
                    </View>
                    <View>
                      <Text style={styles.loanMetricLabel}>Monthly Vatti</Text>
                      <Text style={[styles.loanMetricVal, { color: '#F87171' }]}>
                        {formatINR(loan.monthlyInterestAmount)}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.loanMetricLabel}>Interest Paid</Text>
                      <Text style={styles.loanMetricVal}>{formatINR(loan.lifetimeInterestPaid)}</Text>
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
        {/* TAB 5: GOLD & FAMILY TRIPS */}
        {/* ========================================================= */}
        {activeTab === 'Gold & Trips' && (
          <View style={styles.tabContent}>
            {/* Gold Portfolio */}
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionTitle}>Gold Net Worth Tracker</Text>
                <Text style={styles.sectionSubtitle}>
                  {totalGoldSovereigns} Sovereigns • Market Valuation: {formatINR(totalGoldNetWorth)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.smallAddBtn}
                onPress={() => setAddGoldModalVisible(true)}
              >
                <Ionicons name="sparkles" size={14} color={Colors.gold} />
                <Text style={styles.smallAddBtnText}>+ Gold</Text>
              </TouchableOpacity>
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
                    {formatINR(Math.round(g.weightGrams * currentGoldRate))}
                  </Text>
                </View>
              ))
            )}

            {/* Trips & Group Expense Splitwise */}
            <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
              <Text style={styles.sectionTitle}>Trip & Group Splitwise Engine</Text>
            </View>

            {trips.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="airplane-outline" size={36} color={Colors.primary} />
                <Text style={styles.emptyTitle}>No Active Trips</Text>
                <Text style={styles.emptySubtitle}>Split expenses seamlessly between friends and family.</Text>
              </View>
            ) : (
              trips.map((t) => (
                <GlassCard key={t.id} style={styles.tripCard}>
                  <Text style={styles.tripTitle}>{t.name}</Text>
                  <Text style={styles.tripMembers}>Members: {t.members.join(', ')}</Text>
                  <Text style={styles.tripBudget}>Budget: {formatINR(t.budget)}</Text>
                </GlassCard>
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
        onClose={() => setAddTxModalVisible(false)}
        defaultType={txModalDefaultType}
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
      <PartRepayModal
        visible={Boolean(selectedLoanForRepay)}
        loan={selectedLoanForRepay}
        onClose={() => setSelectedLoanForRepay(null)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 90,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    gap: 6,
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
    paddingVertical: 10,
    borderRadius: Radii.lg,
    borderWidth: 1,
    gap: 4,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Nav Tabs
  tabScroll: {
    marginBottom: Spacing.lg,
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
  txHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
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
});
