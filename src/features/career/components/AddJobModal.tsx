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
import { JobLivenessService, LivenessResult, GhostAnalysisResult } from '@/core/services/job-liveness-service';

interface AddJobModalProps {
  visible: boolean;
  onClose: () => void;
}

const PLATFORMS: { id: string; label: string; icon: any; color: string }[] = [
  { id: 'LinkedIn', label: 'LinkedIn', icon: 'logo-linkedin', color: '#38BDF8' },
  { id: 'Naukri', label: 'Naukri', icon: 'briefcase', color: '#60A5FA' },
  { id: 'Indeed', label: 'Indeed', icon: 'search', color: '#818CF8' },
  { id: 'Foundit', label: 'Foundit', icon: 'flash', color: '#C084FC' },
  { id: 'Handshake', label: 'Handshake', icon: 'hand-right', color: '#FB923C' },
  { id: 'Company Site', label: 'Company Portal', icon: 'business', color: '#34D399' },
  { id: 'Referral', label: 'Referral', icon: 'people', color: '#FBBF24' },
];

export const AddJobModal: React.FC<AddJobModalProps> = ({ visible, onClose }) => {
  const addJob = useJobStore((s) => s.addJob);

  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [location, setLocation] = useState('');
  const [workMode, setWorkMode] = useState<'Remote' | 'Hybrid' | 'Onsite'>('Remote');
  const [sourcePlatform, setSourcePlatform] = useState('LinkedIn');
  const [jobUrl, setJobUrl] = useState('');
  const [ctcMinText, setCtcMinText] = useState('');
  const [ctcMaxText, setCtcMaxText] = useState('');
  const [stage, setStage] = useState<JobStage>('applied');
  const [recruiterName, setRecruiterName] = useState('');
  const [jdText, setJdText] = useState('');

  // Liveness & Ghost Verification State (from career-ops engine)
  const [isCheckingLiveness, setIsCheckingLiveness] = useState(false);
  const [livenessResult, setLivenessResult] = useState<LivenessResult | null>(null);
  const [ghostResult, setGhostResult] = useState<GhostAnalysisResult | null>(null);

  const handleVerifyLink = async () => {
    if (!jobUrl.trim()) return;
    setIsCheckingLiveness(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const liveRes = await JobLivenessService.verifyUrlLiveness(jobUrl);
      setLivenessResult(liveRes);
      const ghostRes = JobLivenessService.analyzeGhostSignals(role, company, jdText);
      setGhostResult(ghostRes);
      Haptics.notificationAsync(
        liveRes.isLive ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Warning
      ).catch(() => {});
    } finally {
      setIsCheckingLiveness(false);
    }
  };

  const handleSave = () => {
    if (!company.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    addJob({
      companyName: company.trim(),
      role: role.trim(),
      location: location.trim(),
      workMode,
      source: sourcePlatform,
      url: jobUrl.trim() || undefined,
      ctcMin: parseFloat(ctcMinText) || 0,
      ctcMax: parseFloat(ctcMaxText) || 0,
      stage,
      appliedDate: new Date().toISOString().slice(0, 10),
      recruiterName: recruiterName.trim() || undefined,
      jobDescription: jdText.trim() || undefined,
    });

    setCompany('');
    setRole('');
    setJobUrl('');
    setJdText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
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

            {/* Source Platform Selector */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Found On (Source Platform)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.platformScroll}>
                {PLATFORMS.map((p) => {
                  const isSel = sourcePlatform === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.platformChip,
                        isSel && { backgroundColor: p.color + '22', borderColor: p.color },
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSourcePlatform(p.id);
                      }}
                    >
                      <Ionicons name={p.icon} size={13} color={isSel ? p.color : Colors.textMuted} />
                      <Text style={[styles.platformText, isSel && { color: p.color, fontWeight: '700' }]}>
                        {p.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Job Posting Link */}
            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs }}>
                <Text style={styles.inputLabel}>Job Posting URL (Optional)</Text>
                {jobUrl.trim().length > 0 && (
                  <TouchableOpacity
                    onPress={handleVerifyLink}
                    disabled={isCheckingLiveness}
                    style={styles.verifyLinkBtn}
                  >
                    <Ionicons
                      name={isCheckingLiveness ? 'refresh' : 'flash-outline'}
                      size={12}
                      color="#38BDF8"
                    />
                    <Text style={styles.verifyLinkText}>
                      {isCheckingLiveness ? 'Checking...' : 'Check Liveness ⚡'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.input}
                placeholder="https://job-boards.greenhouse.io/... or https://jobs.lever.co/..."
                placeholderTextColor={Colors.textMuted}
                value={jobUrl}
                onChangeText={(txt) => {
                  setJobUrl(txt);
                  setLivenessResult(null);
                  setGhostResult(null);
                }}
                autoCapitalize="none"
              />

              {/* Liveness & Ghost Verification Pill Banner */}
              {livenessResult && (
                <View style={[
                  styles.livenessBanner,
                  livenessResult.isLive ? styles.livenessLive : styles.livenessDead
                ]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons
                      name={livenessResult.isLive ? 'checkmark-circle' : 'alert-circle'}
                      size={15}
                      color={livenessResult.isLive ? '#34D399' : '#EF4444'}
                    />
                    <Text style={[styles.livenessTitle, { color: livenessResult.isLive ? '#34D399' : '#EF4444' }]}>
                      {livenessResult.statusText}
                    </Text>
                  </View>

                  {ghostResult && (
                    <View style={styles.ghostMetaRow}>
                      <View style={[
                        styles.ghostTierBadge,
                        ghostResult.tier === 'High Confidence'
                          ? styles.tierHigh
                          : ghostResult.tier === 'Proceed with Caution'
                          ? styles.tierCaution
                          : styles.tierSuspicious
                      ]}>
                        <Text style={styles.ghostTierText}>
                          {ghostResult.tier} (Trust: {ghostResult.trustScore}%)
                        </Text>
                      </View>
                      <Text style={styles.ghostRecText}>{ghostResult.recommendation}</Text>
                    </View>
                  )}
                </View>
              )}
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
  platformScroll: {
    marginTop: 2,
    marginBottom: 4,
  },
  platformChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: Radii.full,
    marginRight: Spacing.sm,
    gap: 5,
  },
  platformText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
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
  verifyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  verifyLinkText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
  },
  livenessBanner: {
    marginTop: 8,
    padding: 10,
    borderRadius: Radii.md,
    borderWidth: 1,
  },
  livenessLive: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  livenessDead: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  livenessTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  ghostMetaRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  ghostTierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  tierHigh: {
    backgroundColor: 'rgba(52, 211, 153, 0.18)',
  },
  tierCaution: {
    backgroundColor: 'rgba(251, 191, 36, 0.18)',
  },
  tierSuspicious: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
  },
  ghostTierText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  ghostRecText: {
    fontSize: 11,
    color: Colors.textSecondary,
    lineHeight: 15,
  },
});
