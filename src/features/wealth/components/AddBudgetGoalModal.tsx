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

export const AddBudgetGoalModal: React.FC<Props> = ({ visible, onClose }) => {
  const [mode, setMode] = useState<'budget' | 'goal'>('budget');
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('overall');
  const [targetDate, setTargetDate] = useState('2026-12-31');

  const categories = useWealthStore((s) => s.categories);
  const addBudget = useWealthStore((s) => s.addBudget);
  const addGoal = useWealthStore((s) => s.addGoal);

  const handleSave = () => {
    const numAmount = parseFloat(amount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    if (!name.trim()) {
      Alert.alert('Required Name', 'Please enter a name or target description.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (mode === 'budget') {
      addBudget({
        name: name.trim(),
        categoryId: selectedCategoryId === 'overall' ? undefined : selectedCategoryId,
        amount: numAmount,
        period: 'monthly',
        alertThresholdPercent: 80,
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmount: numAmount,
        targetDate: targetDate.trim() || '2026-12-31',
        categoryIcon: 'trophy',
        color: '#10B981',
      });
    }

    setName('');
    setAmount('');
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
              <Text style={styles.modalTitle}>
                {mode === 'budget' ? 'Create Spending Budget' : 'Set Savings Goal'}
              </Text>
              <Text style={styles.modalSubtitle}>Define your financial targets</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Mode Switcher */}
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[styles.modeTab, mode === 'budget' && styles.modeTabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setMode('budget');
              }}
            >
              <Ionicons
                name="pie-chart"
                size={16}
                color={mode === 'budget' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text style={[styles.modeTabText, mode === 'budget' && styles.modeTabTextActive]}>
                Budget Limit
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modeTab, mode === 'goal' && styles.modeTabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setMode('goal');
              }}
            >
              <Ionicons
                name="flag"
                size={16}
                color={mode === 'goal' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text style={[styles.modeTabText, mode === 'goal' && styles.modeTabTextActive]}>
                Savings Goal
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Title */}
            <Text style={styles.fieldLabel}>
              {mode === 'budget' ? 'Budget Name *' : 'Goal Name (e.g. New Bike, Emergency) *'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={mode === 'budget' ? 'e.g. Food & Dining Monthly' : 'e.g. MacBook Pro M3'}
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Amount */}
            <Text style={styles.fieldLabel}>
              {mode === 'budget' ? 'Monthly Limit (₹) *' : 'Target Target Savings Amount (₹) *'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 10000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Category selection for budget */}
            {mode === 'budget' ? (
              <>
                <Text style={styles.fieldLabel}>Apply to Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      selectedCategoryId === 'overall' && styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategoryId('overall')}
                  >
                    <Ionicons name="apps" size={14} color="#FFFFFF" />
                    <Text style={styles.categoryChipText}>Overall (All Expenses)</Text>
                  </TouchableOpacity>
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
                        <Text style={styles.categoryChipText}>{c.name}</Text>
                      </TouchableOpacity>
                    ))}
                </ScrollView>
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Target Date (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2026-12-31"
                  placeholderTextColor={Colors.textMuted}
                  value={targetDate}
                  onChangeText={setTargetDate}
                />
              </>
            )}
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              Save {mode === 'budget' ? 'Budget' : 'Goal'}
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
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
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
  modeRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.lg,
    gap: 6,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 6,
    marginTop: 10,
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
    marginBottom: 6,
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
  categoryChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.xl,
    gap: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
