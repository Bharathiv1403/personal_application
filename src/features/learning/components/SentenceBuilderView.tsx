import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import {
  SENTENCE_BUILDER_CHALLENGES,
  BE_VERB_DRILLS,
  SentenceChallenge,
  BeVerbDrill,
} from '../data/sentence-builder-data';
import { useEnglishLearningStore } from '../state/english-learning-store';

export const SentenceBuilderView: React.FC = () => {
  const incrementScore = useEnglishLearningStore((s) => s.incrementScore);

  const [activeSubTab, setActiveSubTab] = useState<'builder' | 'drills'>('builder');

  // ==========================================
  // SENTENCE BUILDER STATE
  // ==========================================
  const [currentChallengeIdx, setCurrentChallengeIdx] = useState(0);
  const currentChallenge: SentenceChallenge =
    SENTENCE_BUILDER_CHALLENGES[currentChallengeIdx] ||
    SENTENCE_BUILDER_CHALLENGES[0];

  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>(() => [
    ...currentChallenge.scrambledWords,
  ]);
  const [builderStatus, setBuilderStatus] = useState<
    'idle' | 'correct' | 'wrong'
  >('idle');

  // Reset words when challenge changes
  const loadChallenge = (idx: number) => {
    const nextChallenge = SENTENCE_BUILDER_CHALLENGES[idx];
    if (nextChallenge) {
      setCurrentChallengeIdx(idx);
      setSelectedWords([]);
      setAvailableWords([...nextChallenge.scrambledWords]);
      setBuilderStatus('idle');
    }
  };

  const handleTapAvailableWord = (word: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedWords([...selectedWords, word]);
    const updated = [...availableWords];
    updated.splice(index, 1);
    setAvailableWords(updated);
    setBuilderStatus('idle');
  };

  const handleTapSelectedWord = (word: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const updatedSelected = [...selectedWords];
    updatedSelected.splice(index, 1);
    setSelectedWords(updatedSelected);
    setAvailableWords([...availableWords, word]);
    setBuilderStatus('idle');
  };

  const handleCheckBuilderAnswer = () => {
    const constructed = selectedWords.join(' ').trim().toLowerCase();
    const target = currentChallenge.englishSentence.trim().toLowerCase();

    if (constructed === target) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setBuilderStatus('correct');
      incrementScore(15);
      speakSentence(currentChallenge.englishSentence);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setBuilderStatus('wrong');
    }
  };

  const speakSentence = (text: string) => {
    try {
      Speech.stop();
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.88,
      });
    } catch {}
  };

  // ==========================================
  // BE VERB DRILLS STATE
  // ==========================================
  const [drillIdx, setDrillIdx] = useState(0);
  const currentDrill: BeVerbDrill = BE_VERB_DRILLS[drillIdx] || BE_VERB_DRILLS[0];
  const [selectedDrillOption, setSelectedDrillOption] = useState<string | null>(null);

  const handleSelectDrillOption = (option: string) => {
    if (selectedDrillOption) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedDrillOption(option);
    if (option === currentDrill.correctAnswer) {
      incrementScore(10);
      const fullSentence = currentDrill.sentenceWithBlank.replace('_____', option);
      speakSentence(fullSentence);
    }
  };

  const handleNextDrill = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setSelectedDrillOption(null);
    setDrillIdx((prev) => (prev + 1) % BE_VERB_DRILLS.length);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
      {/* Intro Banner */}
      <GlassCard style={styles.topCard}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.iconCircle}>
            <Ionicons name="shapes" size={20} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.topTitle}>Interactive Practice Games 🧩</Text>
            <Text style={styles.topSub}>
              வார்த்தைகளை வரிசைப்படுத்தி வாக்கியம் அமைத்தல் & Be Verb நேரடி தேர்வுகள்
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Sub Mode Switcher Tabs */}
      <View style={styles.subTabRow}>
        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'builder' && styles.subTabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveSubTab('builder');
          }}
        >
          <Ionicons
            name="cube-outline"
            size={14}
            color={activeSubTab === 'builder' ? '#FFFFFF' : Colors.textMuted}
          />
          <Text style={[styles.subTabText, activeSubTab === 'builder' && styles.subTabTextActive]}>
            Sentence Builder 🧩
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabBtn, activeSubTab === 'drills' && styles.subTabBtnActive]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setActiveSubTab('drills');
          }}
        >
          <Ionicons
            name="flash-outline"
            size={14}
            color={activeSubTab === 'drills' ? '#FFFFFF' : Colors.textMuted}
          />
          <Text style={[styles.subTabText, activeSubTab === 'drills' && styles.subTabTextActive]}>
            Be Verb Drills ⚡
          </Text>
        </TouchableOpacity>
      </View>

      {/* ================================================================= */}
      {/* SUB TAB 1: SENTENCE BUILDER */}
      {/* ================================================================= */}
      {activeSubTab === 'builder' && (
        <View>
          {/* Progress & Badge */}
          <View style={styles.progressRow}>
            <Badge
              label={`Challenge ${currentChallengeIdx + 1}/${SENTENCE_BUILDER_CHALLENGES.length}`}
              variant="cyan"
            />
            {currentChallenge.beVerbNote && (
              <Badge label={currentChallenge.beVerbNote} variant="gold" />
            )}
          </View>

          {/* Tamil Sentence Target Card */}
          <GlassCard style={styles.targetCard} variant="elevated">
            <Text style={styles.targetHeaderLabel}>Translate into English (ஆங்கிலத்தில் அமைக்கவும்):</Text>
            <Text style={styles.targetTamilSentence}>{currentChallenge.tamilSentence}</Text>
          </GlassCard>

          {/* Constructed Sentence Slots */}
          <View style={styles.slotsCard}>
            <Text style={styles.slotsLabel}>Your English Sentence (கட்டப்பட்ட வாக்கியம்):</Text>
            <View style={styles.slotsWrapper}>
              {selectedWords.length === 0 ? (
                <Text style={styles.placeholderSlotsText}>
                  கீழே உள்ள வார்த்தைகளைத் தொட்டு வாக்கியத்தை அமைக்கவும்...
                </Text>
              ) : (
                selectedWords.map((word, wIdx) => (
                  <TouchableOpacity
                    key={`${word}-${wIdx}`}
                    style={styles.selectedWordChip}
                    onPress={() => handleTapSelectedWord(word, wIdx)}
                  >
                    <Text style={styles.selectedWordText}>{word}</Text>
                    <Ionicons name="close" size={12} color="#FFFFFF" style={{ marginLeft: 3 }} />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>

          {/* Word Bank (Scrambled Words) */}
          <View style={styles.bankSection}>
            <Text style={styles.bankLabel}>Available Words (சொல் வங்கி):</Text>
            <View style={styles.bankChipsWrapper}>
              {availableWords.map((word, aIdx) => (
                <TouchableOpacity
                  key={`${word}-${aIdx}`}
                  style={styles.availableWordChip}
                  onPress={() => handleTapAvailableWord(word, aIdx)}
                >
                  <Text style={styles.availableWordText}>{word}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Check / Next Buttons */}
          <View style={styles.actionRow}>
            {builderStatus === 'correct' ? (
              <TouchableOpacity
                style={styles.nextChallengeBtn}
                onPress={() =>
                  loadChallenge(
                    (currentChallengeIdx + 1) % SENTENCE_BUILDER_CHALLENGES.length
                  )
                }
              >
                <Text style={styles.nextChallengeBtnText}>Next Challenge ➔ (+15 XP)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.checkAnswerBtn,
                  selectedWords.length === 0 && styles.checkAnswerBtnDisabled,
                ]}
                disabled={selectedWords.length === 0}
                onPress={handleCheckBuilderAnswer}
              >
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                <Text style={styles.checkAnswerBtnText}>Check Answer ✓</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.speakerBtn}
              onPress={() => speakSentence(currentChallenge.englishSentence)}
            >
              <Ionicons name="volume-high" size={18} color="#38BDF8" />
            </TouchableOpacity>
          </View>

          {/* Feedback & Tamil Explanation */}
          {builderStatus === 'correct' && (
            <View style={styles.feedbackBoxCorrect}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
                <Text style={styles.feedbackTitleCorrect}>Super! மிகச் சரியான விடை 🎉</Text>
              </View>
              <Text style={styles.targetSentenceEn}>{currentChallenge.englishSentence}</Text>
              <Text style={styles.feedbackTa}>{currentChallenge.explanationTa}</Text>
            </View>
          )}

          {builderStatus === 'wrong' && (
            <View style={styles.feedbackBoxWrong}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="alert-circle" size={18} color="#EF4444" />
                <Text style={styles.feedbackTitleWrong}>தவறான வரிசை! மீண்டும் முயற்சிக்கவும்</Text>
              </View>
              <Text style={styles.feedbackTa}>
                குறிப்பு: வார்த்தைகளை வரிசை மாற்ற Slot-ல் உள்ள வார்த்தையைத் தட்டவும்.
              </Text>
            </View>
          )}
        </View>
      )}

      {/* ================================================================= */}
      {/* SUB TAB 2: BE VERB SPEED DRILLS */}
      {/* ================================================================= */}
      {activeSubTab === 'drills' && (
        <View>
          <View style={styles.progressRow}>
            <Badge label={`Drill ${drillIdx + 1}/${BE_VERB_DRILLS.length}`} variant="gold" />
            <Badge label="Be Verb & Auxiliaries" variant="cyan" />
          </View>

          {/* Drill Question Card */}
          <GlassCard style={styles.drillCard} variant="elevated">
            <Text style={styles.drillHeaderLabel}>Fill in the correct Be Verb / Verb:</Text>
            <Text style={styles.drillSentence}>
              {currentDrill.sentenceWithBlank}
            </Text>
            <View style={styles.drillTamilBox}>
              <Text style={styles.drillTamilText}>💡 {currentDrill.tamilMeaning}</Text>
            </View>
          </GlassCard>

          {/* Options Grid */}
          <View style={styles.drillOptionsGrid}>
            {currentDrill.options.map((opt) => {
              const isSelected = selectedDrillOption === opt;
              const isCorrect = opt === currentDrill.correctAnswer;
              const hasAnswered = selectedDrillOption !== null;

              return (
                <TouchableOpacity
                  key={opt}
                  style={[
                    styles.drillOptionBtn,
                    hasAnswered && isCorrect ? styles.drillOptionCorrect : null,
                    hasAnswered && isSelected && !isCorrect ? styles.drillOptionWrong : null,
                  ]}
                  disabled={hasAnswered}
                  onPress={() => handleSelectDrillOption(opt)}
                >
                  <Text
                    style={[
                      styles.drillOptionText,
                      hasAnswered && isCorrect ? styles.drillOptionTextCorrect : null,
                    ]}
                  >
                    {opt}
                  </Text>
                  {hasAnswered && isCorrect && (
                    <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                  )}
                  {hasAnswered && isSelected && !isCorrect && (
                    <Ionicons name="close-circle" size={16} color="#EF4444" />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Explanation Banner */}
          {selectedDrillOption && (
            <View
              style={[
                styles.drillExpCard,
                selectedDrillOption === currentDrill.correctAnswer
                  ? styles.drillExpCorrect
                  : styles.drillExpWrong,
              ]}
            >
              <Text style={styles.drillExpTitle}>
                {selectedDrillOption === currentDrill.correctAnswer
                  ? 'சரியான விடை! +10 XP 🎉'
                  : 'விளக்கம் (Grammar Rule):'}
              </Text>
              <Text style={styles.drillExpDesc}>{currentDrill.ruleExplanationTa}</Text>

              <TouchableOpacity style={styles.nextDrillBtn} onPress={handleNextDrill}>
                <Text style={styles.nextDrillBtnText}>Next Drill ➔</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: Spacing.xl,
  },
  topCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  subTabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.full,
    padding: 3,
    marginBottom: Spacing.md,
    gap: 4,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  subTabBtnActive: {
    backgroundColor: Colors.primary,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  subTabTextActive: {
    color: '#FFFFFF',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  targetCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  targetHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38BDF8',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  targetTamilSentence: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  slotsCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    minHeight: 80,
  },
  slotsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  slotsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  placeholderSlotsText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.3)',
    fontStyle: 'italic',
  },
  selectedWordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  selectedWordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  bankSection: {
    marginBottom: Spacing.md,
  },
  bankLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  bankChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  availableWordChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radii.full,
  },
  availableWordText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  checkAnswerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 12,
    gap: 6,
  },
  checkAnswerBtnDisabled: {
    opacity: 0.4,
  },
  checkAnswerBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nextChallengeBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    borderRadius: Radii.full,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextChallengeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  speakerBtn: {
    width: 44,
    height: 44,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackBoxCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: 4,
  },
  feedbackTitleCorrect: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10B981',
  },
  targetSentenceEn: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  feedbackTa: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 2,
  },
  feedbackBoxWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: Radii.md,
    padding: Spacing.md,
    gap: 4,
  },
  feedbackTitleWrong: {
    fontSize: 13,
    fontWeight: '800',
    color: '#EF4444',
  },

  // DRILLS STYLES
  drillCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  drillHeaderLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  drillSentence: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  drillTamilBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radii.sm,
    padding: 8,
    marginTop: 10,
  },
  drillTamilText: {
    fontSize: 12,
    color: '#34D399',
    fontWeight: '600',
  },
  drillOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  drillOptionBtn: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: Radii.md,
    paddingVertical: 14,
    gap: 8,
  },
  drillOptionCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  drillOptionWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#EF4444',
  },
  drillOptionText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  drillOptionTextCorrect: {
    color: '#10B981',
  },
  drillExpCard: {
    borderRadius: Radii.md,
    padding: Spacing.md,
    borderWidth: 1,
    gap: 6,
  },
  drillExpCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  drillExpWrong: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  drillExpTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  drillExpDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 18,
  },
  nextDrillBtn: {
    backgroundColor: '#38BDF8',
    borderRadius: Radii.full,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  nextDrillBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F1117',
  },
});
