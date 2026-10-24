import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import { useWealthStore, LoanItem } from '../state/wealth-store';
import { AddLoanModal } from '../components/AddLoanModal';
import { AddGoldModal } from '../components/AddGoldModal';
import { PartRepayModal } from '../components/PartRepayModal';

export const WealthScreen: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'All' | 'Loans' | 'Gold' | 'Trips' | 'Groceries'>('All');
  const [addLoanModalVisible, setAddLoanModalVisible] = useState(false);
  const [addGoldModalVisible, setAddGoldModalVisible] = useState(false);
  const [selectedLoanForRepay, setSelectedLoanForRepay] = useState<LoanItem | null>(null);

  // Store bindings
  const monthlySalary = useWealthStore((s) => s.monthlySalary);
  const currentGoldRate = useWealthStore((s) => s.currentGoldRatePerGram);
  const loans = useWealthStore((s) => s.loans);
  const goldItems = useWealthStore((s) => s.goldItems);
  const trips = useWealthStore((s) => s.trips);
  const groceries = useWealthStore((s) => s.groceries);
  const payMonthlyVatti = useWealthStore((s) => s.payMonthlyVatti);
  const deleteLoan = useWealthStore((s) => s.deleteLoan);
  const deleteGoldItem = useWealthStore((s) => s.deleteGoldItem);
  const toggleGroceryItem = useWealthStore((s) => s.toggleGroceryItem);

  // Computed Totals
  const totalGoldGrams = goldItems.reduce((acc, g) => acc + g.weightGrams, 0);
  const totalGoldSovereigns = Number((totalGoldGrams / 8).toFixed(2));
  const totalGoldNetWorth = Math.round(totalGoldGrams * currentGoldRate);

  const totalMonthlyVattiDue = loans
    .filter((l) => l.status === 'active')
    .reduce((acc, l) => acc + l.monthlyInterestAmount, 0);

  const totalOutstandingLoanPrincipal = loans
    .filter((l) => l.status === 'active')
    .reduce((acc, l) => acc + l.principalAmount, 0);

  const groceryPendingCost = groceries
    .filter((g) => !g.isPurchased)
    .reduce((acc, g) => acc + g.approxPrice, 0);

  const handlePayVatti = (loan: LoanItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    Alert.alert(
      'Confirm Vatti Payment',
      `Pay ${formatINR(loan.monthlyInterestAmount)} interest to ${loan.lenderName} for this month?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm & Log Payment',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            payMonthlyVatti(loan.id);
            Alert.alert(
              'Payment Recorded! 🧾',
              `Interest of ${formatINR(loan.monthlyInterestAmount)} logged for ${loan.lenderName}.\n\nReceipt Statement:\n"Paid interest of ${formatINR(loan.monthlyInterestAmount)} for October. Remaining Principal: ${formatINR(loan.principalAmount)}."`
            );
          },
        },
      ]
    );
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.screenTitle}>Smart Wealth & Debt OS</Text>
            <Text style={styles.screenSubtitle}>Assets, Vatti Engine & Family Expenses</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.actionAddBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAddGoldModalVisible(true);
              }}
            >
              <Ionicons name="sparkles" size={14} color={Colors.gold} />
              <Text style={styles.actionBtnTextGold}>+ Gold</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionAddBtnPrimary}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setAddLoanModalVisible(true);
              }}
            >
              <Ionicons name="add" size={16} color={Colors.textInverse} />
              <Text style={styles.actionBtnTextPrimary}>+ Loan</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Monthly Cash Flow Card */}
        <GlassCard variant="highlight" style={styles.cashFlowCard}>
          <View style={styles.cashFlowTop}>
            <Text style={styles.cardHeaderSmall}>October Cash Flow & Net Savings</Text>
            <Badge label="In-Hand Income" variant="primary" />
          </View>
          <View style={styles.cashFlowRow}>
            <View>
              <Text style={styles.cfLabel}>Salary Inflow</Text>
              <Text style={[styles.cfValue, { color: Colors.primary }]}>{formatINR(monthlySalary)}</Text>
            </View>
            <View style={styles.cfDivider} />
            <View>
              <Text style={styles.cfLabel}>Monthly Vatti Due</Text>
              <Text style={[styles.cfValue, { color: Colors.danger }]}>{formatINR(totalMonthlyVattiDue)}</Text>
            </View>
            <View style={styles.cfDivider} />
            <View>
              <Text style={styles.cfLabel}>Net Saved</Text>
              <Text style={[styles.cfValue, { color: Colors.cyan }]}>
                {formatINR(monthlySalary - totalMonthlyVattiDue - 35000)}
              </Text>
            </View>
          </View>
          <View style={styles.savingsRateBar}>
            <Text style={styles.savingsRateText}>
              Savings Rate: ~{Math.round(((monthlySalary - totalMonthlyVattiDue - 35000) / monthlySalary) * 100)}% of October Income 🎉
            </Text>
          </View>
        </GlassCard>

        {/* Section Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          {(['All', 'Loans', 'Gold', 'Trips', 'Groceries'] as const).map((sec) => (
            <TouchableOpacity
              key={sec}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveSection(sec);
              }}
              style={[styles.tabChip, activeSection === sec && styles.tabChipActive]}
            >
              <Text style={[styles.tabChipText, activeSection === sec && styles.tabChipTextActive]}>
                {sec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* 1. Kadan & Vatti (Interest) Engine */}
        {(activeSection === 'All' || activeSection === 'Loans') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Loan & Vatti (Interest) Engine</Text>
                <Text style={styles.sectionSub}>Total Debt: {formatINR(totalOutstandingLoanPrincipal)}</Text>
              </View>
              <Badge label={`Due Total: ${formatINR(totalMonthlyVattiDue)}`} variant="danger" />
            </View>

            {loans.length === 0 ? (
              <GlassCard style={{ padding: Spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="shield-checkmark-outline" size={32} color={Colors.primary} />
                <Text style={{ color: Colors.textPrimary, fontSize: 15, fontWeight: '700', marginTop: 8 }}>
                  No Active Loans
                </Text>
                <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 4 }}>
                  You are debt-free! Tap "+ Loan" above to record borrower/lender terms.
                </Text>
              </GlassCard>
            ) : (
              loans.map((loan) => (
                <GlassCard key={loan.id} style={styles.loanCard}>
                  <View style={styles.loanTopRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lenderName}>{loan.lenderName}</Text>
                      <Text style={styles.loanPrincipalSubtitle}>
                        Principal: {formatINR(loan.principalAmount)} • {loan.monthlyRatePercent}% Monthly Vatti
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Badge label={loan.status === 'active' ? 'Active' : 'Settled'} variant="gold" />
                      <TouchableOpacity
                        style={{ padding: 4 }}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          Alert.alert(
                            'Delete Loan Record',
                            `Are you sure you want to delete the loan record for "${loan.lenderName}"?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () => {
                                  deleteLoan(loan.id);
                                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                                },
                              },
                            ]
                          );
                        }}
                      >
                        <Ionicons name="trash-outline" size={16} color={Colors.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.interestHighlightBox}>
                    <View>
                      <Text style={styles.interestLabel}>Monthly Interest Due</Text>
                      <Text style={styles.interestValue}>{formatINR(loan.monthlyInterestAmount)} / month</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.dueDayText}>Due on {loan.dueDayOfMonth}th of month</Text>
                      <Text style={styles.lifetimeText}>Lifetime Paid: {formatINR(loan.lifetimeInterestPaid)}</Text>
                    </View>
                  </View>

                  <View style={styles.loanActionsRow}>
                    <TouchableOpacity style={styles.payVattiBtn} onPress={() => handlePayVatti(loan)}>
                      <Ionicons name="card-outline" size={15} color={Colors.textInverse} />
                      <Text style={styles.payVattiText}>Pay Vatti {formatINR(loan.monthlyInterestAmount)}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.repayPrincipalBtn}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedLoanForRepay(loan);
                      }}
                    >
                      <Ionicons name="trending-down-outline" size={15} color={Colors.textPrimary} />
                      <Text style={styles.repayPrincipalText}>Part-Repay</Text>
                    </TouchableOpacity>
                  </View>
                </GlassCard>
              ))
            )}
          </View>
        )}

        {/* 2. Gold & Physical Asset Inventory */}
        {(activeSection === 'All' || activeSection === 'Gold') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Gold & Physical Asset Holdings</Text>
                <Text style={styles.sectionSub}>Live Market Price: ₹{currentGoldRate.toLocaleString('en-IN')}/g</Text>
              </View>
              <Badge label="Asset Vault" variant="gold" />
            </View>

            <GlassCard variant="elevated" style={styles.goldCard}>
              <View style={styles.goldTopRow}>
                <View style={styles.goldIconCircle}>
                  <Ionicons name="sparkles" size={20} color={Colors.gold} />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.md }}>
                  <Text style={styles.goldGramsText}>
                    {totalGoldGrams} Grams ({totalGoldSovereigns} Savaran / Sovereigns)
                  </Text>
                  <Text style={styles.goldRateSub}>Net Portfolio Worth</Text>
                </View>
                <Text style={styles.goldWorthText}>{formatINR(totalGoldNetWorth)}</Text>
              </View>

              <View style={styles.goldItemsRow}>
                {goldItems.length === 0 ? (
                  <Text style={{ color: Colors.textMuted, fontSize: 12, paddingVertical: 8 }}>
                    No gold items added yet. Tap "+ Gold" to track assets.
                  </Text>
                ) : (
                  goldItems.map((g) => (
                    <TouchableOpacity
                      key={g.id}
                      style={styles.goldItemPill}
                      onLongPress={() => {
                        Alert.alert('Remove Asset', `Delete "${g.name}" from your portfolio?`, [
                          { text: 'Cancel', style: 'cancel' },
                          {
                            text: 'Delete',
                            style: 'destructive',
                            onPress: () => {
                              deleteGoldItem(g.id);
                              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                            },
                          },
                        ]);
                      }}
                    >
                      <Text style={styles.goldItemPillText}>
                        {g.name} ({g.weightGrams}g • {g.sovereigns} Savaran • {g.location})
                      </Text>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </GlassCard>
          </View>
        )}

        {/* 3. Trip & Vacation Budget */}
        {(activeSection === 'All' || activeSection === 'Trips') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trip Expenses (Pocket Splitwise)</Text>
              <Badge label="Ongoing Trip" variant="cyan" />
            </View>

            {trips.length === 0 ? (
              <GlassCard style={{ padding: Spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="airplane-outline" size={28} color={Colors.cyan} />
                <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 6 }}>
                  No Active Trips
                </Text>
                <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 3 }}>
                  Track shared vacation expenses and budget splits without mess.
                </Text>
              </GlassCard>
            ) : (
              trips.map((trip) => {
                const totalSpent = trip.expenses.reduce((acc, e) => acc + e.amount, 0);
                const remaining = Math.max(0, trip.budget - totalSpent);
                const percent = Math.min(100, Math.round((totalSpent / trip.budget) * 100));

                return (
                  <GlassCard key={trip.id} style={styles.tripCard}>
                    <View style={styles.tripHeader}>
                      <Text style={styles.tripTitle}>🚗 {trip.name}</Text>
                      <Text style={styles.tripRemaining}>Remaining: {formatINR(remaining)}</Text>
                    </View>
                    <View style={styles.tripBarBg}>
                      <View style={[styles.tripBarFill, { width: `${percent}%` }]} />
                    </View>
                    <Text style={styles.tripSpendText}>
                      Spent {formatINR(totalSpent)} of {formatINR(trip.budget)} Budget ({trip.members.join(', ')})
                    </Text>
                  </GlassCard>
                );
              })
            )}
          </View>
        )}

        {/* 4. Household Grocery Checklist */}
        {(activeSection === 'All' || activeSection === 'Groceries') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Monthly Grocery Checklist</Text>
                <Text style={styles.sectionSub}>Pending to Buy: {formatINR(groceryPendingCost)}</Text>
              </View>
              <Text style={styles.groceryCountText}>
                {groceries.filter((g) => g.isPurchased).length}/{groceries.length} Done
              </Text>
            </View>

            {groceries.length === 0 ? (
              <GlassCard style={{ padding: Spacing.lg, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="cart-outline" size={28} color={Colors.gold} />
                <Text style={{ color: Colors.textPrimary, fontSize: 14, fontWeight: '700', marginTop: 6 }}>
                  Grocery Checklist Empty
                </Text>
                <Text style={{ color: Colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 3 }}>
                  Add your essential household provisions to track monthly spend.
                </Text>
              </GlassCard>
            ) : (
              <GlassCard style={styles.groceryCard}>
                {groceries.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.groceryRow}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                      toggleGroceryItem(item.id);
                    }}
                  >
                    <Ionicons
                      name={item.isPurchased ? 'checkmark-circle' : 'ellipse-outline'}
                      size={20}
                      color={item.isPurchased ? Colors.primary : Colors.textMuted}
                    />
                    <Text style={[styles.groceryName, item.isPurchased && styles.groceryDone]}>
                      {item.name}
                    </Text>
                    <Text style={styles.groceryPrice}>{formatINR(item.approxPrice)}</Text>
                  </TouchableOpacity>
                ))}
              </GlassCard>
            )}
          </View>
        )}
      </ScrollView>

      {/* Modals */}
      <AddLoanModal
        visible={addLoanModalVisible}
        onClose={() => setAddLoanModalVisible(false)}
      />

      <AddGoldModal
        visible={addGoldModalVisible}
        onClose={() => setAddGoldModalVisible(false)}
      />

      <PartRepayModal
        visible={selectedLoanForRepay !== null}
        loan={selectedLoanForRepay}
        onClose={() => setSelectedLoanForRepay(null)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.goldGlow,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    gap: 4,
  },
  actionBtnTextGold: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.gold,
  },
  actionAddBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    gap: 4,
  },
  actionBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textInverse,
  },
  cashFlowCard: {
    marginBottom: Spacing.lg,
  },
  cashFlowTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardHeaderSmall: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  cashFlowRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  cfLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cfValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  cfDivider: {
    width: 1,
    height: 28,
    backgroundColor: Colors.border,
  },
  savingsRateBar: {
    backgroundColor: Colors.primaryGlow,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.sm,
    marginTop: Spacing.md,
  },
  savingsRateText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textAlign: 'center',
  },
  tabsScroll: {
    marginBottom: Spacing.lg,
  },
  tabChip: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  tabChipActive: {
    backgroundColor: Colors.cardSubtle,
    borderColor: Colors.borderLight,
  },
  tabChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabChipTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  sectionBlock: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  sectionSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  loanCard: {
    backgroundColor: Colors.card,
    marginBottom: Spacing.md,
  },
  loanTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  lenderName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  loanPrincipalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  interestHighlightBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
  },
  interestLabel: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '600',
  },
  interestValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.danger,
    marginTop: 2,
    fontVariant: ['tabular-nums'],
  },
  dueDayText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  lifetimeText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  loanActionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  payVattiBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.danger,
    paddingVertical: 9,
    borderRadius: Radii.sm,
    gap: 6,
  },
  payVattiText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  repayPrincipalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 9,
    borderRadius: Radii.sm,
    gap: 6,
  },
  repayPrincipalText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  goldCard: {
    backgroundColor: 'rgba(245, 158, 11, 0.06)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  goldTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  goldIconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.goldGlow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldGramsText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  goldRateSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  goldWorthText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
  },
  goldItemsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  goldItemPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  goldItemPillText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  tripCard: {
    marginBottom: Spacing.sm,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  tripTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tripRemaining: {
    fontSize: 12,
    color: Colors.cyan,
    fontWeight: '600',
  },
  tripBarBg: {
    height: 8,
    backgroundColor: Colors.cardSubtle,
    borderRadius: Radii.full,
    overflow: 'hidden',
    marginVertical: 6,
  },
  tripBarFill: {
    height: '100%',
    backgroundColor: Colors.cyan,
    borderRadius: Radii.full,
  },
  tripSpendText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  groceryCard: {
    paddingVertical: Spacing.sm,
  },
  groceryCountText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  groceryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  groceryName: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  groceryDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  groceryPrice: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
});
