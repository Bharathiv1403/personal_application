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
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useWealthStore } from '../state/wealth-store';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const BILL_TEMPLATES = [
  { title: 'House Rent', amount: '10000', categoryId: 'housing', recurring: 'monthly' },
  { title: 'Electricity Bill', amount: '1500', categoryId: 'utilities', recurring: 'monthly' },
  { title: 'WiFi / Internet', amount: '999', categoryId: 'utilities', recurring: 'monthly' },
  { title: 'Mobile Postpaid', amount: '499', categoryId: 'utilities', recurring: 'monthly' },
  { title: 'Loan EMI', amount: '5000', categoryId: 'emi_loans', recurring: 'monthly' },
  { title: 'Netflix / OTT', amount: '649', categoryId: 'entertainment', recurring: 'monthly' },
];

export const AddBillModal: React.FC<Props> = ({ visible, onClose }) => {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('utilities');
  const [recurring, setRecurring] = useState<'monthly' | 'quarterly' | 'yearly' | 'none'>('monthly');

  const categories = useWealthStore((s) => s.categories);
  const addBill = useWealthStore((s) => s.addBill);

  React.useEffect(() => {
    if (visible) {
      setTitle('');
      setAmount('');
      // Default to next week
      const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
      setDueDate(nextWeek);
      setSelectedCategoryId('utilities');
      setRecurring('monthly');
    }
  }, [visible]);

  const handleApplyTemplate = (tmpl: (typeof BILL_TEMPLATES)[0]) => {
    setTitle(tmpl.title);
    setAmount(tmpl.amount);
    setSelectedCategoryId(tmpl.categoryId);
    setRecurring(tmpl.recurring as any);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSave = () => {
    const numAmount = parseFloat(amount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid bill amount.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Required Title', 'Please enter a title for this bill or subscription.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addBill({
      title: title.trim(),
      amount: numAmount,
      categoryId: selectedCategoryId,
      dueDate: dueDate.trim() || new Date().toISOString().slice(0, 10),
      recurring,
    });

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
              <Text style={styles.modalTitle}>Add Recurring Bill / EMI</Text>
              <Text style={styles.modalSubtitle}>Track payment dates and avoid late fees</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Quick Templates */}
            <Text style={styles.fieldLabel}>Quick Templates</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {BILL_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.templateChip}
                  onPress={() => handleApplyTemplate(tmpl)}
                >
                  <Text style={styles.templateChipText}>{tmpl.title}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Title */}
            <Text style={styles.fieldLabel}>Bill / Subscription Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. House Rent, EB Bill, Car EMI"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Amount */}
            <Text style={styles.fieldLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 10000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Due Date */}
            <Text style={styles.fieldLabel}>Due Date (YYYY-MM-DD) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="2026-11-05"
              placeholderTextColor={Colors.textMuted}
              value={dueDate}
              onChangeText={setDueDate}
            />

            {/* Recurring Frequency */}
            <Text style={styles.fieldLabel}>Billing Frequency</Text>
            <View style={styles.frequencyRow}>
              {(['monthly', 'quarterly', 'yearly', 'none'] as const).map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[styles.freqChip, recurring === freq && styles.freqChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setRecurring(freq);
                  }}
                >
                  <Text style={[styles.freqChipText, recurring === freq && styles.freqChipTextActive]}>
                    {freq === 'none' ? 'One-time' : freq.charAt(0).toUpperCase() + freq.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category selection */}
            <Text style={styles.fieldLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {categories
                .filter((c) => c.type === 'expense')
                .map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[
                      styles.categoryChip,
                      selectedCategoryId === c.id && {
                        backgroundColor: c.color + '26',
                        borderColor: c.color,
                      },
                    ]}
                    onPress={() => setSelectedCategoryId(c.id)}
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

            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Ionicons name="calendar" size={18} color="#FFFFFF" />
              <Text style={styles.saveButtonText}>Save Bill Reminder</Text>
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
    backgroundColor: 'rgba(0,0,0,0.80)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#11131B',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    maxHeight: '88%',
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
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
    marginBottom: 6,
  },
  frequencyRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  freqChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  freqChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: Colors.primary,
  },
  freqChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  freqChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
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
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.lg,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
