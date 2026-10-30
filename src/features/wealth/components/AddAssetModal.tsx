import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useWealthStore } from '../state/wealth-store';

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
  initialTab?: 'silver' | 'fd' | 'chit';
}

export const AddAssetModal: React.FC<AddAssetModalProps> = ({
  visible,
  onClose,
  initialTab = 'silver',
}) => {
  const [activeTab, setActiveTab] = useState<'silver' | 'fd' | 'chit'>(initialTab);

  // Store access
  const silverGrams = useWealthStore((s) => s.silverGrams);
  const silverRate = useWealthStore((s) => s.silverRatePerGram);
  const setSilverGrams = useWealthStore((s) => s.setSilverGrams);
  const setSilverRate = useWealthStore((s) => s.setSilverRate);
  const addFixedDeposit = useWealthStore((s) => s.addFixedDeposit);
  const addChitFund = useWealthStore((s) => s.addChitFund);

  // Silver form
  const [inputSilverGrams, setInputSilverGrams] = useState(silverGrams > 0 ? String(silverGrams) : '');
  const [inputSilverRate, setInputSilverRate] = useState(String(silverRate || 102));

  // FD form
  const [fdBank, setFdBank] = useState('');
  const [fdPrincipal, setFdPrincipal] = useState('');
  const [fdInterestRate, setFdInterestRate] = useState('7.25');
  const [fdTenureMonths, setFdTenureMonths] = useState('12');
  const [fdMaturityDate, setFdMaturityDate] = useState(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() + 1);
    return d.toISOString().slice(0, 10);
  });

  // Chit Fund form
  const [chitName, setChitName] = useState('');
  const [chitTotalAmount, setChitTotalAmount] = useState('100000');
  const [chitMonthly, setChitMonthly] = useState('5000');
  const [chitTotalMonths, setChitTotalMonths] = useState('20');
  const [chitPaidMonths, setChitPaidMonths] = useState('1');
  const [chitDividend, setChitDividend] = useState('0');

  const handleSaveSilver = () => {
    const g = parseFloat(inputSilverGrams) || 0;
    const r = parseFloat(inputSilverRate) || 102;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setSilverGrams(g);
    setSilverRate(r);
    Alert.alert('Silver Assets Saved 🥈', `Holding updated: ${g}g valued at ₹${Math.round(g * r).toLocaleString('en-IN')}`);
    onClose();
  };

  const handleSaveFd = () => {
    if (!fdBank.trim()) {
      Alert.alert('Bank Name Required', 'Please enter the bank or financial institution name.');
      return;
    }
    const principal = parseFloat(fdPrincipal) || 0;
    if (principal <= 0) {
      Alert.alert('Invalid Principal', 'Please enter a valid deposit amount.');
      return;
    }
    const rate = parseFloat(fdInterestRate) || 0;
    const tenure = parseInt(fdTenureMonths, 10) || 12;
    // Simple approx maturity: P + (P * R * T / 1200)
    const maturityAmount = Math.round(principal + (principal * rate * tenure) / 1200);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addFixedDeposit({
      bankName: fdBank.trim(),
      principal,
      interestRatePercent: rate,
      tenureMonths: tenure,
      maturityDate: fdMaturityDate,
      maturityAmount,
    });
    setFdBank('');
    setFdPrincipal('');
    onClose();
  };

  const handleSaveChit = () => {
    if (!chitName.trim()) {
      Alert.alert('Chit Name Required', 'Please enter the chit company or scheme name (e.g. Shriram Chit / Local Chit).');
      return;
    }
    const totalAmount = parseFloat(chitTotalAmount) || 0;
    const monthlyInstallment = parseFloat(chitMonthly) || 0;
    const totalMonths = parseInt(chitTotalMonths, 10) || 20;
    const paidMonths = parseInt(chitPaidMonths, 10) || 0;
    const dividendEarned = parseFloat(chitDividend) || 0;

    if (totalAmount <= 0 || monthlyInstallment <= 0) {
      Alert.alert('Invalid Amounts', 'Please verify total chit value and monthly installment.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addChitFund({
      chitName: chitName.trim(),
      totalAmount,
      monthlyInstallment,
      totalMonths,
      paidMonths,
      dividendEarned,
      status: paidMonths >= totalMonths ? 'completed' : 'ongoing',
    });
    setChitName('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Indian Asset Tracker</Text>
              <Text style={styles.headerSubtitle}>Silver, Fixed Deposits & Chit Funds</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'silver' && styles.tabItemActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('silver');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'silver' && styles.tabTextActive]}>
                🥈 Silver
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'fd' && styles.tabItemActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('fd');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'fd' && styles.tabTextActive]}>
                🏦 Fixed Deposit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'chit' && styles.tabItemActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('chit');
              }}
            >
              <Text style={[styles.tabText, activeTab === 'chit' && styles.tabTextActive]}>
                📋 Chit Fund
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.contentScroll} showsVerticalScrollIndicator={false}>
            {/* Silver Tab */}
            {activeTab === 'silver' && (
              <View style={styles.formSection}>
                <View style={styles.infoBanner}>
                  <Ionicons name="sparkles" size={16} color={Colors.cyan} />
                  <Text style={styles.infoBannerText}>
                    Track your silver coins, bars, and pooja utensils. Valuation updates automatically with live silver rate.
                  </Text>
                </View>

                <Text style={styles.label}>Total Silver Holding (Grams)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={inputSilverGrams}
                  onChangeText={setInputSilverGrams}
                />

                <Text style={styles.label}>Market Rate Per Gram (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 102.50"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={inputSilverRate}
                  onChangeText={setInputSilverRate}
                />

                <View style={styles.calcPreviewCard}>
                  <Text style={styles.calcPreviewLabel}>Estimated Silver Worth</Text>
                  <Text style={styles.calcPreviewValue}>
                    ₹
                    {(
                      (parseFloat(inputSilverGrams) || 0) * (parseFloat(inputSilverRate) || 0)
                    ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </View>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleSaveSilver}>
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Save Silver Holdings</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* FD Tab */}
            {activeTab === 'fd' && (
              <View style={styles.formSection}>
                <Text style={styles.label}>Bank / Institution Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. State Bank of India / HDFC"
                  placeholderTextColor={Colors.textMuted}
                  value={fdBank}
                  onChangeText={setFdBank}
                />

                <Text style={styles.label}>Principal Deposit Amount (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 100000"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={fdPrincipal}
                  onChangeText={setFdPrincipal}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Interest Rate (%)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 7.25"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={fdInterestRate}
                      onChangeText={setFdInterestRate}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>Tenure (Months)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 12"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={fdTenureMonths}
                      onChangeText={setFdTenureMonths}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Maturity Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={Colors.textMuted}
                  value={fdMaturityDate}
                  onChangeText={setFdMaturityDate}
                />

                <View style={styles.calcPreviewCard}>
                  <Text style={styles.calcPreviewLabel}>Estimated Maturity Payout</Text>
                  <Text style={styles.calcPreviewValue}>
                    ₹
                    {(
                      (parseFloat(fdPrincipal) || 0) +
                      ((parseFloat(fdPrincipal) || 0) *
                        (parseFloat(fdInterestRate) || 0) *
                        (parseInt(fdTenureMonths, 10) || 12)) /
                        1200
                    ).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </Text>
                </View>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleSaveFd}>
                  <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Add Fixed Deposit</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Chit Fund Tab */}
            {activeTab === 'chit' && (
              <View style={styles.formSection}>
                <Text style={styles.label}>Chit Name / Company</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Shriram Chits 1 Lakh / Office Group"
                  placeholderTextColor={Colors.textMuted}
                  value={chitName}
                  onChangeText={setChitName}
                />

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Total Chit Value (₹)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 100000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={chitTotalAmount}
                      onChangeText={setChitTotalAmount}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>Monthly Due (₹)</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 5000"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={chitMonthly}
                      onChangeText={setChitMonthly}
                    />
                  </View>
                </View>

                <View style={styles.rowInputs}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Total Months</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 20"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={chitTotalMonths}
                      onChangeText={setChitTotalMonths}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={styles.label}>Months Paid</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. 1"
                      placeholderTextColor={Colors.textMuted}
                      keyboardType="numeric"
                      value={chitPaidMonths}
                      onChangeText={setChitPaidMonths}
                    />
                  </View>
                </View>

                <Text style={styles.label}>Dividend / Auction Savings Earned (₹)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 1200"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={chitDividend}
                  onChangeText={setChitDividend}
                />

                <View style={styles.calcPreviewCard}>
                  <Text style={styles.calcPreviewLabel}>Cumulative Capital Invested</Text>
                  <Text style={styles.calcPreviewValue}>
                    ₹
                    {(
                      (parseFloat(chitMonthly) || 0) * (parseInt(chitPaidMonths, 10) || 0)
                    ).toLocaleString('en-IN')}
                  </Text>
                </View>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={handleSaveChit}>
                  <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryActionBtnText}>Enroll Chit Fund</Text>
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
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#121217',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '88%',
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radii.md,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  tabItemActive: {
    backgroundColor: Colors.cardElevated,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: Colors.textPrimary,
  },
  contentScroll: {
    paddingHorizontal: Spacing.lg,
  },
  formSection: {
    paddingBottom: Spacing.xl,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.cyan,
    lineHeight: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  calcPreviewCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
  },
  calcPreviewLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
  },
  calcPreviewValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    marginTop: 4,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
  },
  primaryActionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#09090B',
  },
});
