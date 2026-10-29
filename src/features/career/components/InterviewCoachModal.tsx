import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { AIService } from '@/core/utils/ai-service';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { ApiKeyModal } from '@/core/components/ApiKeyModal';
import { CURATED_INTERVIEW_QUESTIONS, CURATED_ENGLISH_BYTES } from '@/core/data/candidate-profile';

interface InterviewCoachModalProps {
  visible: boolean;
  onClose: () => void;
}

export const InterviewCoachModal: React.FC<InterviewCoachModalProps> = ({ visible, onClose }) => {
  const [tab, setTab] = useState<'interview' | 'english'>('interview');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [aiFeedback, setAiFeedback] = useState('');
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);

  const isAiConfigured = useAiConfigStore((s) => s.isConfigured);
  const hasKey = isAiConfigured || AIService.hasConfiguredKey();

  const [currentEnglishIndex, setCurrentEnglishIndex] = useState(0);

  const currentQ = CURATED_INTERVIEW_QUESTIONS[currentQIndex];
  const currentEnglish = CURATED_ENGLISH_BYTES[currentEnglishIndex];

  const handleNextQuestion = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCurrentQIndex((prev) => (prev + 1) % CURATED_INTERVIEW_QUESTIONS.length);
    setShowHint(false);
    setUserAnswer('');
    setAiFeedback('');
  };

  const handleNextEnglish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setCurrentEnglishIndex((prev) => (prev + 1) % CURATED_ENGLISH_BYTES.length);
  };

  const handleEvaluate = async () => {
    if (!userAnswer.trim()) return;
    if (!hasKey) {
      setApiKeyModalVisible(true);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setEvaluating(true);
    setAiFeedback('');
    try {
      const feedback = await AIService.evaluateInterviewAnswer(currentQ.question, userAnswer);
      setAiFeedback(feedback);
    } catch {
      setAiFeedback('Unable to evaluate answer right now.');
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Career & Interview Coach</Text>
              <Text style={styles.headerSubtitle}>Personal Tech & Corporate English Prep</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setApiKeyModalVisible(true)}
                style={{ padding: 6, borderRadius: Radii.sm, backgroundColor: '#1E1E24' }}
              >
                <Ionicons name="key" size={15} color={hasKey ? '#10B981' : '#F59E0B'} />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabButton, tab === 'interview' && styles.tabButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setTab('interview');
              }}
            >
              <Ionicons
                name="code-slash"
                size={14}
                color={tab === 'interview' ? Colors.primary : Colors.textMuted}
              />
              <Text style={[styles.tabText, tab === 'interview' && styles.tabTextActive]}>
                Tech & HR Questions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, tab === 'english' && styles.tabButtonActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setTab('english');
              }}
            >
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={14}
                color={tab === 'english' ? Colors.gold : Colors.textMuted}
              />
              <Text style={[styles.tabText, tab === 'english' && styles.tabTextActive]}>
                Corporate English (தமிழ்)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {tab === 'interview' ? (
              <View>
                {/* Topic Badge */}
                <View style={styles.badgeRow}>
                  <View style={styles.topicBadge}>
                    <Text style={styles.topicBadgeText}>{currentQ.topic}</Text>
                  </View>
                  <Text style={styles.counterText}>
                    {currentQIndex + 1} / {CURATED_INTERVIEW_QUESTIONS.length}
                  </Text>
                </View>

                {/* Question Box */}
                <View style={styles.questionBox}>
                  <Text style={styles.questionText}>{currentQ.question}</Text>
                </View>

                {/* Hint */}
                <TouchableOpacity
                  style={styles.hintToggle}
                  onPress={() => setShowHint(!showHint)}
                >
                  <Ionicons
                    name={showHint ? 'bulb' : 'bulb-outline'}
                    size={15}
                    color={Colors.gold}
                  />
                  <Text style={styles.hintToggleText}>
                    {showHint ? 'Hide Key Concepts' : 'Show Key Concepts / Hint'}
                  </Text>
                </TouchableOpacity>

                {showHint && (
                  <View style={styles.hintBox}>
                    <Text style={styles.hintText}>{currentQ.hint}</Text>
                  </View>
                )}

                {/* Answer Input */}
                <Text style={styles.inputLabel}>Your Practice Answer:</Text>
                <TextInput
                  style={styles.answerInput}
                  multiline
                  value={userAnswer}
                  onChangeText={setUserAnswer}
                  placeholder="Draft your explanation or bullet points here..."
                  placeholderTextColor={Colors.textMuted}
                  textAlignVertical="top"
                />

                {/* Evaluation Result */}
                {evaluating ? (
                  <View style={styles.evaluatingBox}>
                    <ActivityIndicator size="small" color={Colors.primary} />
                    <Text style={styles.evaluatingText}>Evaluating answer with Gemini AI...</Text>
                  </View>
                ) : aiFeedback ? (
                  <View style={styles.feedbackBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="sparkles" size={15} color={Colors.primary} />
                      <Text style={styles.feedbackTitle}>AI Bar Raiser Feedback</Text>
                    </View>
                    <Text style={styles.feedbackText}>{aiFeedback}</Text>
                  </View>
                ) : null}

                {/* Bottom Actions */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={[styles.btn, styles.evalBtn]}
                    onPress={handleEvaluate}
                    disabled={!userAnswer.trim() || evaluating}
                  >
                    <Ionicons name="checkmark-circle-outline" size={16} color={Colors.textInverse} />
                    <Text style={styles.evalBtnText}>Evaluate Answer</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={[styles.btn, styles.nextBtn]} onPress={handleNextQuestion}>
                    <Text style={styles.nextBtnText}>Next Question</Text>
                    <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                {/* English Byte Card */}
                <View style={styles.englishCard}>
                  <View style={styles.englishHeaderRow}>
                    <Text style={styles.englishPhrase}>“{currentEnglish.phrase}”</Text>
                    <Text style={styles.counterText}>
                      {currentEnglishIndex + 1} / {CURATED_ENGLISH_BYTES.length}
                    </Text>
                  </View>

                  <View style={styles.tamilMeaningBox}>
                    <Text style={styles.tamilLabel}>தமிழ் விளக்கம்:</Text>
                    <Text style={styles.tamilMeaningText}>{currentEnglish.tamil}</Text>
                  </View>

                  <View style={styles.exampleBox}>
                    <Text style={styles.exampleLabel}>Corporate Example (Slack / Email):</Text>
                    <Text style={styles.exampleText}>{currentEnglish.corporateExample}</Text>
                  </View>

                  <View style={styles.alternativeBox}>
                    <Ionicons name="information-circle-outline" size={14} color={Colors.primary} />
                    <Text style={styles.alternativeText}>{currentEnglish.betterAlternative}</Text>
                  </View>
                </View>

                {/* Next Phrase Button */}
                <TouchableOpacity style={[styles.btn, styles.nextPhraseBtn]} onPress={handleNextEnglish}>
                  <Text style={styles.nextBtnText}>Next Phrase / Byte</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          <ApiKeyModal
            visible={apiKeyModalVisible}
            onClose={() => setApiKeyModalVisible(false)}
            onSuccess={() => handleEvaluate()}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#121215',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    maxHeight: '90%',
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  tabBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: Radii.md,
    backgroundColor: Colors.cardSubtle,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: '#1F1F24',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  scrollBody: {
    marginVertical: Spacing.sm,
    maxHeight: 480,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  topicBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.sm,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  topicBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '600',
  },
  counterText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  questionBox: {
    backgroundColor: '#18181C',
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  questionText: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '600',
  },
  hintToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    marginBottom: 8,
  },
  hintToggleText: {
    color: Colors.gold,
    fontSize: 12,
    fontWeight: '600',
  },
  hintBox: {
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.2)',
    borderRadius: Radii.sm,
    padding: 10,
    marginBottom: 10,
  },
  hintText: {
    color: Colors.gold,
    fontSize: 12,
    lineHeight: 18,
  },
  inputLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  answerInput: {
    backgroundColor: '#18181C',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    padding: Spacing.sm,
    minHeight: 100,
    marginBottom: 10,
  },
  evaluatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    marginBottom: 8,
  },
  evaluatingText: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  feedbackBox: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 12,
  },
  feedbackTitle: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackText: {
    color: Colors.textPrimary,
    fontSize: 12,
    lineHeight: 18,
  },
  actionRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: 16,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    gap: 6,
  },
  evalBtn: {
    flex: 1.2,
    backgroundColor: Colors.primary,
  },
  evalBtnText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
  nextBtn: {
    flex: 1,
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  englishCard: {
    backgroundColor: '#18181C',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  englishHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  englishPhrase: {
    color: Colors.gold,
    fontSize: 18,
    fontWeight: '800',
  },
  tamilMeaningBox: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.sm,
    padding: 8,
    marginBottom: 10,
  },
  tamilLabel: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  tamilMeaningText: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
  },
  exampleBox: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
    borderRadius: Radii.sm,
    padding: 8,
    marginBottom: 10,
  },
  exampleLabel: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
  },
  exampleText: {
    color: Colors.textPrimary,
    fontSize: 13,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  alternativeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  alternativeText: {
    color: Colors.primary,
    fontSize: 11,
    flex: 1,
  },
  nextPhraseBtn: {
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
  },
});
