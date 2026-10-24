import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useJobStore, JobStage } from '../state/job-store';

interface AddJobModalProps {
  visible: boolean;
  onClose: () => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({ visible, onClose }) => {
  const addJob = useJobStore((s) => s.addJob);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'Onsite'>('Remote');
  const [ctcMinText, setCtcMinText] = useState('');
  const [ctcMaxText, setCtcMaxText] = useState('');
  const [stage, setStage] = useState<JobStage>('applied');
  const [recruiterName, setRecruiterName] = useState('');
  const [jdText, setJdText] = useState('');

  const handleSave = () => {
    if (!company.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addJob({
      companyName: company.trim(),
      role: role.trim(),
      location: location.trim(),
      workMode,
      ctcMin: parseFloat(ctcMinText) || 20,
      ctcMax: parseFloat(ctcMaxText) || 25,
      stage,
      appliedDate: new Date().toISOString().slice(0, 10),
      recruiterName: recruiterName.trim() || undefined,
      jobDescription: jdText.trim() || undefined,
    });

    setCompany('');
    setJdText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.sheetContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetTitle}>Track New Job Application</Text>
                <Text style={styles.sheetSub}>Add company to your personal ATS pipeline</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Form Fields */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Company Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Swiggy / Google / Atlassian"
                placeholderTextColor={Colors.textMuted}
                value={company}
                onChangeText={setCompany}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Role / Designation</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Senior Frontend Developer"
                placeholderTextColor={Colors.textMuted}
                value={role}
                onChangeText={setRole}
              />
            </View>

            {/* Work Mode */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Work Mode</Text>
              <View style={styles.toggleRow}>
                {(['Remote', 'Hybrid', 'Onsite'] as const).map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[styles.toggleBtn, workMode === m && styles.toggleBtnActive]}
                    onPress={() => setWorkMode(m)}
                  >
                    <Text style={[styles.toggleText, workMode === m && styles.toggleTextActive]}>
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* CTC Range */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Min CTC (LPA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 20"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={ctcMinText}
                  onChangeText={setCtcMinText}
                />
              </View>
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Max CTC (LPA)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 30"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                  value={ctcMaxText}
                  onChangeText={setCtcMaxText}
                />
              </View>
            </View>

            {/* Stage Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Initial Stage</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
                {(['applied', 'interview', 'assessment', 'wishlist'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.stageChip, stage === s && styles.stageChipActive]}
                    onPress={() => setStage(s)}
                  >
                    <Text style={[styles.stageText, stage === s && styles.stageTextActive]}>
                      {s.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Optional JD text */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Job Description (For Auto ATS Scoring)</Text>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={3}
                placeholder="Paste key skills or JD snippets..."
                placeholderTextColor={Colors.textMuted}
                value={jdText}
                onChangeText={setJdText}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="briefcase" size={18} color={Colors.textInverse} />
              <Text style={styles.saveBtnText}>Save Application to Pipeline</Text>
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
    maxHeight: '90%',
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
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  toggleTextActive: {
    color: Colors.cyan,
    fontWeight: '600',
  },
  stageScroll: {
    marginTop: 2,
  },
  stageChip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    marginRight: Spacing.sm,
  },
  stageChipActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  stageText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  stageTextActive: {
    color: Colors.primary,
  },
  textArea: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    padding: Spacing.md,
    fontSize: 13,
    color: Colors.textPrimary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.md,
    gap: 8,
    marginTop: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textInverse,
  },
});
