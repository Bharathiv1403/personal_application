import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';

interface Flashcard {
  id: string;
  category: 'React Native' | 'JavaScript' | 'System Design' | 'DSA';
  question: string;
  answer: string;
  codeSnippet?: string;
}

const FLASHCARDS: Flashcard[] = [
  {
    id: 'fc_1',
    category: 'React Native',
    question: 'How does the New Architecture (Fabric + TurboModules) differ from the Old Bridge?',
    answer:
      'The Old Bridge passed serialized JSON asynchronously over a single C++ channel, causing frame drops under high load. The New Architecture uses JSI (JavaScript Interface), allowing JS to hold direct C++ object pointers for synchronous, zero-copy native invocations and concurrent C++ render tree reconciliation (Fabric).',
  },
  {
    id: 'fc_2',
    category: 'JavaScript',
    question: 'What is the Event Loop execution priority between Microtasks and Macrotasks?',
    answer:
      'After the synchronous call stack empties, the JavaScript engine drains the ENTIRE microtask queue (Promise callbacks, queueMicrotask, MutationObserver) before processing the next macrotask (setTimeout, setInterval, setImmediate, I/O events). Starvation can occur if microtasks continuously enqueue new microtasks.',
  },
  {
    id: 'fc_3',
    category: 'System Design',
    question: 'How do you design an idempotent payment processing API endpoint?',
    answer:
      '1. Client generates a unique Idempotency-Key (UUIDv4) in the HTTP header.\n2. Server checks Redis using atomic SETNX on the key.\n3. If exists and in-progress: Return 409 Conflict.\n4. If completed: Return cached response directly without re-billing.\n5. If new: Process transaction in database with ACID guarantees, save result with TTL, and release lock.',
  },
  {
    id: 'fc_4',
    category: 'React Native',
    question: 'Why does React Native Reanimated avoid JS Thread lag for gesture animations?',
    answer:
      'Reanimated runs animations inside "worklets" — small JavaScript functions compiled to execute directly on the UI (native/render) thread inside a secondary Hermes JS runtime. Touch events bypass the asynchronous JS bridge entirely, maintaining 60/120 FPS even when the main JS thread is saturated.',
  },
  {
    id: 'fc_5',
    category: 'JavaScript',
    question: 'Explain JavaScript Closures and how to prevent memory leaks in event handlers.',
    answer:
      'A closure gives an inner function access to its outer lexical scope even after the outer function has returned. Leaks occur when long-lived references (like global event listeners, timers, or singletons) retain references to DOM/Native components. Always remove listeners in useEffect cleanup return handlers.',
  },
  {
    id: 'fc_6',
    category: 'System Design',
    question: 'Compare Optimistic vs Pessimistic Concurrency Control for high-traffic reservations.',
    answer:
      'Pessimistic locking (SELECT FOR UPDATE) acquires database row locks upfront, preventing race conditions but drastically reducing throughput. Optimistic concurrency control uses a version/timestamp column (`UPDATE t SET v=v+1 WHERE id=1 AND v=current_v`); if version changed, the transaction retries with exponential backoff.',
  },
  {
    id: 'fc_7',
    category: 'DSA',
    question: 'When should you use the Two-Pointer technique vs Sliding Window?',
    answer:
      'Two Pointers is ideal for sorted arrays or inward convergence (e.g. 3Sum, Container With Most Water, Palindrome verification). Sliding Window is used for contiguous sub-arrays/sub-strings where you need to track dynamic window sums, character counts, or longest valid sequences with O(N) complexity.',
  },
];

interface PreInterviewFlashcardsModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PreInterviewFlashcardsModal: React.FC<PreInterviewFlashcardsModalProps> = ({
  visible,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [masteredIds, setMasteredIds] = useState<string[]>([]);

  const filteredCards =
    selectedCategory === 'All'
      ? FLASHCARDS
      : FLASHCARDS.filter((c) => c.category === selectedCategory);

  const card = filteredCards[currentIndex] || FLASHCARDS[0];
  const isMastered = masteredIds.includes(card.id);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % filteredCards.length);
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + filteredCards.length) % filteredCards.length);
  };

  const handleToggleMastered = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (isMastered) {
      setMasteredIds(masteredIds.filter((id) => id !== card.id));
    } else {
      setMasteredIds([...masteredIds, card.id]);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerBadge}>
              <Ionicons name="flash" size={18} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>10-Min Pre-Interview Flashcards ⚡</Text>
              <Text style={styles.headerSubtitle}>
                Card {currentIndex + 1} of {filteredCards.length} • {masteredIds.length} Mastered
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Category Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {(['All', 'React Native', 'JavaScript', 'System Design', 'DSA'] as const).map((cat) => {
              const active = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, active && styles.catChipActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedCategory(cat);
                    setCurrentIndex(0);
                    setIsFlipped(false);
                  }}
                >
                  <Text style={[styles.catChipText, active && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Main Flashcard Card (Tap to Flip) */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={[styles.card, isFlipped && styles.cardFlipped]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              setIsFlipped(!isFlipped);
            }}
          >
            <View style={styles.cardTopRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagPillText}>{card.category}</Text>
              </View>
              <Text style={styles.flipHintText}>
                {isFlipped ? '📖 Showing Answer (Tap for Question)' : '💡 Tap to Flip'}
              </Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.cardContentScroll}>
              {!isFlipped ? (
                <View style={styles.questionBox}>
                  <Text style={styles.qLabel}>TECHNICAL QUESTION</Text>
                  <Text style={styles.questionText}>{card.question}</Text>
                </View>
              ) : (
                <View style={styles.answerBox}>
                  <Text style={styles.aLabel}>EXECUTIVE ANSWER & ARCHITECTURE</Text>
                  <Text style={styles.answerText}>{card.answer}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={[styles.masteredBtn, isMastered && styles.masteredBtnActive]}
                onPress={handleToggleMastered}
              >
                <Ionicons
                  name={isMastered ? 'checkmark-circle' : 'checkmark-circle-outline'}
                  size={16}
                  color={isMastered ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.masteredBtnText,
                    isMastered && { color: Colors.primary, fontWeight: '700' },
                  ]}
                >
                  {isMastered ? 'Mastered ✓' : 'Mark as Mastered'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Navigation Controls */}
          <View style={styles.navRow}>
            <TouchableOpacity style={styles.navBtn} onPress={handlePrev}>
              <Ionicons name="chevron-back" size={20} color="#FFFFFF" />
              <Text style={styles.navBtnText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.flipBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setIsFlipped(!isFlipped);
              }}
            >
              <Ionicons name="sync" size={16} color={Colors.cyan} />
              <Text style={styles.flipBtnText}>Flip Card</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.navBtn} onPress={handleNext}>
              <Text style={styles.navBtnText}>Next</Text>
              <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  container: {
    backgroundColor: '#12131D',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  headerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  closeBtn: {
    padding: 6,
  },
  categoryScroll: {
    marginBottom: Spacing.md,
    maxHeight: 34,
  },
  categoryScrollContent: {
    gap: 6,
  },
  catChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  catChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  catChipText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#171926',
    borderRadius: Radii.lg,
    padding: Spacing.lg,
    minHeight: 280,
    maxHeight: 360,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.09)',
    justifyContent: 'space-between',
  },
  cardFlipped: {
    borderColor: 'rgba(6, 182, 212, 0.4)',
    backgroundColor: '#121B24',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tagPill: {
    backgroundColor: 'rgba(99, 102, 241, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  tagPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#A5B4FC',
    textTransform: 'uppercase',
  },
  flipHintText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  cardContentScroll: {
    flex: 1,
    marginVertical: 8,
  },
  questionBox: {
    gap: 8,
  },
  qLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 0.8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 24,
  },
  answerBox: {
    gap: 8,
  },
  aLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.cyan,
    letterSpacing: 0.8,
  },
  answerText: {
    fontSize: 14,
    color: '#E2E8F0',
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 8,
  },
  masteredBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  masteredBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  masteredBtnText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  navBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  flipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  flipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.cyan,
  },
});
