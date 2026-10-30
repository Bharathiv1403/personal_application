import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useJobStore, JobApplicationItem, InterviewRoundItem } from '../state/job-store';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';

interface InterviewRetrospectiveModalProps {
  visible: boolean;
  onClose: () => void;
  job: JobApplicationItem | null;
  round?: InterviewRoundItem | null;
}

export const InterviewRetrospectiveModal: React.FC<InterviewRetrospectiveModalProps> = ({
  visible,
  onClose,
  job,
  round,
}) => {
  const { updateInterviewRound, addInterviewRound } = useJobStore();

  const [rating, setRating] = useState<number>(round?.rating || 4);
  const [questionsText, setQuestionsText] = useState(
    (round?.questionsAsked || []).join('\n')
  );
  const [whatWentWell, setWhatWentWell] = useState(round?.whatWentWell || '');
  const [whatToRevise, setWhatToRevise] = useState(round?.whatToRevise || '');
  const [roundName, setRoundName] = useState(round?.roundName || 'Technical Round 1');

  const handleSave = () => {
    if (!job) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    const parsedQuestions = questionsText
      .split('\n')
      .map((q) => q.trim())
      .filter(Boolean);

    if (round) {
      updateInterviewRound(job.id, round.id, {
        roundName,
        rating,
        questionsAsked: parsedQuestions,
        whatWentWell: whatWentWell.trim(),
        whatToRevise: whatToRevise.trim(),
      });
    } else {
      addInterviewRound(job.id, {
        roundName,
        scheduledAt: new Date().toISOString(),
        rating,
        questionsAsked: parsedQuestions,
        whatWentWell: whatWentWell.trim(),
        whatToRevise: whatToRevise.trim(),
      });
    }

    Alert.alert('Retrospective Saved! 🎯', 'Great job debriefing right away while fresh in memory.');
    onClose();
  };

  const handleDraftThankYouEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const recipient = job?.recruiterEmail || '';
    const subject = encodeURIComponent(`Thank You – ${roundName} Interview for ${job?.role || 'Engineer'} role`);
    const body = encodeURIComponent(
      `Dear ${job?.recruiterName || 'Hiring Team'},\n\nThank you for taking the time to speak with me today regarding the ${job?.role} opportunity at ${job?.companyName}. I really enjoyed learning more about the team's technical architecture and engineering goals.\n\nLooking forward to hearing about the next steps.\n\nBest regards,\nCandidate`
    );

    Linking.openURL(`mailto:${recipient}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Email App', 'Unable to launch default email app.');
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Ionicons name="sparkles" size={18} color={Colors.cyan} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Interview Debrief & Retrospective</Text>
              <Text style={styles.headerSubtitle}>
                {job?.companyName || 'Company'} • {roundName}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Round Name */}
            <Text style={styles.fieldLabel}>Round Name</Text>
            <TextInput
              style={styles.textInput}
              value={roundName}
              onChangeText={setRoundName}
              placeholder="e.g. Technical Round 1, System Design, Hiring Manager"
              placeholderTextColor={Colors.textMuted}
            />

            {/* Performance Self-Rating */}
            <Text style={styles.fieldLabel}>How do you feel it went? (Self-Rating)</Text>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  style={styles.starBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setRating(star);
                  }}
                >
                  <Ionicons
                    name={star <= rating ? 'star' : 'star-outline'}
                    size={28}
                    color={star <= rating ? Colors.gold : Colors.textMuted}
                  />
                </TouchableOpacity>
              ))}
              <Text style={styles.ratingText}>
                {rating === 5
                  ? 'Crushed it! 🔥'
                  : rating === 4
                  ? 'Strong Performance 👍'
                  : rating === 3
                  ? 'Average / Decent ⚖️'
                  : 'Tough / Need Practice ⚠️'}
              </Text>
            </View>

            {/* Questions Asked */}
            <Text style={styles.fieldLabel}>Questions Asked (1 per line)</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={questionsText}
              onChangeText={setQuestionsText}
              placeholder="e.g.&#10;1. How does React Native Fabric work?&#10;2. Design a URL Shortener with 10M daily requests&#10;3. Explain JS microtask queue priority"
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            {/* What Went Well */}
            <Text style={styles.fieldLabel}>What Went Well? (Wins)</Text>
            <TextInput
              style={[styles.textInput, styles.shortMultilineInput]}
              value={whatWentWell}
              onChangeText={setWhatWentWell}
              placeholder="e.g. Clear communication on trade-offs, coded clean solution in 25 mins."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            {/* What To Revise */}
            <Text style={styles.fieldLabel}>What to Revise? (Weak Spots)</Text>
            <TextInput
              style={[styles.textInput, styles.shortMultilineInput]}
              value={whatToRevise}
              onChangeText={setWhatToRevise}
              placeholder="e.g. Review Redis distributed locking with Redlock and TTL edge cases."
              placeholderTextColor={Colors.textMuted}
              multiline
              textAlignVertical="top"
            />

            {/* Thank You Note Helper */}
            <TouchableOpacity style={styles.thankYouBtn} onPress={handleDraftThankYouEmail}>
              <Ionicons name="mail" size={16} color={Colors.cyan} />
              <Text style={styles.thankYouBtnText}>
                Draft 1-Tap Thank You Email to Recruiter
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>Save Retrospective</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#12131D',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 8,
    marginTop: Spacing.sm,
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: Spacing.sm,
  },
  multilineInput: {
    minHeight: 80,
    lineHeight: 20,
  },
  shortMultilineInput: {
    minHeight: 56,
    lineHeight: 20,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  starBtn: {
    padding: 2,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.gold,
    marginLeft: 6,
  },
  thankYouBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
    paddingVertical: 12,
    borderRadius: Radii.md,
    marginVertical: Spacing.md,
  },
  thankYouBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.cyan,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radii.lg,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
