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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { formatINR } from '@/core/utils/currency';
import { calculateGoldWorth } from '@/core/utils/vatti';
import { useWealthStore } from '../state/wealth-store';

interface AddGoldModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddGoldModal: React.FC<AddGoldModalProps> = ({ visible, onClose }) => {
  const addGoldItem = useWealthStore((s) => s.addGoldItem);
  const currentRate = useWealthStore((s) => s.currentGoldRatePerGram);

  const [name, setName] = useState('');
  const [weightText, setWeightText] = useState('8');
  const [inputMode, setInputMode] = useState<'grams' | 'sovereigns'>('grams');
  const [purity, setPurity] = useState<'24K' | '22K' | '18K'>('22K');
  const [location, setLocation] = useState<'Home Locker' | 'Bank Locker' | 'Wearing'>('Home Locker');

  const rawNumber = parseFloat(weightText) || 0;
  const calculatedGrams = inputMode === 'sovereigns' ? rawNumber * 8 : rawNumber;
  const { totalValue, sovereigns } = calculateGoldWorth(calculatedGrams, currentRate);

  const handleSave = () => {
    if (!name.trim() || calculatedGrams <= 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addGoldItem({
      name: name.trim(),
      weightGrams: calculatedGrams,
      purity,
      location,
    });

    setName('');
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
              <Text style={styles.sheetTitle}>Add Gold Ornament / Asset</Text>
              <Text style={styles.sheetSub}>Record gold holdings & live estimated net worth</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Form Fields */}
          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Item Name / Description</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 22K Sovereign Chain / Wedding Ring"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Unit Toggle: Grams vs Sovereigns */}
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleBtn, inputMode === 'grams' && styles.toggleBtnActive]}
              onPress={() => setInputMode('grams')}
            >
              <Text style={[styles.toggleText, inputMode === 'grams' && styles.toggleTextActive]}>
                Enter in Grams
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleBtn, inputMode === 'sovereigns' && styles.toggleBtnActive]}
              onPress={() => setInputMode('sovereigns')}
            >
              <Text style={[styles.toggleText, inputMode === 'sovereigns' && styles.toggleTextActive]}>
                Enter in Savaran (Sovereign)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.formRow}>
            <View style={[styles.formGroup, { flex: 1.2 }]}>
              <Text style={styles.inputLabel}>Weight ({inputMode === 'grams' ? 'Grams' : 'Savaran'})</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={weightText}
                onChangeText={setWeightText}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Purity</Text>
              <View style={styles.purityRow}>
                {(['22K', '24K'] as const).map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.purityBtn, purity === p && styles.purityBtnActive]}
                    onPress={() => setPurity(p)}
                  >
                    <Text style={[styles.purityText, purity === p && styles.purityTextActive]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Live Valuation Box */}
          <View style={styles.valuationBox}>
            <View style={styles.valRow}>
              <Text style={styles.valLabel}>Total Weight:</Text>
              <Text style={styles.valText}>{calculatedGrams} Grams ({sovereigns} Savaran)</Text>
            </View>
            <View style={styles.valRow}>
              <Text style={styles.valLabel}>Estimated Market Value:</Text>
              <Text style={styles.valHighlight}>{formatINR(totalValue)}</Text>
            </View>
          </View>

          {/* Save Action */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="sparkles" size={18} color={Colors.textInverse} />
            <Text style={styles.saveBtnText}>Add Gold Item to Vault</Text>
          </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: Colors.borderLight,
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
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: Spacing.md,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  toggleBtnActive: {
    backgroundColor: Colors.cardElevated,
  },
  toggleText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.gold,
    fontWeight: '600',
  },
  purityRow: {
    flexDirection: 'row',
    gap: 6,
  },
  purityBtn: {
    flex: 1,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: Radii.md,
  },
  purityBtnActive: {
    borderColor: Colors.gold,
    backgroundColor: Colors.goldGlow,
  },
  purityText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  purityTextActive: {
    color: Colors.gold,
  },
  valuationBox: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    borderRadius: Radii.md,
    padding: Spacing.md,
    marginVertical: Spacing.md,
    gap: 6,
  },
  valRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  valText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  valHighlight: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.gold,
    fontVariant: ['tabular-nums'],
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.gold,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
    marginTop: Spacing.sm,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});
