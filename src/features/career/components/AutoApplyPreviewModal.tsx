import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';
import { Linking } from 'react-native';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { JobApplicationItem } from '../state/job-store';
import { useCandidateProfileStore } from '../state/candidate-profile-store';
import { Badge } from '@/core/design-system/primitives/Badge';

interface Props {
  visible: boolean;
  job: JobApplicationItem | null;
  onClose: () => void;
  onApplied: (jobId: string) => void;
  onOpenCoverLetter: (job: JobApplicationItem) => void;
}

export const AutoApplyPreviewModal: React.FC<Props> = ({
  visible,
  job,
  onClose,
  onApplied,
  onOpenCoverLetter,
}) => {
  const [selectedResumeId, setSelectedResumeId] = useState<string>('');

  const profile = useCandidateProfileStore();
  const resumes = profile.resumes;
  const answerBank = profile.answerBank;

  // Auto-pick resume based on job tags/role
  React.useEffect(() => {
    if (job && resumes.length > 0) {
      const isMobileJob =
        job.role.toLowerCase().includes('native') ||
        job.role.toLowerCase().includes('mobile') ||
        (job.tags && job.tags.some((t) => t.toLowerCase().includes('react native')));

      const matchingResume = isMobileJob
        ? resumes.find((r) => r.name.toLowerCase().includes('mobile') || r.name.toLowerCase().includes('native'))
        : resumes.find((r) => r.isDefault) || resumes[0];

      setSelectedResumeId(matchingResume?.id || resumes[0].id);
    }
  }, [job, resumes]);

  if (!job) return null;

  const currentResume = resumes.find((r) => r.id === selectedResumeId) || resumes[0];

  const handleLaunchSubmit = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    onApplied(job.id);
    onClose();

    if (job.url) {
      try {
        await WebBrowser.openBrowserAsync(job.url);
      } catch {
        await Linking.openURL(job.url);
      }
    }

    Alert.alert(
      'Application Form Launched 🚀',
      `Auto-filled profile ready. Application for ${job.companyName} has been moved to your "Applied" tracker!`
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Auto-Apply & Application Preview</Text>
              <Text style={styles.modalSubtitle}>Verify mapped details before launching</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Job Target Summary */}
          <View style={styles.jobSummaryCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.jobRoleText}>{job.role}</Text>
              <Text style={styles.jobCompanyText}>{job.companyName} • {job.location}</Text>
            </View>
            <Badge
              label={`${job.matchScore ?? 85}% ATS Match`}
              variant={(job.matchScore ?? 85) >= 80 ? 'primary' : 'gold'}
            />
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* 1. Mapped Resume Selection */}
            <Text style={styles.sectionHeading}>1. Mapped Resume Profile</Text>
            <View style={styles.resumeSelectCard}>
              <View style={styles.resumeIcon}>
                <Ionicons name="document-text" size={20} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.resumeName}>{currentResume?.name || 'Master Resume'}</Text>
                <Text style={styles.resumeFile}>{currentResume?.fileName || 'resume.pdf'}</Text>
              </View>
              <Badge label="Auto-Selected" variant="primary" />
            </View>

            {/* 2. Personal Information Pre-fill */}
            <Text style={styles.sectionHeading}>2. Auto-Filled Candidate Info</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Full Name:</Text>
                <Text style={styles.infoVal}>{profile.name}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Email:</Text>
                <Text style={styles.infoVal}>{profile.email}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Phone:</Text>
                <Text style={styles.infoVal}>{profile.phone}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Total Exp:</Text>
                <Text style={styles.infoVal}>{profile.yearsOfExperience}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>Location:</Text>
                <Text style={styles.infoVal}>{profile.currentCity}, Tamil Nadu</Text>
              </View>
            </View>

            {/* 3. Reusable Answer Bank Mapping */}
            <Text style={styles.sectionHeading}>3. Answer Bank Response Mapping</Text>
            <View style={styles.answersCard}>
              {answerBank.slice(0, 4).map((ans) => (
                <View key={ans.id} style={styles.answerItem}>
                  <Text style={styles.answerQ}>• {ans.question}</Text>
                  <Text style={styles.answerA}>"{ans.answer}"</Text>
                </View>
              ))}
            </View>

            {/* 4. AI Tailored Cover Letter Action */}
            <TouchableOpacity
              style={styles.coverLetterBtn}
              onPress={() => {
                onClose();
                onOpenCoverLetter(job);
              }}
            >
              <Ionicons name="sparkles" size={16} color="#F59E0B" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.coverLetterBtnTitle}>AI Tailored Cover Letter</Text>
                <Text style={styles.coverLetterBtnSub}>Generate customized cover letter with Gemini & Groq</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </ScrollView>

          {/* Action Buttons */}
          <TouchableOpacity style={styles.launchBtn} onPress={handleLaunchSubmit}>
            <Ionicons name="rocket" size={18} color="#FFFFFF" />
            <Text style={styles.launchBtnText}>Confirm & Launch Application</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#12131A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 18,
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
  jobSummaryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
    marginBottom: Spacing.md,
  },
  jobRoleText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  jobCompanyText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  modalBody: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 6,
  },
  resumeSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 10,
  },
  resumeIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resumeName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  resumeFile: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 6,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoKey: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E2E8F0',
  },
  answersCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    gap: 8,
  },
  answerItem: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    paddingBottom: 6,
  },
  answerQ: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  answerA: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '500',
    marginTop: 2,
  },
  coverLetterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: Radii.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginTop: 12,
  },
  coverLetterBtnTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
  },
  coverLetterBtnSub: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  launchBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    gap: 8,
  },
  launchBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
