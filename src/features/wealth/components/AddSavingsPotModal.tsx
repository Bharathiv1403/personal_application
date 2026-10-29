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

const POT_TEMPLATES = [
  { name: 'Health & Medical Reserve 🏥', target: '50000', icon: 'medkit', color: '#06B6D4' },
  { name: 'Emergency Safety Fund 🛡️', target: '100000', icon: 'shield-checkmark', color: '#10B981' },
  { name: 'Trip & Vacation Savings 🏖️', target: '30000', icon: 'airplane', color: '#F59E0B' },
  { name: 'Bike / Vehicle Maintenance 🏍️', target: '15000', icon: 'bicycle', color: '#EF4444' },
  { name: 'Laptop / Gadget Fund 💻', target: '80000', icon: 'laptop', color: '#3B82F6' },
  { name: 'Festival & Family Gifts 🎁', target: '20000', icon: 'gift', color: '#EC4899' },
];

export const AddSavingsPotModal: React.FC<Props> = ({ visible, onClose }) => {
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('2026-12-31');
  const [selectedIcon, setSelectedIcon] = useState('shield-checkmark');
  const [selectedColor, setSelectedColor] = useState('#10B981');

  const addGoal = useWealthStore((s) => s.addGoal);

  React.useEffect(() => {
    if (visible) {
      setName('');
      setTargetAmount('');
      setTargetDate('2026-12-31');
      setSelectedIcon('shield-checkmark');
      setSelectedColor('#10B981');
    }
  }, [visible]);

  const handleApplyTemplate = (tmpl: (typeof POT_TEMPLATES)[0]) => {
    setName(tmpl.name);
    setTargetAmount(tmpl.target);
    setSelectedIcon(tmpl.icon);
    setSelectedColor(tmpl.color);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Required Name', 'Please enter a name for your savings pot.');
      return;
    }

    const numTarget = parseFloat(targetAmount.trim());
    if (isNaN(numTarget) || numTarget <= 0) {
      Alert.alert('Invalid Target', 'Please enter a valid target amount.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addGoal({
      name: name.trim(),
      targetAmount: numTarget,
      targetDate: targetDate.trim() || '2026-12-31',
      categoryIcon: selectedIcon,
      color: selectedColor,
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
              <Text style={styles.modalTitle}>Create Savings Pot</Text>
              <Text style={styles.modalSubtitle}>Save for Health, Emergency, Trips & Goals</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Presets */}
            <Text style={styles.fieldLabel}>Quick Savings Purposes</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {POT_TEMPLATES.map((tmpl, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.templateChip}
                  onPress={() => handleApplyTemplate(tmpl)}
                >
                  <Text style={styles.templateChipText}>{tmpl.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Name */}
            <Text style={styles.fieldLabel}>Savings Pot Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Health Emergency Pot"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            {/* Target Amount */}
            <Text style={styles.fieldLabel}>Target Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 50000"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={targetAmount}
              onChangeText={setTargetAmount}
            />

            {/* Target Date */}
            <Text style={styles.fieldLabel}>Target Date (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="2026-12-31"
              placeholderTextColor={Colors.textMuted}
              value={targetDate}
              onChangeText={setTargetDate}
            />

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Create Savings Pot</Text>
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
  saveBtn: {
    backgroundColor: '#10B981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    marginTop: Spacing.lg,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
