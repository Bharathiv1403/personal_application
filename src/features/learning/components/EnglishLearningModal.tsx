import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import * as ImagePicker from 'expo-image-picker';
import * as Clipboard from 'expo-clipboard';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { Badge } from '@/core/design-system/primitives/Badge';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import {
  DAILY_PRACTICE_CURRICULUM,
  VISUAL_OBJECT_CARDS,
  VisualVocabularyItem,
} from '../data/english-curriculum';
import { ALL_ENGLISH_TOPICS, EnglishTopicItem } from '../data/english-topics-catalog';
import { useEnglishLearningStore, TranslationHistoryItem } from '../state/english-learning-store';
import { AIService } from '@/core/utils/ai-service';
import { TranslationService, TranslationResult } from '../utils/translation-service';
import { SentenceBuilderView } from './SentenceBuilderView';
import { AiEnglishChatPartnerView } from './AiEnglishChatPartnerView';

interface EnglishLearningModalProps {
  visible?: boolean;
  onClose?: () => void;
}

type TabType =
  | 'daily_guide'
  | 'all_topics'
  | 'sentence_builder'
  | 'ai_chat'
  | 'translator'
  | 'image_learning'
  | 'quiz';

export const EnglishLearningModal: React.FC<EnglishLearningModalProps> = ({
  visible,
  onClose,
}) => {
  const isStoreOpen = useEnglishLearningStore((s) => s.isModalOpen);
  const closeStoreModal = useEnglishLearningStore((s) => s.closeModal);
  const isModalVisible = visible !== undefined ? visible : isStoreOpen;
  const handleModalClose = onClose || closeStoreModal;

  const [activeTab, setActiveTab] = useState<TabType>('daily_guide');

  // Store
  const currentDay = useEnglishLearningStore((s) => s.currentDay);
  const completedDays = useEnglishLearningStore((s) => s.completedDays);
  const streakDays = useEnglishLearningStore((s) => s.streakDays);
  const totalScore = useEnglishLearningStore((s) => s.totalScore);
  const customImageCards = useEnglishLearningStore((s) => s.customImageCards);
  const translationHistory = useEnglishLearningStore((s) => s.translationHistory);
  const setCurrentDay = useEnglishLearningStore((s) => s.setCurrentDay);
  const markDayCompleted = useEnglishLearningStore((s) => s.markDayCompleted);
  const addCustomImageCard = useEnglishLearningStore((s) => s.addCustomImageCard);
  const deleteCustomImageCard = useEnglishLearningStore((s) => s.deleteCustomImageCard);
  const incrementScore = useEnglishLearningStore((s) => s.incrementScore);
  const addTranslationHistory = useEnglishLearningStore((s) => s.addTranslationHistory);
  const deleteTranslationHistory = useEnglishLearningStore((s) => s.deleteTranslationHistory);
  const clearTranslationHistory = useEnglishLearningStore((s) => s.clearTranslationHistory);

  // Active Day Lesson
  const activeLesson =
    DAILY_PRACTICE_CURRICULUM.find((d) => d.dayNumber === currentDay) ||
    DAILY_PRACTICE_CURRICULUM[0];

  // Topics Catalog State
  const [topicSearch, setTopicSearch] = useState('');
  const [selectedTopicCat, setSelectedTopicCat] = useState<string>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('be-verbs');

  // Filtered Topics
  const filteredTopics = ALL_ENGLISH_TOPICS.filter((topic) => {
    if (selectedTopicCat === 'be_verbs') {
      if (topic.id !== 'be-verbs') return false;
    } else if (selectedTopicCat !== 'all' && topic.category !== selectedTopicCat) {
      return false;
    }
    if (topicSearch.trim()) {
      const q = topicSearch.toLowerCase();
      const matchTitle =
        topic.titleEn.toLowerCase().includes(q) || topic.titleTa.toLowerCase().includes(q);
      const matchSumm = topic.summaryTa.toLowerCase().includes(q);
      const matchDetails = topic.details.some(
        (d) =>
          d.heading.toLowerCase().includes(q) || d.descriptionTa.toLowerCase().includes(q)
      );
      return matchTitle || matchSumm || matchDetails;
    }
    return true;
  });

  // Image Upload & AI Detection State
  const [pickedImageUri, setPickedImageUri] = useState<string | null>(null);
  const [customEnglish, setCustomEnglish] = useState('');
  const [customTamil, setCustomTamil] = useState('');
  const [customSentenceEn, setCustomSentenceEn] = useState('');
  const [customSentenceTa, setCustomSentenceTa] = useState('');
  const [isDetectingImage, setIsDetectingImage] = useState(false);

  // Quiz State
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [speakingId, setSpeakingId] = useState<string | null>(null);

  // Translator State
  const [translateInput, setTranslateInput] = useState('');
  const [translateDirection, setTranslateDirection] = useState<'en-to-ta' | 'ta-to-en'>('en-to-ta');
  const [translatedResult, setTranslatedResult] = useState<TranslationResult | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const QUICK_SAMPLES = [
    { en: 'I am learning English daily', ta: 'நான் தினமும் ஆங்கிலம் கற்கிறேன்' },
    { en: 'He is in a meeting right now', ta: 'அவன் இப்போது கூட்டத்தில் இருக்கிறான்' },
    { en: 'Where are you going?', ta: 'நீங்கள் எங்கே செல்கிறீர்கள்?' },
    { en: 'We were very busy yesterday', ta: 'நாங்கள் நேற்று மிகவும் பிசியாக இருந்தோம்' },
    { en: 'Can you help me with this?', ta: 'எனக்கு இதில் உதவ முடியுமா?' },
  ];

  const speakText = (text: string, id?: string, lang: 'en-US' | 'ta-IN' = 'en-US') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      Speech.stop();
      if (id) setSpeakingId(id);
      Speech.speak(text, {
        language: lang,
        pitch: 1.0,
        rate: 0.88,
        onDone: () => setSpeakingId(null),
        onError: () => setSpeakingId(null),
      });
    } catch {
      setSpeakingId(null);
    }
  };

  const handleTranslate = async (textToTranslate?: string) => {
    const text = textToTranslate !== undefined ? textToTranslate : translateInput;
    if (!text.trim()) {
      Alert.alert('Empty Input', 'தயவுசெய்து மொழிபெயர்க்க வேண்டிய சொல் அல்லது வாக்கியத்தை உள்ளிடவும்.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsTranslating(true);
    try {
      const res = await TranslationService.translate(text, translateDirection);
      setTranslatedResult(res);
      if (res.translatedText && !res.translatedText.includes('தோல்வியடைந்தது')) {
        addTranslationHistory({
          id: Date.now().toString(),
          sourceText: res.sourceText,
          translatedText: res.translatedText,
          sourceLang: res.sourceLang,
          targetLang: res.targetLang,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          beVerbNote: res.beVerbNote,
        });
      }
    } catch {
      Alert.alert('Error', 'மொழிபெயர்ப்பில் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.');
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    try {
      await Clipboard.setStringAsync(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const handlePickImage = async (useCamera = false) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(options)
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setPickedImageUri(uri);
        autoDetectImageLabels(uri);
      }
    } catch (e) {
      Alert.alert('Image Error', 'Could not access photo library or camera.');
    }
  };

  const autoDetectImageLabels = async (_uri: string) => {
    setIsDetectingImage(true);
    try {
      const detected = await AIService.detectVisualObject();
      setCustomEnglish(detected.english);
      setCustomTamil(detected.tamil);
      setCustomSentenceEn(detected.englishSentence);
      setCustomSentenceTa(detected.tamilSentence);
    } catch {
      setCustomEnglish('Camera Snapshot');
      setCustomTamil('புகைப்படப் பதிவு');
      setCustomSentenceEn('This is a picture captured for English practice.');
      setCustomSentenceTa('இது ஆங்கிலப் பயிற்சிக்காக எடுக்கப்பட்ட ஒரு புகைப்படம்.');
    } finally {
      setIsDetectingImage(false);
    }
  };

  const handleSaveScannedCard = () => {
    if (!pickedImageUri || !customEnglish.trim() || !customTamil.trim()) {
      Alert.alert('Incomplete Card', 'Please provide an image, English name, and Mother Language (Tamil) translation.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    const newCard: VisualVocabularyItem = {
      id: `img-${Date.now()}`,
      english: customEnglish.trim(),
      tamil: customTamil.trim(),
      phonetic: customEnglish.trim().toUpperCase(),
      partOfSpeech: 'Noun (பெயர்ச்சொல்)',
      imageUrl: pickedImageUri,
      englishSentence: customSentenceEn.trim() || `I see a ${customEnglish.trim()} here.`,
      tamilSentence: customSentenceTa.trim() || `இங்கு நான் ஒரு ${customTamil.trim()} பார்க்கிறேன்.`,
    };

    addCustomImageCard(newCard);
    setPickedImageUri(null);
    setCustomEnglish('');
    setCustomTamil('');
    setCustomSentenceEn('');
    setCustomSentenceTa('');
    Alert.alert('Saved to Visual Library 🎉', 'Your image card with Mother Language & Learning Language is saved!');
  };

  const handleQuizAnswer = (qIndex: number, optionIndex: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setSelectedAnswers((prev) => ({ ...prev, [qIndex]: optionIndex }));

    const question = activeLesson.practiceExercise[qIndex];
    if (question && question.correctIndex === optionIndex) {
      incrementScore(10);
    }
  };

  const isDayCompleted = completedDays.includes(currentDay);

  const handleCompleteDay = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    markDayCompleted(currentDay);
    Alert.alert(
      'Day Complete! 🌟',
      `Awesome job completing Day ${currentDay}! Keep up your daily streak (${streakDays + 1} days).`
    );
  };

  const allDisplayImageCards = [...customImageCards, ...VISUAL_OBJECT_CARDS];

  return (
    <Modal
      visible={isModalVisible}
      animationType="slide"
      transparent
      onRequestClose={handleModalClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.sheetContainer}>
          {/* Top Handle */}
          <View style={styles.dragHandle} />

          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerTitle}>English Daily Practice 🇬🇧</Text>
                <Badge label={`Day ${currentDay} Active ⚡`} variant="primary" />
              </View>
              <Text style={styles.headerSubtitle}>
                தமிழ் வழி ஆங்கிலம் • Mother Tongue & Learning Language Guide
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={handleModalClose}>
              <Ionicons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Streak & Score Bar */}
          <View style={styles.statusBar}>
            <View style={styles.statusBox}>
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text style={styles.statusNum}>{streakDays} Days</Text>
              <Text style={styles.statusLabel}>Streak</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusBox}>
              <Ionicons name="trophy" size={16} color="#10B981" />
              <Text style={[styles.statusNum, { color: '#10B981' }]}>{totalScore} pts</Text>
              <Text style={styles.statusLabel}>XP Score</Text>
            </View>
            <View style={styles.statusDivider} />
            <View style={styles.statusBox}>
              <Ionicons name="checkmark-done-circle" size={16} color="#38BDF8" />
              <Text style={[styles.statusNum, { color: '#38BDF8' }]}>
                {completedDays.length}/30
              </Text>
              <Text style={styles.statusLabel}>Completed</Text>
            </View>
          </View>

          {/* Navigation Segmented Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.tabScrollWrap}
            contentContainerStyle={styles.tabBar}
          >
            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'daily_guide' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('daily_guide');
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={13}
                color={activeTab === 'daily_guide' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[styles.tabBtnText, activeTab === 'daily_guide' && styles.tabBtnTextActive]}
              >
                Day Guide
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'all_topics' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('all_topics');
              }}
            >
              <Ionicons
                name="library-outline"
                size={13}
                color={activeTab === 'all_topics' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[styles.tabBtnText, activeTab === 'all_topics' && styles.tabBtnTextActive]}
              >
                Topics 📚
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'sentence_builder' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('sentence_builder');
              }}
            >
              <Ionicons
                name="shapes-outline"
                size={13}
                color={activeTab === 'sentence_builder' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[
                  styles.tabBtnText,
                  activeTab === 'sentence_builder' && styles.tabBtnTextActive,
                ]}
              >
                Builder 🧩
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'ai_chat' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('ai_chat');
              }}
            >
              <Ionicons
                name="chatbubbles-outline"
                size={13}
                color={activeTab === 'ai_chat' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[styles.tabBtnText, activeTab === 'ai_chat' && styles.tabBtnTextActive]}
              >
                AI Partner 🤖
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'translator' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('translator');
              }}
            >
              <Ionicons
                name="language-outline"
                size={13}
                color={activeTab === 'translator' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[styles.tabBtnText, activeTab === 'translator' && styles.tabBtnTextActive]}
              >
                Translate 🌐
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'image_learning' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('image_learning');
              }}
            >
              <Ionicons
                name="image-outline"
                size={13}
                color={activeTab === 'image_learning' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text
                style={[styles.tabBtnText, activeTab === 'image_learning' && styles.tabBtnTextActive]}
              >
                Image 📸
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabBtn, activeTab === 'quiz' && styles.tabBtnActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setActiveTab('quiz');
              }}
            >
              <Ionicons
                name="help-circle-outline"
                size={13}
                color={activeTab === 'quiz' ? '#FFFFFF' : Colors.textMuted}
              />
              <Text style={[styles.tabBtnText, activeTab === 'quiz' && styles.tabBtnTextActive]}>
                Quiz 🎯
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* ========================================================= */}
          {/* TAB 1: DAY-BY-DAY PRACTICE GUIDE */}
          {/* ========================================================= */}
          {activeTab === 'daily_guide' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Day Selector Carousel */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.daySelectorScroll}
                contentContainerStyle={styles.daySelectorContent}
              >
                {DAILY_PRACTICE_CURRICULUM.map((lesson) => {
                  const isSelected = lesson.dayNumber === currentDay;
                  const isDone = completedDays.includes(lesson.dayNumber);
                  return (
                    <TouchableOpacity
                      key={lesson.dayNumber}
                      style={[
                        styles.dayChip,
                        isSelected && styles.dayChipSelected,
                        isDone && styles.dayChipDone,
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setCurrentDay(lesson.dayNumber);
                      }}
                    >
                      <Text style={[styles.dayChipNum, isSelected && styles.dayChipNumSelected]}>
                        Day {lesson.dayNumber}
                      </Text>
                      {isDone ? (
                        <Ionicons name="checkmark-circle" size={13} color="#10B981" />
                      ) : isSelected ? (
                        <View style={styles.activeDot} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Lesson Theme Banner */}
              <GlassCard style={styles.lessonBanner} variant="elevated">
                <View style={styles.lessonBannerTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.lessonTitleEn}>{activeLesson.titleEnglish}</Text>
                    <Text style={styles.lessonTitleTa}>{activeLesson.titleTamil}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.speakerCircle}
                    onPress={() => speakText(activeLesson.titleEnglish, 'title')}
                  >
                    <Ionicons
                      name={speakingId === 'title' ? 'volume-high' : 'volume-medium-outline'}
                      size={18}
                      color="#38BDF8"
                    />
                  </TouchableOpacity>
                </View>
                <Text style={styles.lessonDesc}>{activeLesson.description}</Text>
                <View style={styles.grammarPill}>
                  <Ionicons name="sparkles" size={12} color="#F59E0B" />
                  <Text style={styles.grammarPillText}>Focus: {activeLesson.grammarFocus}</Text>
                </View>
              </GlassCard>

              {/* Section 1: Vocabulary with Mother Language */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="text-outline" size={16} color="#38BDF8" />
                  <Text style={styles.sectionTitle}>Key Words • முக்கிய சொற்கள்</Text>
                </View>

                {activeLesson.vocabulary.map((v, i) => (
                  <View key={i} style={styles.vocabCard}>
                    <View style={styles.vocabTop}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Text style={styles.vocabEnglish}>{v.english}</Text>
                          <Text style={styles.vocabPhonetic}>/{v.pronunciation}/</Text>
                        </View>
                        <Text style={styles.vocabTamil}>{v.tamil}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.speakerBtn}
                        onPress={() => speakText(v.english, `vocab-${i}`)}
                      >
                        <Ionicons
                          name={speakingId === `vocab-${i}` ? 'volume-high' : 'volume-medium-outline'}
                          size={18}
                          color="#38BDF8"
                        />
                      </TouchableOpacity>
                    </View>

                    <View style={styles.vocabExampleBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.exampleEn}>"{v.example}"</Text>
                        <Text style={styles.exampleTa}>"{v.exampleTamil}"</Text>
                      </View>
                      <TouchableOpacity
                        style={{ padding: 4 }}
                        onPress={() => speakText(v.example, `ex-${i}`)}
                      >
                        <Ionicons
                          name={speakingId === `ex-${i}` ? 'volume-high' : 'volume-medium-outline'}
                          size={15}
                          color="#94A3B8"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>

              {/* Section 2: Real-Life Dialogue */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="chatbubbles-outline" size={16} color="#A855F7" />
                  <Text style={styles.sectionTitle}>Real Dialogue • நேரடி உரையாடல்</Text>
                </View>

                <View style={styles.dialogueBox}>
                  {activeLesson.conversationDialogue.map((dlg, i) => (
                    <View key={i} style={styles.dialogueItem}>
                      <View style={styles.dialogueTop}>
                        <Text style={styles.speakerLabel}>{dlg.speaker}</Text>
                        <TouchableOpacity
                          style={{ padding: 4 }}
                          onPress={() => speakText(dlg.english, `dlg-${i}`)}
                        >
                          <Ionicons
                            name={speakingId === `dlg-${i}` ? 'volume-high' : 'volume-medium-outline'}
                            size={16}
                            color="#38BDF8"
                          />
                        </TouchableOpacity>
                      </View>
                      <Text style={styles.dialogueEn}>{dlg.english}</Text>
                      <Text style={styles.dialogueTa}>{dlg.tamil}</Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Complete Day CTA */}
              <TouchableOpacity
                style={[styles.completeDayBtn, isDayCompleted && styles.completeDayBtnDone]}
                activeOpacity={0.8}
                onPress={handleCompleteDay}
              >
                <Ionicons
                  name={isDayCompleted ? 'checkmark-circle' : 'ribbon-outline'}
                  size={18}
                  color="#FFFFFF"
                />
                <Text style={styles.completeDayBtnText}>
                  {isDayCompleted ? `Day ${currentDay} Completed! ✓` : `Mark Day ${currentDay} Completed (+100 XP)`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}

          {/* ========================================================= */}
          {/* TAB 2: ALL TOPICS CATALOG (BE VERBS, GRAMMAR, SPOKEN, VOCAB) */}
          {/* ========================================================= */}
          {activeTab === 'all_topics' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Intro Banner */}
              <GlassCard style={styles.topicsIntroBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.topicHeaderIcon}>
                    <Ionicons name="school" size={20} color="#38BDF8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.topicsIntroTitle}>English Master Topics 📚</Text>
                    <Text style={styles.topicsIntroSub}>
                      Be Verbs, Tenses, Grammar, Spoken & Vocabulary • தமிழ் விளக்கம் & Audio
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Search Bar */}
              <View style={styles.topicSearchContainer}>
                <Ionicons name="search" size={16} color={Colors.textMuted} />
                <TextInput
                  style={styles.topicSearchInput}
                  placeholder="Search topics (e.g. be verb, tense, standup)..."
                  placeholderTextColor={Colors.textMuted}
                  value={topicSearch}
                  onChangeText={setTopicSearch}
                />
                {topicSearch.length > 0 && (
                  <TouchableOpacity onPress={() => setTopicSearch('')}>
                    <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category Filter Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.catScroll}
                contentContainerStyle={styles.catScrollContent}
              >
                {[
                  { id: 'all', label: `All (${ALL_ENGLISH_TOPICS.length})` },
                  { id: 'be_verbs', label: 'Be Verbs ⚡' },
                  { id: 'grammar', label: 'Grammar 📝' },
                  { id: 'spoken', label: 'Spoken English 🗣️' },
                  { id: 'vocabulary', label: 'Vocabulary 📖' },
                  { id: 'pronunciation', label: 'Pronunciation 🎙️' },
                ].map((cat) => {
                  const isCatSelected = selectedTopicCat === cat.id;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, isCatSelected && styles.catChipActive]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                        setSelectedTopicCat(cat.id);
                      }}
                    >
                      <Text style={[styles.catChipText, isCatSelected && styles.catChipTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* Topics List */}
              {filteredTopics.length === 0 ? (
                <View style={styles.emptyTopicWrap}>
                  <Ionicons name="search-outline" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyTopicText}>பொருத்தமான தலைப்பு கிடைக்கவில்லை</Text>
                  <TouchableOpacity
                    style={styles.resetSearchBtn}
                    onPress={() => {
                      setTopicSearch('');
                      setSelectedTopicCat('all');
                    }}
                  >
                    <Text style={styles.resetSearchBtnText}>Reset Filters</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                filteredTopics.map((topic) => {
                  const isExpanded = expandedTopicId === topic.id;
                  return (
                    <View key={topic.id} style={styles.topicCard}>
                      {/* Topic Card Header */}
                      <TouchableOpacity
                        style={styles.topicHeaderTouchable}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setExpandedTopicId(isExpanded ? null : topic.id);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.topicTagRow}>
                            <Badge
                              label={topic.category.toUpperCase()}
                              variant={topic.id === 'be-verbs' ? 'gold' : 'primary'}
                            />
                            <Badge label={topic.level} variant="neutral" />
                            {topic.id === 'be-verbs' && (
                              <View style={styles.highlightBadge}>
                                <Text style={styles.highlightBadgeText}>Must Learn ⭐</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.topicTitleEn}>{topic.titleEn}</Text>
                          <Text style={styles.topicTitleTa}>{topic.titleTa}</Text>
                        </View>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#38BDF8"
                          style={{ marginLeft: 8 }}
                        />
                      </TouchableOpacity>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <View style={styles.topicExpandedBody}>
                          {/* Tamil Summary */}
                          <View style={styles.summaryBox}>
                            <Ionicons
                              name="information-circle"
                              size={16}
                              color="#38BDF8"
                              style={{ marginTop: 2 }}
                            />
                            <Text style={styles.summaryTextTa}>{topic.summaryTa}</Text>
                          </View>

                          {/* Formula / Golden Rule */}
                          {topic.formulaOrRule && (
                            <View style={styles.formulaBox}>
                              <Ionicons name="flash" size={14} color="#F59E0B" />
                              <View style={{ flex: 1 }}>
                                <Text style={styles.formulaTitle}>Formula / சூத்திரம்:</Text>
                                <Text style={styles.formulaText}>{topic.formulaOrRule}</Text>
                              </View>
                            </View>
                          )}

                          {/* Subsections */}
                          {topic.details.map((detail, dIdx) => (
                            <View key={dIdx} style={styles.topicDetailSection}>
                              <Text style={styles.detailHeading}>{detail.heading}</Text>
                              <Text style={styles.detailDescTa}>{detail.descriptionTa}</Text>

                              {/* Rules */}
                              {detail.rules && detail.rules.length > 0 && (
                                <View style={styles.rulesList}>
                                  {detail.rules.map((rule, rIdx) => (
                                    <View key={rIdx} style={styles.ruleItem}>
                                      <Text style={styles.ruleBullet}>•</Text>
                                      <Text style={styles.ruleText}>{rule}</Text>
                                    </View>
                                  ))}
                                </View>
                              )}

                              {/* Examples with Audio */}
                              <View style={styles.examplesContainer}>
                                {detail.examples.map((ex, exIdx) => {
                                  const speakKey = `${topic.id}-${dIdx}-${exIdx}`;
                                  const isSpeaking = speakingId === speakKey;
                                  return (
                                    <View key={exIdx} style={styles.topicExampleCard}>
                                      <View style={styles.exampleTopRow}>
                                        <View style={{ flex: 1 }}>
                                          <Text style={styles.exampleSentenceEn}>{ex.en}</Text>
                                          <Text style={styles.exampleSentenceTa}>{ex.ta}</Text>
                                        </View>
                                        <TouchableOpacity
                                          style={[
                                            styles.topicAudioBtn,
                                            isSpeaking && styles.topicAudioBtnActive,
                                          ]}
                                          onPress={() => speakText(ex.en, speakKey)}
                                        >
                                          <Ionicons
                                            name={
                                              isSpeaking
                                                ? 'volume-high'
                                                : 'volume-medium-outline'
                                            }
                                            size={16}
                                            color={isSpeaking ? '#FFFFFF' : '#38BDF8'}
                                          />
                                        </TouchableOpacity>
                                      </View>
                                      {ex.breakdown && (
                                        <View style={styles.breakdownBox}>
                                          <Text style={styles.breakdownText}>💡 {ex.breakdown}</Text>
                                        </View>
                                      )}
                                    </View>
                                  );
                                })}
                              </View>
                            </View>
                          ))}

                          {/* Common Mistakes */}
                          {topic.commonMistakes && topic.commonMistakes.length > 0 && (
                            <View style={styles.mistakesSection}>
                              <View style={styles.mistakesHeader}>
                                <Ionicons name="warning" size={15} color="#EF4444" />
                                <Text style={styles.mistakesTitle}>
                                  Common Mistakes & Tamil Fixes ⚠️
                                </Text>
                              </View>
                              {topic.commonMistakes.map((m, mIdx) => (
                                <View key={mIdx} style={styles.mistakeCard}>
                                  <View style={styles.mistakeRow}>
                                    <Text style={styles.wrongLabel}>❌ Wrong:</Text>
                                    <Text style={styles.wrongText}>{m.wrong}</Text>
                                  </View>
                                  <View style={styles.mistakeRow}>
                                    <Text style={styles.rightLabel}>✅ Right:</Text>
                                    <Text style={styles.rightText}>{m.right}</Text>
                                  </View>
                                  <Text style={styles.whyText}>💡 {m.why}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          )}

          {/* ========================================================= */}
          {/* TAB 3: SENTENCE BUILDER & BE VERB DRILLS */}
          {/* ========================================================= */}
          {activeTab === 'sentence_builder' && <SentenceBuilderView />}

          {/* ========================================================= */}
          {/* TAB 4: AI CONVERSATION ROLEPLAY PARTNER */}
          {/* ========================================================= */}
          {activeTab === 'ai_chat' && <AiEnglishChatPartnerView />}

          {/* ========================================================= */}
          {/* TAB 5: TRANSLATOR (ENGLISH ⇄ TAMIL ANY WORD / CONTENT) */}
          {/* ========================================================= */}
          {activeTab === 'translator' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Intro Banner */}
              <GlassCard style={styles.translatorBanner}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={styles.translatorIconBox}>
                    <Ionicons name="language" size={20} color="#38BDF8" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.translatorBannerTitle}>Universal Translator 🌐</Text>
                    <Text style={styles.translatorBannerSub}>
                      எந்த சொல் அல்லது பெரிய வாக்கியம் கொடுத்தாலும் உடனே தமிழ் ⇄ ஆங்கில மொழிபெயர்ப்பு
                    </Text>
                  </View>
                </View>
              </GlassCard>

              {/* Language Switcher Bar */}
              <View style={styles.directionSwitcherBar}>
                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>
                    {translateDirection === 'en-to-ta' ? 'English (ஆங்கிலம்)' : 'தமிழ் (Mother Tongue)'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.swapDirectionBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                    setTranslateDirection((d) => (d === 'en-to-ta' ? 'ta-to-en' : 'en-to-ta'));
                    if (translatedResult?.translatedText) {
                      setTranslateInput(translatedResult.translatedText);
                    }
                    setTranslatedResult(null);
                  }}
                >
                  <Ionicons name="swap-horizontal" size={18} color="#FFFFFF" />
                </TouchableOpacity>

                <View style={styles.langBadge}>
                  <Text style={styles.langBadgeText}>
                    {translateDirection === 'en-to-ta' ? 'தமிழ் (Mother Tongue)' : 'English (ஆங்கிலம்)'}
                  </Text>
                </View>
              </View>

              {/* Input Card with TextArea */}
              <GlassCard style={styles.translatorInputCard}>
                <View style={styles.inputCardHeader}>
                  <Text style={styles.inputCardLabel}>
                    {translateDirection === 'en-to-ta'
                      ? 'Type English word or content:'
                      : 'தமிழ் சொல் அல்லது வாக்கியத்தை உள்ளிடவும்:'}
                  </Text>
                  {translateInput.length > 0 && (
                    <TouchableOpacity onPress={() => setTranslateInput('')}>
                      <Text style={styles.clearInputText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <TextInput
                  style={styles.translatorTextInput}
                  placeholder={
                    translateDirection === 'en-to-ta'
                      ? 'Enter word, sentence, or paragraph (e.g. I am going to office, He was busy yesterday)...'
                      : 'சொல் அல்லது வாக்கியத்தை எழுதுங்கள் (எ.கா: நான் வேலை செய்கிறேன், நாளை மீட்டிங்)...'
                  }
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  value={translateInput}
                  onChangeText={setTranslateInput}
                />

                {/* Translate CTA Button */}
                <TouchableOpacity
                  style={[
                    styles.translateActionBtn,
                    (!translateInput.trim() || isTranslating) && styles.translateActionBtnDisabled,
                  ]}
                  disabled={!translateInput.trim() || isTranslating}
                  onPress={() => handleTranslate()}
                >
                  {isTranslating ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                      <Text style={styles.translateActionBtnText}>Translate Now ⚡</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </GlassCard>

              {/* Quick Suggestion Chips */}
              <View style={styles.quickChipsSection}>
                <Text style={styles.quickChipsLabel}>Quick Examples (மாதிரிகள்):</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 4 }}>
                  {QUICK_SAMPLES.map((sample, sIdx) => {
                    const sampleText = translateDirection === 'en-to-ta' ? sample.en : sample.ta;
                    return (
                      <TouchableOpacity
                        key={sIdx}
                        style={styles.quickSampleChip}
                        onPress={() => {
                          setTranslateInput(sampleText);
                          handleTranslate(sampleText);
                        }}
                      >
                        <Text style={styles.quickSampleChipText}>{sampleText}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Translated Output Card */}
              {translatedResult && (
                <GlassCard style={styles.resultCard} variant="elevated">
                  <View style={styles.resultHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                      <Text style={styles.resultHeaderTitle}>
                        {translatedResult.targetLang === 'ta' ? 'தமிழ் மொழிபெயர்ப்பு' : 'English Translation'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {/* Audio Button */}
                      <TouchableOpacity
                        style={styles.resultToolBtn}
                        onPress={() => {
                          const textToSpeak =
                            translatedResult.targetLang === 'en'
                              ? translatedResult.translatedText
                              : translatedResult.sourceText;
                          speakText(textToSpeak, 'translation-result');
                        }}
                      >
                        <Ionicons name="volume-high" size={16} color="#38BDF8" />
                      </TouchableOpacity>
                      {/* Copy Button */}
                      <TouchableOpacity
                        style={styles.resultToolBtn}
                        onPress={() => copyToClipboard(translatedResult.translatedText, 'result')}
                      >
                        <Ionicons
                          name={copiedKey === 'result' ? 'checkmark' : 'copy-outline'}
                          size={15}
                          color={copiedKey === 'result' ? '#10B981' : Colors.textMuted}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Translated Text Main */}
                  <Text style={styles.resultTranslatedText}>{translatedResult.translatedText}</Text>

                  {/* Original Source Quote */}
                  <View style={styles.sourceQuoteBox}>
                    <Text style={styles.sourceQuoteLabel}>Original:</Text>
                    <Text style={styles.sourceQuoteText}>{translatedResult.sourceText}</Text>
                  </View>

                  {/* Grammar / Be Verb Note if detected */}
                  {translatedResult.beVerbNote && (
                    <View style={styles.grammarDetectedBox}>
                      <Ionicons name="flash" size={14} color="#F59E0B" />
                      <Text style={styles.grammarDetectedText}>{translatedResult.beVerbNote}</Text>
                    </View>
                  )}
                </GlassCard>
              )}

              {/* Recent Translation History */}
              {translationHistory.length > 0 && (
                <View style={styles.historySection}>
                  <View style={styles.historyHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="time-outline" size={15} color={Colors.textMuted} />
                      <Text style={styles.historyTitle}>Recent Translations ({translationHistory.length})</Text>
                    </View>
                    <TouchableOpacity onPress={clearTranslationHistory}>
                      <Text style={styles.clearHistoryBtn}>Clear All</Text>
                    </TouchableOpacity>
                  </View>

                  {translationHistory.slice(0, 8).map((hist) => (
                    <View key={hist.id} style={styles.historyItemCard}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <Badge
                            label={hist.sourceLang === 'en' ? 'EN ➔ TA' : 'TA ➔ EN'}
                            variant="cyan"
                          />
                          <Text style={styles.historyTime}>{hist.timestamp}</Text>
                        </View>
                        <Text style={styles.historySourceText}>{hist.sourceText}</Text>
                        <Text style={styles.historyTranslatedText}>{hist.translatedText}</Text>
                        {hist.beVerbNote && (
                          <Text style={styles.historyBeNote}>{hist.beVerbNote}</Text>
                        )}
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <TouchableOpacity
                          style={styles.historySmallBtn}
                          onPress={() => {
                            const textToSpeak = hist.sourceLang === 'en' ? hist.sourceText : hist.translatedText;
                            speakText(textToSpeak, hist.id);
                          }}
                        >
                          <Ionicons name="volume-medium-outline" size={15} color="#38BDF8" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.historySmallBtn}
                          onPress={() => deleteTranslationHistory(hist.id)}
                        >
                          <Ionicons name="trash-outline" size={14} color={Colors.textMuted} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {/* ========================================================= */}
          {/* TAB 4: IMAGE LEARNER (MOTHER TONGUE & LEARNING LANGUAGE) */}
          {/* ========================================================= */}
          {activeTab === 'image_learning' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Photo Upload & AI Scanner Card */}
              <GlassCard style={styles.uploadCard} variant="elevated">
                <Text style={styles.uploadCardTitle}>Take or Upload Photo 📷</Text>
                <Text style={styles.uploadCardSub}>
                  Take a photo of any real object (coffee, laptop, book, shoes) and get its English & Mother Language (Tamil) word!
                </Text>

                <View style={styles.actionBtnRow}>
                  <TouchableOpacity
                    style={styles.photoActionBtn}
                    onPress={() => handlePickImage(true)}
                  >
                    <Ionicons name="camera" size={16} color="#FFFFFF" />
                    <Text style={styles.photoActionBtnText}>Take Photo</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.photoActionBtn, { backgroundColor: '#38BDF8' }]}
                    onPress={() => handlePickImage(false)}
                  >
                    <Ionicons name="images" size={16} color="#0E0F14" />
                    <Text style={[styles.photoActionBtnText, { color: '#0E0F14' }]}>Choose Gallery</Text>
                  </TouchableOpacity>
                </View>

                {/* Scanned/Picked Image Preview */}
                {pickedImageUri && (
                  <View style={styles.previewContainer}>
                    <Image source={{ uri: pickedImageUri }} style={styles.previewImage} />

                    {isDetectingImage ? (
                      <View style={styles.detectingWrap}>
                        <ActivityIndicator size="small" color="#38BDF8" />
                        <Text style={styles.detectingText}>Detecting object with AI...</Text>
                      </View>
                    ) : (
                      <View style={styles.detectedDetails}>
                        <View style={styles.detectedHeader}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.learningLangLabel}>LEARNING LANGUAGE (ENGLISH)</Text>
                            <TextInput
                              style={styles.detectedInputEn}
                              value={customEnglish}
                              onChangeText={setCustomEnglish}
                              placeholder="English Word (e.g. Coffee Mug)"
                              placeholderTextColor={Colors.textMuted}
                            />
                          </View>
                          <TouchableOpacity
                            style={styles.speakerCircle}
                            onPress={() => customEnglish && speakText(customEnglish, 'custom')}
                          >
                            <Ionicons name="volume-high" size={18} color="#38BDF8" />
                          </TouchableOpacity>
                        </View>

                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.motherLangLabel}>MOTHER LANGUAGE (தமிழ் - TAMIL)</Text>
                          <TextInput
                            style={styles.detectedInputTa}
                            value={customTamil}
                            onChangeText={setCustomTamil}
                            placeholder="தமிழ் சொல் (e.g. காபி கோப்பை)"
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>

                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.motherLangLabel}>PRACTICE SENTENCE (ENGLISH)</Text>
                          <TextInput
                            style={styles.detectedInputEn}
                            value={customSentenceEn}
                            onChangeText={setCustomSentenceEn}
                            placeholder="English sentence..."
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>

                        <View style={{ marginTop: 8 }}>
                          <Text style={styles.motherLangLabel}>SENTENCE MEANING (தமிழ்)</Text>
                          <TextInput
                            style={styles.detectedInputTa}
                            value={customSentenceTa}
                            onChangeText={setCustomSentenceTa}
                            placeholder="வாக்கியத்தின் தமிழ் அர்த்தம்..."
                            placeholderTextColor={Colors.textMuted}
                          />
                        </View>

                        <TouchableOpacity
                          style={styles.saveCardBtn}
                          onPress={handleSaveScannedCard}
                        >
                          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                          <Text style={styles.saveCardBtnText}>Save to Visual Library (+25 XP)</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                )}
              </GlassCard>

              {/* Visual Flashcards List */}
              <View style={styles.sectionWrap}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="albums-outline" size={16} color="#10B981" />
                  <Text style={styles.sectionTitle}>
                    Visual Everyday Library ({allDisplayImageCards.length} Objects)
                  </Text>
                </View>

                {allDisplayImageCards.map((card) => (
                  <View key={card.id} style={styles.visualCard}>
                    {/* The Image */}
                    <Image source={{ uri: card.imageUrl }} style={styles.visualCardImage} />

                    {/* Under the Image: Learning Language & Mother Language */}
                    <View style={styles.visualCardBody}>
                      {/* English / Learning Language */}
                      <View style={styles.langRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardEnglishTitle}>{card.english}</Text>
                          <Text style={styles.cardPhonetic}>/{card.phonetic}/</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.speakerBtn}
                          onPress={() => speakText(card.english, card.id)}
                        >
                          <Ionicons
                            name={speakingId === card.id ? 'volume-high' : 'volume-medium-outline'}
                            size={18}
                            color="#38BDF8"
                          />
                        </TouchableOpacity>
                      </View>

                      {/* Mother Language (Tamil) */}
                      <View style={styles.motherLangBox}>
                        <Text style={styles.motherLangBadge}>தாய்மொழி (Tamil)</Text>
                        <Text style={styles.cardTamilTitle}>{card.tamil}</Text>
                      </View>

                      {/* Example Sentences */}
                      <View style={styles.cardSentenceBox}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cardSentenceEn}>"{card.englishSentence}"</Text>
                          <Text style={styles.cardSentenceTa}>"{card.tamilSentence}"</Text>
                        </View>
                        <TouchableOpacity
                          style={{ padding: 4 }}
                          onPress={() => speakText(card.englishSentence, `sen-${card.id}`)}
                        >
                          <Ionicons
                            name={speakingId === `sen-${card.id}` ? 'volume-high' : 'volume-medium-outline'}
                            size={16}
                            color="#38BDF8"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>
          )}

          {/* ========================================================= */}
          {/* TAB 3: PRACTICE QUIZ */}
          {/* ========================================================= */}
          {activeTab === 'quiz' && (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              <View style={styles.quizHeaderCard}>
                <Text style={styles.quizHeaderTitle}>Day {currentDay} Checkpoint 🎯</Text>
                <Text style={styles.quizHeaderSub}>
                  Answer the quick test to lock in your daily English vocabulary!
                </Text>
              </View>

              {activeLesson.practiceExercise.map((q, qIndex) => {
                const selectedOption = selectedAnswers[qIndex];
                const hasAnswered = selectedOption !== undefined;
                const isCorrect = hasAnswered && selectedOption === q.correctIndex;

                return (
                  <View key={qIndex} style={styles.questionCard}>
                    <Text style={styles.qNum}>Question {qIndex + 1}</Text>
                    <Text style={styles.qTextEn}>{q.question}</Text>
                    <Text style={styles.qTextTa}>{q.tamilQuestion}</Text>

                    <View style={styles.optionsWrap}>
                      {q.options.map((option, optIdx) => {
                        const isChosen = selectedOption === optIdx;
                        const isThisCorrect = q.correctIndex === optIdx;

                        return (
                          <TouchableOpacity
                            key={optIdx}
                            style={[
                              styles.optionItem,
                              hasAnswered && isThisCorrect ? styles.optionItemCorrect : null,
                              hasAnswered && isChosen && !isThisCorrect ? styles.optionItemWrong : null,
                            ]}
                            disabled={hasAnswered}
                            onPress={() => handleQuizAnswer(qIndex, optIdx)}
                          >
                            <Text style={styles.optionLetter}>
                              {String.fromCharCode(65 + optIdx)}
                            </Text>
                            <Text style={styles.optionText}>{option}</Text>
                            {hasAnswered && isThisCorrect && (
                              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                            )}
                            {hasAnswered && isChosen && !isThisCorrect && (
                              <Ionicons name="close-circle" size={16} color="#EF4444" />
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {hasAnswered && (
                      <View style={[styles.explanationBox, isCorrect ? styles.expBoxCorrect : styles.expBoxWrong]}>
                        <Text style={styles.expTitle}>
                          {isCorrect ? 'Correct! +10 XP 🎉' : 'Explanation:'}
                        </Text>
                        <Text style={styles.expText}>{q.explanation}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F1117',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.md,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.lg,
    paddingVertical: 8,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusBox: {
    flex: 1,
    alignItems: 'center',
  },
  statusNum: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  statusLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  statusDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.full,
    padding: 3,
    marginBottom: Spacing.md,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: Radii.full,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  scrollBody: {
    paddingBottom: Spacing.xl,
  },

  // Day Carousel
  daySelectorScroll: {
    marginBottom: Spacing.md,
  },
  daySelectorContent: {
    gap: 6,
  },
  dayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dayChipSelected: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  dayChipDone: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  dayChipNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  dayChipNumSelected: {
    color: '#38BDF8',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#38BDF8',
  },

  // Lesson Banner
  lessonBanner: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  lessonBannerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  lessonTitleEn: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  lessonTitleTa: {
    fontSize: 12,
    color: '#38BDF8',
    marginTop: 2,
    fontWeight: '600',
  },
  lessonDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    lineHeight: 16,
    marginTop: 6,
  },
  grammarPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  grammarPillText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
  },

  // Section
  sectionWrap: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Vocab Card
  vocabCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  vocabTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vocabEnglish: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  vocabPhonetic: {
    fontSize: 11,
    color: '#38BDF8',
    fontStyle: 'italic',
  },
  vocabTamil: {
    fontSize: 13,
    fontWeight: '700',
    color: '#34D399',
    marginTop: 2,
  },
  speakerBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speakerCircle: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vocabExampleBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radii.md,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  exampleEn: {
    fontSize: 11,
    color: '#E2E8F0',
    fontStyle: 'italic',
  },
  exampleTa: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Dialogue
  dialogueBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 10,
  },
  dialogueItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radii.md,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#A855F7',
  },
  dialogueTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  speakerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#C084FC',
  },
  dialogueEn: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dialogueTa: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Complete Day Button
  completeDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.lg,
    marginTop: Spacing.sm,
  },
  completeDayBtnDone: {
    backgroundColor: '#059669',
  },
  completeDayBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Tab 2: Upload & Image Learner
  uploadCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  uploadCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  uploadCardSub: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 9,
    borderRadius: Radii.md,
  },
  photoActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewContainer: {
    marginTop: 14,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  previewImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  detectingWrap: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  detectingText: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
  },
  detectedDetails: {
    padding: Spacing.md,
  },
  detectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  learningLangLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#38BDF8',
    marginBottom: 4,
  },
  motherLangLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#34D399',
    marginBottom: 4,
  },
  detectedInputEn: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  detectedInputTa: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#34D399',
    fontSize: 13,
    fontWeight: '700',
  },
  saveCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 9,
    borderRadius: Radii.md,
    marginTop: 12,
  },
  saveCardBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Visual Flashcard Card
  visualCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.xl,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  visualCardImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  visualCardBody: {
    padding: Spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardEnglishTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  cardPhonetic: {
    fontSize: 11,
    color: '#38BDF8',
    fontStyle: 'italic',
    marginTop: 1,
  },
  motherLangBox: {
    backgroundColor: 'rgba(52, 211, 153, 0.1)',
    borderRadius: Radii.md,
    padding: 8,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  motherLangBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.5,
  },
  cardTamilTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#34D399',
    marginTop: 2,
  },
  cardSentenceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radii.md,
    padding: 8,
    marginTop: 8,
    gap: 6,
  },
  cardSentenceEn: {
    fontSize: 11,
    color: '#E2E8F0',
    fontStyle: 'italic',
  },
  cardSentenceTa: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // Tab 3: Quiz
  quizHeaderCard: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  quizHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#38BDF8',
  },
  quizHeaderSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  questionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  qNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  qTextEn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  qTextTa: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  optionsWrap: {
    marginTop: 10,
    gap: 6,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  optionItemCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10B981',
  },
  optionItemWrong: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: '#EF4444',
  },
  optionLetter: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38BDF8',
  },
  optionText: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
  },
  explanationBox: {
    borderRadius: Radii.md,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
  },
  expBoxCorrect: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  expBoxWrong: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  expTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  expText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },

  // =========================================================================
  // TOPICS CATALOG STYLES
  // =========================================================================
  topicsIntroBanner: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  topicHeaderIcon: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicsIntroTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topicsIntroSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  topicSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radii.lg,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 8,
  },
  topicSearchInput: {
    flex: 1,
    fontSize: 12,
    color: '#FFFFFF',
  },
  catScroll: {
    marginBottom: Spacing.md,
  },
  catScrollContent: {
    gap: 6,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  catChipTextActive: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  emptyTopicWrap: {
    alignItems: 'center',
    paddingVertical: 36,
    gap: 8,
  },
  emptyTopicText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  resetSearchBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    marginTop: 4,
  },
  resetSearchBtnText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '700',
  },
  topicCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.lg,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    overflow: 'hidden',
  },
  topicHeaderTouchable: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
  },
  topicTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  highlightBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  highlightBadgeText: {
    fontSize: 9,
    color: '#F59E0B',
    fontWeight: '800',
  },
  topicTitleEn: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  topicTitleTa: {
    fontSize: 12,
    color: '#38BDF8',
    fontWeight: '600',
    marginTop: 2,
  },
  topicExpandedBody: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  summaryBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderRadius: Radii.md,
    padding: 10,
    marginTop: 10,
    gap: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
  },
  summaryTextTa: {
    flex: 1,
    fontSize: 12,
    color: '#E0F2FE',
    lineHeight: 18,
  },
  formulaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: Radii.md,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  formulaTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#F59E0B',
    textTransform: 'uppercase',
  },
  formulaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FDE68A',
    marginTop: 2,
  },
  topicDetailSection: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radii.md,
    padding: 10,
  },
  detailHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  detailDescTa: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 16,
    marginBottom: 6,
  },
  rulesList: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: Radii.sm,
    padding: 8,
    gap: 4,
    marginBottom: 8,
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  ruleBullet: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '800',
  },
  ruleText: {
    flex: 1,
    fontSize: 11,
    color: '#CBD5E1',
    lineHeight: 16,
  },
  examplesContainer: {
    gap: 6,
  },
  topicExampleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.md,
    padding: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  exampleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  exampleSentenceEn: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  exampleSentenceTa: {
    fontSize: 11,
    color: '#34D399',
    marginTop: 2,
  },
  topicAudioBtn: {
    width: 30,
    height: 30,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topicAudioBtnActive: {
    backgroundColor: '#38BDF8',
  },
  breakdownBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radii.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 6,
  },
  breakdownText: {
    fontSize: 10,
    color: '#FCD34D',
  },
  mistakesSection: {
    marginTop: Spacing.md,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderRadius: Radii.md,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  mistakesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  mistakesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#EF4444',
  },
  mistakeCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Radii.sm,
    padding: 8,
    marginBottom: 6,
    gap: 3,
  },
  mistakeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wrongLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },
  wrongText: {
    fontSize: 11,
    color: '#FCA5A5',
    textDecorationLine: 'line-through',
  },
  rightLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  rightText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6EE7B7',
  },
  whyText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontStyle: 'italic',
    marginTop: 2,
  },

  tabScrollWrap: {
    marginBottom: Spacing.md,
  },

  // =========================================================================
  // TRANSLATOR STYLES
  // =========================================================================
  translatorBanner: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.06)',
    borderColor: 'rgba(56, 189, 248, 0.2)',
  },
  translatorIconBox: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  translatorBannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  translatorBannerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  directionSwitcherBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.full,
    padding: 4,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langBadge: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  swapDirectionBtn: {
    width: 34,
    height: 34,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  translatorInputCard: {
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  inputCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputCardLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  clearInputText: {
    fontSize: 11,
    color: '#38BDF8',
    fontWeight: '600',
  },
  translatorTextInput: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    color: '#FFFFFF',
    fontSize: 14,
    minHeight: 88,
    textAlignVertical: 'top',
  },
  translateActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: Radii.full,
    paddingVertical: 12,
    marginTop: 10,
    gap: 6,
  },
  translateActionBtnDisabled: {
    opacity: 0.5,
  },
  translateActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  quickChipsSection: {
    marginBottom: Spacing.md,
  },
  quickChipsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  quickSampleChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  quickSampleChipText: {
    fontSize: 11,
    color: '#E2E8F0',
  },
  resultCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    backgroundColor: 'rgba(16, 185, 129, 0.06)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10B981',
    textTransform: 'uppercase',
  },
  resultToolBtn: {
    width: 30,
    height: 30,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTranslatedText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  sourceQuoteBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    borderRadius: Radii.sm,
    padding: 8,
    marginTop: 10,
  },
  sourceQuoteLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  sourceQuoteText: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    fontStyle: 'italic',
  },
  grammarDetectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: Radii.sm,
    padding: 8,
    marginTop: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  grammarDetectedText: {
    flex: 1,
    fontSize: 11,
    color: '#FDE68A',
    fontWeight: '600',
  },
  historySection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  clearHistoryBtn: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
  },
  historyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: Radii.md,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    gap: 8,
  },
  historyTime: {
    fontSize: 9,
    color: Colors.textMuted,
  },
  historySourceText: {
    fontSize: 12,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  historyTranslatedText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 2,
  },
  historyBeNote: {
    fontSize: 10,
    color: '#F59E0B',
    marginTop: 2,
  },
  historySmallBtn: {
    width: 28,
    height: 28,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
