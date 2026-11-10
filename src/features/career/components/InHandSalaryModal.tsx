import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import { useJobStore } from '../state/job-store';

interface InHandSalaryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InHandSalaryModal: React.FC<InHandSalaryModalProps> = ({ visible, onClose }) => {
  const calculateInHandSalary = useJobStore((s) => s.calculateInHandSalary);

  const [ctcText, setCtcText] = useState('24'); // 24 LPA

  const handleCtcChange = (raw: string) => {
    const cleaned = raw.replace(/[^0-9.]/g, '');
    const firstDotIdx = cleaned.indexOf('.');
    const normalized =
      firstDotIdx === -1
        ? cleaned
        : `${cleaned.slice(0, firstDotIdx + 1)}${cleaned.slice(firstDotIdx + 1).replace(/\./g, '')}`;
    setCtcText(normalized);
  };

  const parsed = parseFloat(ctcText);
  const ctcLpa = Math.max(0, Number.isFinite(parsed) ? Math.min(parsed, 10000) : 0);

  const { monthlyGross, monthlyEPF, monthlyTax, monthlyInHand } = calculateInHandSalary(ctcLpa);
  const monthlyPT = monthlyGross > 200 ? 200 : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.sheetTitle} numberOfLines={1}>
                  In-Hand CTC Salary Calculator
                </Text>
                <Text style={styles.sheetSub} numberOfLines={1}>
                  Indian New Tax Regime & Monthly Bank Credit
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Input */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Annual CTC Package (in LPA)</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.input}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={Colors.textMuted}
                  value={ctcText}
                  onChangeText={handleCtcChange}
                />
                <Text style={styles.lpaSuffix}>LPA</Text>
              </View>
            </View>

            {/* Monthly In-Hand Highlight Card */}
            <View style={styles.highlightCard}>
              <Text style={styles.hlTitle}>Net Monthly In-Hand (Bank Credit)</Text>
              <Text style={styles.hlAmount}>{formatINR(monthlyInHand)}</Text>
              <Text style={styles.hlSub}>Credited on 1st of every month</Text>
            </View>

            {/* Detailed Monthly Deduction Breakdown */}
            <View style={styles.breakdownBox}>
              <View style={styles.bdRow}>
                <Text style={styles.bdLabel}>Gross Monthly Earnings</Text>
                <Text style={styles.bdValue}>{formatINR(monthlyGross)}</Text>
              </View>
              <View style={styles.bdRow}>
                <Text style={styles.bdLabel}>- Employee PF (12% of Basic)</Text>
                <Text style={styles.bdMinus}>- {formatINR(monthlyEPF)}</Text>
              </View>
              <View style={styles.bdRow}>
                <Text style={styles.bdLabel}>- Income Tax (New Regime)</Text>
                <Text style={styles.bdMinus}>- {formatINR(monthlyTax)}</Text>
              </View>
              <View style={styles.bdRow}>
                <Text style={styles.bdLabel}>- Professional Tax (PT)</Text>
                <Text style={styles.bdMinus}>- {formatINR(monthlyPT)}</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.doneBtn} onPress={onClose}>
              <Text style={styles.doneBtnText}>Close Calculator</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'android' ? 28 : Spacing.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  scrollContent: {
    paddingBottom: Spacing.sm,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sheetSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.cardSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  lpaSuffix: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  highlightCard: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  hlTitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  hlAmount: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.primary,
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  hlSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  breakdownBox: {
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 8,
  },
  bdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bdLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bdValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  bdMinus: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
    fontVariant: ['tabular-nums'],
  },
  doneBtn: {
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: Radii.md,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
