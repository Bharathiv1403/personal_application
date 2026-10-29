import React, { useState, useMemo } from 'react';
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
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import { useWealthStore, Trip, TripExpenseCategory } from '../state/wealth-store';

interface Props {
  visible: boolean;
  trip: Trip | null;
  onClose: () => void;
}

const CATEGORY_MAP: { id: TripExpenseCategory; name: string; icon: string; color: string }[] = [
  { id: 'fuel', name: 'Fuel / Petrol / Diesel', icon: 'speedometer', color: '#EF4444' },
  { id: 'driver', name: 'Car Rent / Driver Batta', icon: 'car', color: '#F59E0B' },
  { id: 'toll_parking', name: 'Toll & Parking', icon: 'barcode', color: '#3B82F6' },
  { id: 'repair', name: 'Bike / Vehicle Repair', icon: 'construct', color: '#EC4899' },
  { id: 'stay', name: 'Rooms / Hotel Stay', icon: 'bed', color: '#8B5CF6' },
  { id: 'food', name: 'Food, Dining & Tea', icon: 'restaurant', color: '#10B981' },
  { id: 'activity', name: 'Sightseeing / Tickets', icon: 'ticket', color: '#06B6D4' },
  { id: 'misc', name: 'Shopping & Misc', icon: 'grid', color: '#64748B' },
];

export const TripManageModal: React.FC<Props> = ({ visible, trip, onClose }) => {
  const [activeTab, setActiveTab] = useState<'log' | 'expenses' | 'settle'>('log');

  // Expense form
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [category, setCategory] = useState<TripExpenseCategory>('fuel');
  const [paidBy, setPaidBy] = useState('Common Pool');
  const [splitAmong, setSplitAmong] = useState<string[]>([]);

  // Member contribution form
  const [showContribForm, setShowContribForm] = useState(false);
  const [contribMember, setContribMember] = useState('');
  const [contribAmount, setContribAmount] = useState('');

  // Add mid-trip friend form
  const [showAddMemberInput, setShowAddMemberInput] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');

  const addTripExpense = useWealthStore((s) => s.addTripExpense);
  const deleteTripExpense = useWealthStore((s) => s.deleteTripExpense);
  const addTripContribution = useWealthStore((s) => s.addTripContribution);
  const addTripMember = useWealthStore((s) => s.addTripMember);
  const toggleTripStatus = useWealthStore((s) => s.toggleTripStatus);

  const isSolo = trip?.tripType === 'solo';

  React.useEffect(() => {
    if (visible && trip) {
      setExpenseTitle('');
      setExpenseAmount('');
      setCategory('fuel');
      setPaidBy(trip.tripType === 'solo' ? 'Self / Cash' : 'Common Pool');
      setSplitAmong(trip.members || []);
      setShowContribForm(false);
      setShowAddMemberInput(false);
      setNewMemberName('');
      setActiveTab('log');
      if (trip.members.length > 0) {
        setContribMember(trip.members[0]);
      }
    }
  }, [visible, trip]);

  // Keep splitAmong updated if members change
  React.useEffect(() => {
    if (trip?.members && splitAmong.length === 0) {
      setSplitAmong(trip.members);
    }
  }, [trip?.members]);

  // Calculations
  const totalCollected = useMemo(() => {
    if (!trip || !trip.contributions) return 0;
    return trip.contributions.reduce((sum, c) => sum + c.amount, 0);
  }, [trip]);

  const totalSpent = useMemo(() => {
    if (!trip || !trip.expenses) return 0;
    return trip.expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [trip]);

  const poolBalance = Math.max(0, totalCollected - totalSpent);
  const remainingBudget = Math.max(0, (trip?.budget || 0) - totalSpent);

  // Accurate Splitwise Math
  const memberSplits = useMemo(() => {
    if (!trip || isSolo || !trip.members) return [];
    return trip.members.map((m) => {
      const poolContrib = (trip.contributions || [])
        .filter((c) => c.memberName === m)
        .reduce((sum, c) => sum + c.amount, 0);

      const outOfPocket = (trip.expenses || [])
        .filter((e) => e.paidBy === m)
        .reduce((sum, e) => sum + e.amount, 0);

      const totalPaidByMember = poolContrib + outOfPocket;

      const totalOwedByMember = (trip.expenses || []).reduce((sum, e) => {
        const splitList = e.splitAmong && e.splitAmong.length > 0 ? e.splitAmong : trip.members;
        if (splitList.includes(m)) {
          return sum + e.amount / splitList.length;
        }
        return sum;
      }, 0);

      const netDiff = Math.round(totalPaidByMember - totalOwedByMember);

      return {
        member: m,
        totalPaid: totalPaidByMember,
        fairShare: Math.round(totalOwedByMember),
        netDiff,
      };
    });
  }, [trip, isSolo]);

  // Category Breakdown for the trip
  const categoryBreakdown = useMemo(() => {
    if (!trip?.expenses || trip.expenses.length === 0) return [];
    const map: Record<string, number> = {};
    trip.expenses.forEach((e) => {
      map[e.category] = (map[e.category] || 0) + e.amount;
    });
    return Object.entries(map)
      .map(([catId, amount]) => {
        const catInfo = CATEGORY_MAP.find((c) => c.id === catId) || CATEGORY_MAP[7];
        const pct = totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
        return {
          ...catInfo,
          amount,
          pct,
        };
      })
      .sort((a, b) => b.amount - a.amount);
  }, [trip?.expenses, totalSpent]);

  if (!trip) return null;

  const handleAddExpense = () => {
    const numAmount = parseFloat(expenseAmount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid expense amount.');
      return;
    }

    if (!expenseTitle.trim()) {
      Alert.alert('Required Title', 'Please enter note (e.g. Highway Diesel, Toll Gate, Lunch).');
      return;
    }

    if (!isSolo && splitAmong.length === 0) {
      Alert.alert('Select Members', 'At least one member must be selected for this expense.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addTripExpense(trip.id, {
      title: expenseTitle.trim(),
      amount: numAmount,
      category,
      paidBy: isSolo ? (paidBy || 'Self') : paidBy,
      splitAmong: isSolo ? undefined : splitAmong,
      date: new Date().toISOString().slice(0, 10),
    });

    setExpenseTitle('');
    setExpenseAmount('');
    Alert.alert('Expense Logged', `${formatINR(numAmount)} added to ${trip.name}.`);
  };

  const toggleMemberInSplit = (memberName: string) => {
    if (splitAmong.includes(memberName)) {
      if (splitAmong.length <= 1) {
        Alert.alert('Minimum One Member', 'At least one member must share this expense.');
        return;
      }
      setSplitAmong(splitAmong.filter((m) => m !== memberName));
    } else {
      setSplitAmong([...splitAmong, memberName]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleAddContribution = () => {
    const numAmount = parseFloat(contribAmount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid contribution amount.');
      return;
    }

    if (!contribMember) {
      Alert.alert('Select Member', 'Please select a member.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addTripContribution(trip.id, contribMember, numAmount);
    setContribAmount('');
    setShowContribForm(false);
    Alert.alert('Pool Updated', `${contribMember} added ${formatINR(numAmount)} to Common Pool.`);
  };

  const handleAddNewMember = () => {
    const trimmed = newMemberName.trim();
    if (!trimmed) return;
    if (trip.members.includes(trimmed)) {
      Alert.alert('Duplicate Member', `${trimmed} is already in the trip.`);
      return;
    }
    addTripMember(trip.id, trimmed);
    setSplitAmong([...splitAmong, trimmed]);
    setNewMemberName('');
    setShowAddMemberInput(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    Alert.alert('Friend Added', `${trimmed} has been added to ${trip.name}.`);
  };

  const handleDeleteExpense = (expenseId: string, title: string, amount: number) => {
    Alert.alert('Delete Expense', `Delete "${title}" (${formatINR(amount)})?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteTripExpense(trip.id, expenseId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        },
      },
    ]);
  };

  const handleShareOnWhatsApp = async () => {
    if (!trip) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const breakdownLines = memberSplits
      .map((item) => {
        if (item.netDiff > 0) {
          return `• ${item.member}: Paid ${formatINR(item.totalPaid)} 👉 Gets back ${formatINR(item.netDiff)}`;
        } else if (item.netDiff < 0) {
          return `• ${item.member}: Paid ${formatINR(item.totalPaid)} 👉 Owes ${formatINR(Math.abs(item.netDiff))}`;
        }
        return `• ${item.member}: Paid ${formatINR(item.totalPaid)} 👉 Settled ✓`;
      })
      .join('\n');

    const message =
      `🏖️ *${trip.name} - Final Tour Settlement*\n` +
      `📅 Date: ${new Date().toLocaleDateString('en-IN')}\n` +
      `💰 Total Spent: ${formatINR(totalSpent)}\n` +
      `👥 Total Members: ${trip.members.length}\n` +
      `---------------------------------\n` +
      `*Settlement Breakdown:*\n` +
      `${breakdownLines}\n` +
      `---------------------------------\n` +
      `✨ Shared from Personal App`;

    try {
      await Share.share({
        message,
        title: `${trip.name} Settlement Summary`,
      });
    } catch {
      // ignore
    }
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
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={styles.modalTitle}>{trip.name}</Text>
                <View
                  style={[
                    styles.modeBadge,
                    { backgroundColor: isSolo ? 'rgba(56, 189, 248, 0.15)' : 'rgba(168, 85, 247, 0.15)' },
                  ]}
                >
                  <Text style={[styles.modeBadgeText, { color: isSolo ? '#38BDF8' : '#D8B4FE' }]}>
                    {isSolo ? '👤 Solo' : '👥 Group'}
                  </Text>
                </View>

                {/* Status Toggle Button */}
                <TouchableOpacity
                  style={[
                    styles.statusPill,
                    { backgroundColor: trip.status === 'completed' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255,255,255,0.06)' },
                  ]}
                  onPress={() => toggleTripStatus(trip.id)}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: trip.status === 'completed' ? '#4ADE80' : Colors.textMuted },
                    ]}
                  >
                    {trip.status === 'completed' ? 'Completed 🏁' : 'Mark Finish'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>
                {isSolo
                  ? `Personal Solo Trip • Budget: ${formatINR(trip.budget)}`
                  : `${trip.members.length} Members (${trip.members.join(', ')})`}
              </Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Metrics Bar */}
          <View style={styles.metricsBox}>
            {isSolo ? (
              <>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Solo Budget</Text>
                  <Text style={[styles.metricVal, { color: '#E2E8F0' }]}>
                    {formatINR(trip.budget)}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Spent</Text>
                  <Text style={[styles.metricVal, { color: '#F87171' }]}>
                    -{formatINR(totalSpent)}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Remaining</Text>
                  <Text style={[styles.metricVal, { color: '#4ADE80' }]}>
                    {formatINR(remainingBudget)}
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Pool</Text>
                  <Text style={[styles.metricVal, { color: '#38BDF8' }]}>
                    {formatINR(totalCollected)}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Total Spent</Text>
                  <Text style={[styles.metricVal, { color: '#F87171' }]}>
                    -{formatINR(totalSpent)}
                  </Text>
                </View>
                <View style={styles.metricItem}>
                  <Text style={styles.metricLabel}>Pool Cash Left</Text>
                  <Text style={[styles.metricVal, { color: '#4ADE80' }]}>
                    {formatINR(poolBalance)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Tab Switcher */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'log' && styles.tabBtnActive]}
              onPress={() => setActiveTab('log')}
            >
              <Ionicons name="add-circle" size={14} color={activeTab === 'log' ? '#FFFFFF' : Colors.textMuted} />
              <Text style={[styles.tabBtnText, activeTab === 'log' && styles.tabBtnTextActive]}>
                + Log Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'expenses' && styles.tabBtnActive]}
              onPress={() => setActiveTab('expenses')}
            >
              <Ionicons name="receipt" size={14} color={activeTab === 'expenses' ? '#FFFFFF' : Colors.textMuted} />
              <Text style={[styles.tabBtnText, activeTab === 'expenses' && styles.tabBtnTextActive]}>
                Expenses ({trip.expenses?.length || 0})
              </Text>
            </TouchableOpacity>

            {!isSolo && (
              <TouchableOpacity
                style={[styles.tabBtn, activeTab === 'settle' && styles.tabBtnActive]}
                onPress={() => setActiveTab('settle')}
              >
                <Ionicons name="people" size={14} color={activeTab === 'settle' ? '#FFFFFF' : Colors.textMuted} />
                <Text style={[styles.tabBtnText, activeTab === 'settle' && styles.tabBtnTextActive]}>
                  Split Summary
                </Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* TAB 1: LOG EXPENSE */}
            {activeTab === 'log' && (
              <View>
                {/* Add Expense Form */}
                <Text style={styles.fieldLabel}>What was the expense for? *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Highway Diesel, Toll Gate, Swiggy Lunch"
                  placeholderTextColor={Colors.textMuted}
                  value={expenseTitle}
                  onChangeText={setExpenseTitle}
                />

                <Text style={styles.fieldLabel}>Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 2400"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={expenseAmount}
                  onChangeText={setExpenseAmount}
                />

                {/* Category Chips */}
                <Text style={styles.fieldLabel}>Expense Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                  {CATEGORY_MAP.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.catChip,
                        category === cat.id && {
                          backgroundColor: cat.color + '26',
                          borderColor: cat.color,
                        },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setCategory(cat.id);
                      }}
                    >
                      <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                      <Text
                        style={[
                          styles.catChipText,
                          category === cat.id && { color: '#FFFFFF', fontWeight: '700' },
                        ]}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Paid By Selector */}
                <Text style={styles.fieldLabel}>
                  {isSolo ? 'Payment Method / Paid Via' : 'Who Paid for this?'}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  {(isSolo ? ['Self / Cash', 'UPI / GPay', 'Card'] : ['Common Pool', ...trip.members]).map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.memberChip, paidBy === m && styles.memberChipActive]}
                      onPress={() => setPaidBy(m)}
                    >
                      <Ionicons
                        name={
                          isSolo
                            ? m.includes('UPI')
                              ? 'phone-portrait'
                              : m.includes('Card')
                              ? 'card'
                              : 'cash'
                            : m === 'Common Pool'
                            ? 'wallet'
                            : 'person'
                        }
                        size={12}
                        color={paidBy === m ? '#FFFFFF' : Colors.textMuted}
                      />
                      <Text style={[styles.memberChipText, paidBy === m && styles.memberChipTextActive]}>
                        {m}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Custom Split: Exclude / Include Members */}
                {!isSolo && (
                  <>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.fieldLabel}>
                        Split Among ({splitAmong.length}/{trip.members.length} members)
                      </Text>
                      <TouchableOpacity
                        onPress={() =>
                          setSplitAmong(splitAmong.length === trip.members.length ? [trip.members[0]] : trip.members)
                        }
                      >
                        <Text style={styles.toggleAllText}>
                          {splitAmong.length === trip.members.length ? 'Select Single' : 'Select All'}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.splitChipsWrap}>
                      {trip.members.map((m) => {
                        const isIncluded = splitAmong.includes(m);
                        return (
                          <TouchableOpacity
                            key={m}
                            style={[styles.splitMemberChip, isIncluded && styles.splitMemberChipActive]}
                            onPress={() => toggleMemberInSplit(m)}
                          >
                            <Ionicons
                              name={isIncluded ? 'checkbox' : 'square-outline'}
                              size={14}
                              color={isIncluded ? '#38BDF8' : Colors.textMuted}
                            />
                            <Text
                              style={[styles.splitMemberChipText, isIncluded && styles.splitMemberChipTextActive]}
                            >
                              {m}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </>
                )}

                <TouchableOpacity style={styles.primaryBtn} onPress={handleAddExpense}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Log Trip Expense</Text>
                </TouchableOpacity>

                {/* Group Pool Actions (Add Mid-Trip Friend & Pool Top-up) */}
                {!isSolo && (
                  <View style={styles.actionLinksRow}>
                    <TouchableOpacity
                      style={styles.actionLinkBtn}
                      onPress={() => setShowContribForm(!showContribForm)}
                    >
                      <Ionicons name="cash-outline" size={14} color="#38BDF8" />
                      <Text style={styles.actionLinkText}>+ Pool Top-up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionLinkBtn}
                      onPress={() => setShowAddMemberInput(!showAddMemberInput)}
                    >
                      <Ionicons name="person-add-outline" size={14} color="#A855F7" />
                      <Text style={[styles.actionLinkText, { color: '#C084FC' }]}>+ Add Friend Mid-Trip</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Pool top-up form */}
                {showContribForm && (
                  <View style={styles.contribFormBox}>
                    <Text style={styles.fieldLabel}>Member Who Contributed</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                      {trip.members.map((m) => (
                        <TouchableOpacity
                          key={m}
                          style={[styles.memberChip, contribMember === m && styles.memberChipActive]}
                          onPress={() => setContribMember(m)}
                        >
                          <Text style={[styles.memberChipText, contribMember === m && styles.memberChipTextActive]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <Text style={styles.fieldLabel}>Amount Added (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="e.g. 2000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={contribAmount}
                      onChangeText={setContribAmount}
                    />

                    <TouchableOpacity style={styles.saveContribBtn} onPress={handleAddContribution}>
                      <Text style={styles.saveContribBtnText}>Add to Pool</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Mid-Trip Friend Form */}
                {showAddMemberInput && (
                  <View style={styles.contribFormBox}>
                    <Text style={styles.fieldLabel}>New Friend Name</Text>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                        placeholder="e.g. Anand, Vignesh"
                        placeholderTextColor={Colors.textMuted}
                        value={newMemberName}
                        onChangeText={setNewMemberName}
                      />
                      <TouchableOpacity style={styles.addFriendMiniBtn} onPress={handleAddNewMember}>
                        <Text style={styles.addFriendMiniBtnText}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* TAB 2: EXPENSES LIST */}
            {activeTab === 'expenses' && (
              <View>
                {/* Category Spend Breakdown Bar */}
                {categoryBreakdown.length > 0 && (
                  <View style={styles.catBreakdownCard}>
                    <Text style={styles.catBreakdownTitle}>Category Spending Breakdown</Text>
                    {categoryBreakdown.map((cat) => (
                      <View key={cat.id} style={styles.catBreakdownRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Ionicons name={cat.icon as any} size={14} color={cat.color} />
                          <Text style={styles.catBreakdownName}>{cat.name}</Text>
                        </View>
                        <Text style={styles.catBreakdownVal}>
                          {formatINR(cat.amount)}{' '}
                          <Text style={{ color: Colors.textMuted, fontSize: 11 }}>({cat.pct}%)</Text>
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {!trip.expenses || trip.expenses.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Ionicons name="receipt-outline" size={36} color={Colors.textMuted} />
                    <Text style={styles.emptyText}>No Expenses Logged Yet</Text>
                    <Text style={styles.emptySub}>Switch to "+ Log Expense" to add petrol, food, rooms, etc.</Text>
                  </View>
                ) : (
                  trip.expenses.map((e) => {
                    const catInfo = CATEGORY_MAP.find((c) => c.id === e.category) || CATEGORY_MAP[7];
                    const splitCount = e.splitAmong?.length || trip.members.length;
                    return (
                      <View key={e.id} style={styles.expenseRow}>
                        <View style={[styles.expenseIconBox, { backgroundColor: catInfo.color + '26' }]}>
                          <Ionicons name={catInfo.icon as any} size={18} color={catInfo.color} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.expenseTitle}>{e.title}</Text>
                          <Text style={styles.expenseSub}>
                            {catInfo.name} • Paid: <Text style={{ color: '#38BDF8' }}>{e.paidBy}</Text>
                            {!isSolo && (
                              <Text style={{ color: '#94A3B8' }}> • Split ({splitCount} members)</Text>
                            )}
                          </Text>
                        </View>
                        <View style={{ alignItems: 'flex-end', gap: 4 }}>
                          <Text style={styles.expenseAmount}>-{formatINR(e.amount)}</Text>
                          <TouchableOpacity onPress={() => handleDeleteExpense(e.id, e.title, e.amount)}>
                            <Ionicons name="trash-outline" size={14} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            )}

            {/* TAB 3: SPLIT SUMMARY (GROUP ONLY) */}
            {!isSolo && activeTab === 'settle' && (
              <View>
                <View style={styles.splitHeroCard}>
                  <Text style={styles.splitHeroLabel}>Total Trip Expenditure</Text>
                  <Text style={styles.splitHeroAmount}>{formatINR(totalSpent)}</Text>
                  <Text style={styles.splitHeroSub}>
                    Accurately calculated based on individual expense participation
                  </Text>
                </View>

                <Text style={styles.sectionHeading}>Member Settlement Breakdown</Text>
                {memberSplits.map((item) => {
                  const isOwed = item.netDiff > 0;
                  return (
                    <View key={item.member} style={styles.memberSplitCard}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <Ionicons name="person-circle" size={26} color="#38BDF8" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.memberSplitName}>{item.member}</Text>
                          <Text style={styles.memberSplitSub}>
                            Paid: {formatINR(item.totalPaid)} • Fair Share: {formatINR(item.fairShare)}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.diffVal,
                            { color: isOwed ? '#4ADE80' : item.netDiff < 0 ? '#EF4444' : '#FFFFFF' },
                          ]}
                        >
                          {isOwed
                            ? `Gets back ${formatINR(item.netDiff)}`
                            : item.netDiff < 0
                            ? `Owes ${formatINR(Math.abs(item.netDiff))}`
                            : 'Settled ✓'}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                <TouchableOpacity style={styles.shareWhatsAppBtn} onPress={handleShareOnWhatsApp}>
                  <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
                  <Text style={styles.shareWhatsAppBtnText}>Share Settlement on WhatsApp</Text>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.85)',
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
    marginBottom: Spacing.sm,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
  },
  modeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricsBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  metricVal: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: 3,
    marginBottom: Spacing.md,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.md,
    gap: 4,
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
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toggleAllText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  splitChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  splitMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    gap: 6,
  },
  splitMemberChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderColor: '#38BDF8',
  },
  splitMemberChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  splitMemberChipTextActive: {
    color: '#FFFFFF',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 6,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 6,
    gap: 6,
  },
  catChipText: {
    fontSize: 12,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  memberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginRight: 6,
    gap: 5,
  },
  memberChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  memberChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  memberChipTextActive: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: Radii.lg,
    marginTop: 8,
    gap: 6,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  actionLinksRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionLinkBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  actionLinkText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '700',
  },
  contribFormBox: {
    marginTop: 8,
    padding: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  saveContribBtn: {
    backgroundColor: '#38BDF8',
    paddingVertical: 8,
    borderRadius: Radii.md,
    alignItems: 'center',
    marginTop: 6,
  },
  saveContribBtnText: {
    color: '#0B0F19',
    fontWeight: '700',
    fontSize: 12,
  },
  addFriendMiniBtn: {
    backgroundColor: '#A855F7',
    paddingHorizontal: 16,
    borderRadius: Radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addFriendMiniBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  expenseIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
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
  expenseAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F87171',
  },
  splitHeroCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  splitHeroLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  splitHeroAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F87171',
    marginVertical: 4,
  },
  splitHeroSub: {
    fontSize: 12,
    color: '#CBD5E1',
    textAlign: 'center',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  memberSplitCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    marginBottom: 6,
  },
  memberSplitName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  memberSplitSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  diffVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  shareWhatsAppBtn: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.md,
    gap: 8,
  },
  shareWhatsAppBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  catBreakdownCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  catBreakdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  catBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  catBreakdownName: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  catBreakdownVal: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
