import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
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

const POPULAR_AMOUNTS = [1000, 2500, 5000, 10000, 25000];
const POPULAR_YEARS = [3, 5, 10, 15, 20];
const RETURN_PRESETS = [
  { rate: 7, label: '7% (FD / Safe)', color: '#94A3B8' },
  { rate: 12, label: '12% (Nifty 50)', color: '#38BDF8' },
  { rate: 15, label: '15% (Flexi / Smallcap)', color: '#4ADE80' },
  { rate: 18, label: '18% (High Growth)', color: '#F59E0B' },
];

export const SipCalculatorModal: React.FC<Props> = ({ visible, onClose }) => {
  const [monthlyAmount, setMonthlyAmount] = useState('5000');
  const [returnRate, setReturnRate] = useState('12');
  const [years, setYears] = useState('10');

  const addGoal = useWealthStore((s) => s.addGoal);

  const P = parseFloat(monthlyAmount) || 0;
  const r = parseFloat(returnRate) || 0;
  const y = parseFloat(years) || 0;

  // Compound Interest SIP Formula:
  // M = P * [ (1 + i)^n - 1 ] * (1 + i) / i
  const months = y * 12;
  const i = r / (12 * 100);

  let maturity = 0;
  let totalInvested = P * months;

  if (P > 0 && r > 0 && months > 0) {
    maturity = P * ((Math.pow(1 + i, months) - 1) / i) * (1 + i);
  } else if (P > 0 && months > 0) {
    maturity = totalInvested;
  }

  const wealthGain = Math.max(0, maturity - totalInvested);
  const investedRatio = maturity > 0 ? (totalInvested / maturity) * 100 : 50;
  const gainRatio = maturity > 0 ? (wealthGain / maturity) * 100 : 50;
  const multiplier = totalInvested > 0 ? (maturity / totalInvested).toFixed(1) : '1.0';

  const handleCreateSavingsGoal = () => {
    if (maturity <= 0) {
      Alert.alert('Invalid SIP', 'Please enter valid monthly investment and duration.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const targetYear = new Date().getFullYear() + Math.max(1, Math.round(y));
    const targetDateStr = `${targetYear}-12-31`;

    addGoal({
      name: `SIP Goal (₹${monthlyAmount}/mo @ ${returnRate}%)`,
      targetAmount: Math.round(maturity),
      targetDate: targetDateStr,
      categoryIcon: 'trending-up',
      color: '#6366F1',
    });

    Alert.alert(
      'SIP Goal Created! 🎯',
      `Target of ${formatINR(Math.round(maturity))} has been added to your Savings Goals tab.`
    );
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <View>
              <Text style={styles.sheetTitle}>SIP Wealth Simulator 📈</Text>
              <Text style={styles.sheetSub}>Compounding Growth & Long-term Wealth Potential</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* BIG MATURITY RESULT CARD */}
            <View style={styles.resultCard}>
              <Text style={styles.resultLabel}>Estimated Maturity Wealth</Text>
              <Text style={styles.resultMaturity}>{formatINR(Math.round(maturity))}</Text>

              {/* Two-tone Proportional Bar */}
              <View style={styles.progBarTrack}>
                <View style={[styles.progBarInvested, { width: `${investedRatio}%` }]} />
                <View style={[styles.progBarGain, { width: `${gainRatio}%` }]} />
              </View>

              <View style={styles.resultStatsRow}>
                <View>
                  <Text style={styles.subStatLabel}>Total Invested</Text>
                  <Text style={styles.subStatVal}>{formatINR(Math.round(totalInvested))}</Text>
                </View>
                <View style={styles.statDivider} />
                <View>
                  <Text style={[styles.subStatLabel, { color: '#4ADE80' }]}>Wealth Gain</Text>
                  <Text style={[styles.subStatVal, { color: '#4ADE80' }]}>
                    +{formatINR(Math.round(wealthGain))}
                  </Text>
                </View>
                <View style={styles.statDivider} />
                <View>
                  <Text style={[styles.subStatLabel, { color: '#F59E0B' }]}>Multiplier</Text>
                  <Text style={[styles.subStatVal, { color: '#F59E0B' }]}>{multiplier}x</Text>
                </View>
              </View>
            </View>

            {/* INPUT 1: MONTHLY INVESTMENT */}
            <View style={styles.inputSection}>
              <Text style={styles.fieldLabel}>Monthly Investment (₹ / month)</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputPrefix}>₹</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={monthlyAmount}
                  onChangeText={setMonthlyAmount}
                  placeholder="5000"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
              <View style={styles.pillRow}>
                {POPULAR_AMOUNTS.map((amt) => {
                  const isSelected = P === amt;
                  return (
                    <TouchableOpacity
                      key={amt}
                      style={[styles.pillChip, isSelected && styles.pillChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setMonthlyAmount(amt.toString());
                      }}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* INPUT 2: EXPECTED ANNUAL RETURN */}
            <View style={styles.inputSection}>
              <Text style={styles.fieldLabel}>Expected Annual Returns (%)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={returnRate}
                  onChangeText={setReturnRate}
                  placeholder="12"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputSuffix}>% p.a.</Text>
              </View>
              <View style={styles.pillRow}>
                {RETURN_PRESETS.map((preset) => {
                  const isSelected = r === preset.rate;
                  return (
                    <TouchableOpacity
                      key={preset.rate}
                      style={[
                        styles.presetChip,
                        isSelected && { borderColor: preset.color, backgroundColor: preset.color + '20' },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setReturnRate(preset.rate.toString());
                      }}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          isSelected && { color: preset.color, fontWeight: '700' },
                        ]}
                      >
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* INPUT 3: INVESTMENT PERIOD */}
            <View style={styles.inputSection}>
              <Text style={styles.fieldLabel}>Investment Horizon (Years)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={years}
                  onChangeText={setYears}
                  placeholder="10"
                  placeholderTextColor={Colors.textMuted}
                />
                <Text style={styles.inputSuffix}>Years</Text>
              </View>
              <View style={styles.pillRow}>
                {POPULAR_YEARS.map((yr) => {
                  const isSelected = y === yr;
                  return (
                    <TouchableOpacity
                      key={yr}
                      style={[styles.pillChip, isSelected && styles.pillChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setYears(yr.toString());
                      }}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {yr} Yrs
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ACTION BUTTON */}
            <TouchableOpacity style={styles.createGoalBtn} onPress={handleCreateSavingsGoal}>
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.createGoalBtnText}>Set as Target Savings Goal 🎯</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    maxHeight: '90%',
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  scrollBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  resultCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  resultMaturity: {
    fontSize: 28,
    fontWeight: '900',
    color: '#38BDF8',
    marginTop: 4,
    marginBottom: 12,
  },
  progBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 14,
  },
  progBarInvested: {
    height: '100%',
    backgroundColor: '#60A5FA',
  },
  progBarGain: {
    height: '100%',
    backgroundColor: '#4ADE80',
  },
  resultStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  subStatLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  subStatVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  inputPrefix: {
    fontSize: 16,
    color: Colors.textMuted,
    fontWeight: '700',
    marginRight: 6,
  },
  inputSuffix: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
    marginLeft: 6,
  },
  textInput: {
    flex: 1,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  pillChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pillText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  presetChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  presetText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  createGoalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: 8,
  },
  createGoalBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
