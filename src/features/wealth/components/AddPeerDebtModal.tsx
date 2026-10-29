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
import { useWealthStore, PeerDebtType } from '../state/wealth-store';

interface Props {
  visible: boolean;
  onClose: () => void;
  defaultType?: PeerDebtType;
}

const QUICK_NOTES = [
  'Dinner / Food Bill Share 🍔',
  'Petrol / Fuel Share ⛽',
  'Emergency Hand Loan 🤝',
  'Room Rent Share 🏠',
  'Amazon / Shopping Share 🛍️',
];

export const AddPeerDebtModal: React.FC<Props> = ({ visible, onClose, defaultType = 'gave' }) => {
  const [type, setType] = useState<PeerDebtType>(defaultType);
  const [personName, setPersonName] = useState('');
  const [personPhone, setPersonPhone] = useState('');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  const addPeerDebt = useWealthStore((s) => s.addPeerDebt);

  React.useEffect(() => {
    if (visible) {
      setType(defaultType);
      setPersonName('');
      setPersonPhone('');
      setAmount('');
      setNote('');
    }
  }, [visible, defaultType]);

  const handleSave = () => {
    if (!personName.trim()) {
      Alert.alert('Required Name', 'Please enter the person or friend name.');
      return;
    }

    const numAmount = parseFloat(amount.trim());
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addPeerDebt({
      personName: personName.trim(),
      personPhone: personPhone.trim() || undefined,
      type,
      amount: numAmount,
      date: new Date().toISOString().slice(0, 10),
      note: note.trim() || undefined,
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
              <Text style={styles.modalTitle}>Friends Khata (கொடுத்தது / வாங்கியது)</Text>
              <Text style={styles.modalSubtitle}>Track money lent or borrowed from people</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Type Selector (Gave vs Took) */}
          <View style={styles.typeRow}>
            <TouchableOpacity
              style={[styles.typeBtn, type === 'gave' && styles.typeBtnGaveActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setType('gave');
              }}
            >
              <Ionicons name="arrow-up-circle" size={18} color={type === 'gave' ? '#FFFFFF' : '#EF4444'} />
              <View>
                <Text style={[styles.typeBtnTitle, type === 'gave' && { color: '#FFFFFF' }]}>
                  I Gave Money (கடன் கொடுத்தது)
                </Text>
                <Text style={styles.typeBtnSub}>You will get this money back</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeBtn, type === 'took' && styles.typeBtnTookActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setType('took');
              }}
            >
              <Ionicons name="arrow-down-circle" size={18} color={type === 'took' ? '#FFFFFF' : '#10B981'} />
              <View>
                <Text style={[styles.typeBtnTitle, type === 'took' && { color: '#FFFFFF' }]}>
                  I Took Money (கடன் வாங்கியது)
                </Text>
                <Text style={styles.typeBtnSub}>You need to return this money</Text>
              </View>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Person Name */}
            <Text style={styles.fieldLabel}>Person / Friend Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. Suresh, Dinesh, Ramesh"
              placeholderTextColor={Colors.textMuted}
              value={personName}
              onChangeText={setPersonName}
            />

            {/* Amount */}
            <Text style={styles.fieldLabel}>Amount (₹) *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 2500"
              placeholderTextColor={Colors.textMuted}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />

            {/* Quick Note Templates */}
            <Text style={styles.fieldLabel}>Quick Reason / Note</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {QUICK_NOTES.map((q, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.templateChip}
                  onPress={() => {
                    setNote(q.replace(/[\u{1F300}-\u{1F9FF}]/gu, '').trim());
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  }}
                >
                  <Text style={styles.templateChipText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <TextInput
              style={styles.textInput}
              placeholder="e.g. For dinner bill split, Hand loan"
              placeholderTextColor={Colors.textMuted}
              value={note}
              onChangeText={setNote}
            />

            {/* Phone (Optional) */}
            <Text style={styles.fieldLabel}>Phone Number (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. 9876543210"
              placeholderTextColor={Colors.textMuted}
              keyboardType="phone-pad"
              value={personPhone}
              onChangeText={setPersonPhone}
            />

            <TouchableOpacity
              style={[
                styles.saveBtn,
                { backgroundColor: type === 'gave' ? '#EF4444' : '#10B981' },
              ]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                Save {type === 'gave' ? 'Money Given' : 'Money Taken'}
              </Text>
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
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
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
  typeRow: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: Radii.lg,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  typeBtnGaveActive: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  typeBtnTookActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  typeBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  typeBtnSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
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
  saveBtn: {
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
