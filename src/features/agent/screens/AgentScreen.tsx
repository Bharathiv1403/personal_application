import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { AIService, ChatMessage } from '@/core/utils/ai-service';
import { useHealthStore } from '@/features/health/state/health-store';
import { useWealthStore } from '@/features/wealth/state/wealth-store';
import { useJobStore } from '@/features/career/state/job-store';
import { useTodoStore } from '@/features/todo/state/todo-store';
import { useAuthStore } from '@/features/auth/state/auth-store';
import { useAiConfigStore } from '@/core/state/ai-config-store';
import { ApiKeyModal } from '@/core/components/ApiKeyModal';
import { PreInterviewFlashcardsModal } from '@/features/career/components/PreInterviewFlashcardsModal';
import { SundayResetModal } from '@/features/today/components/SundayResetModal';
import { SecondBrainModal } from '@/features/notes/components/SecondBrainModal';
import { ActionAgentEngine } from '../services/action-agent-engine';

export const AgentScreen: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKeyModalVisible, setApiKeyModalVisible] = useState(false);
  const [flashcardsVisible, setFlashcardsVisible] = useState(false);
  const [sundayResetVisible, setSundayResetVisible] = useState(false);
  const [secondBrainVisible, setSecondBrainVisible] = useState(false);

  const isAiConfigured = useAiConfigStore((s) => s.isConfigured);
  const hasKey = isAiConfigured || AIService.hasConfiguredKey();

  const todaySteps = useHealthStore((s) => s.todaySteps);
  const loans = useWealthStore((s) => s.loans);
  const jobs = useJobStore((s) => s.jobs);
  const user = useAuthStore((s) => s.user);
  const userName = user?.name ? user.name.split(' ')[0] : 'User';

  const activeLoansCount = loans.filter((l) => l.status === 'active').length;
  const upcomingInterviewsCount = jobs.filter((j) => j.interviews && j.interviews.length > 0).length;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const CHAT_STORAGE_KEY = '@aayon:ai_chat_history_v1';

  const defaultWelcomeMsg: ChatMessage = {
    id: '1',
    sender: 'agent',
    text: `${getGreeting()} ${userName}! I am AAYON, your autonomous AI Action Copilot ⚡\n\nYou can command me in English or Tamil to:\n• Log expenses (e.g. "₹150 tea", "250 biryani")\n• Log water (e.g. "500ml water குடிச்சேன்")\n• Schedule tasks (e.g. "Add task: Finish mobile feature")\n• Check Tamil good time (e.g. "இன்றைய நல்ல நேரம்")\n• Search jobs (e.g. "Chennai React jobs")\n• Summarize your day (e.g. "Daily briefing")\n\nWhat would you like me to do for you right now?`,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([defaultWelcomeMsg]);

  // Load chat history on mount
  useEffect(() => {
    AsyncStorage.getItem(CHAT_STORAGE_KEY).then((json) => {
      if (json) {
        try {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMessages(parsed);
          }
        } catch {}
      }
    });
  }, []);

  const persistMessages = async (msgs: ChatMessage[]) => {
    setMessages(msgs);
    try {
      await AsyncStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(msgs.slice(-60)));
    } catch {}
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear Conversation 🗑️',
      'Start a new chat session? Previous chat history will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Chat',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            const reset = [defaultWelcomeMsg];
            setMessages(reset);
            await AsyncStorage.removeItem(CHAT_STORAGE_KEY);
          },
        },
      ]
    );
  };

  const speakLastMessage = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      Speech.speak(lastMsg.text, { language: 'en-US', pitch: 1.0, rate: 0.95 });
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const messageToSend = (customPrompt || input).trim();
    if (!messageToSend || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});

    const userMsg: ChatMessage = { id: Date.now().toString(), sender: 'user', text: messageToSend };
    const updatedWithUser = [...messages, userMsg];
    persistMessages(updatedWithUser);
    setInput('');

    const lower = messageToSend.toLowerCase();

    // UI Modal Triggers
    if (lower.includes('flashcard') || lower.includes('flash cards')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setFlashcardsVisible(true);
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: '⚡ Launching your 10-Minute Pre-Interview High-Yield Technical Flashcards now!',
      };
      persistMessages([...updatedWithUser, replyMsg]);
      return;
    }

    if (lower.includes('sunday reset') || lower.includes('weekly review') || lower.includes('retrospective')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSundayResetVisible(true);
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: '🕯️ Opening your Sunday Reset ritual. Let’s review your scorecard and set your critical weekly priorities.',
      };
      persistMessages([...updatedWithUser, replyMsg]);
      return;
    }

    if (lower.includes('second brain') || lower.includes('open notes')) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setSecondBrainVisible(true);
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: '📝 Opening your Second Brain & Developer Vault.',
      };
      persistMessages([...updatedWithUser, replyMsg]);
      return;
    }

    setIsLoading(true);

    try {
      const result = await ActionAgentEngine.processMessage(messageToSend, messages);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: result.replyText,
        actionTitle: result.actionTitle,
        actionBadge: result.actionBadge,
      };
      persistMessages([...updatedWithUser, replyMsg]);
    } catch (err) {
      console.warn('[AgentScreen] Action error:', err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "I couldn't complete that command right now. Please verify your connection or command format.",
      };
      persistMessages([...updatedWithUser, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>AAYON • AI Copilot</Text>
              <Text style={styles.subtitle}>Executive Assistant & Career Mentor</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {messages.length > 1 && (
                <TouchableOpacity
                  style={styles.keyBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  onPress={handleClearChat}
                >
                  <Ionicons name="trash-outline" size={17} color={Colors.textMuted} />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.keyBtn, !hasKey && styles.keyBtnHighlight]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={() => setApiKeyModalVisible(true)}
              >
                <Ionicons
                  name={hasKey ? 'key' : 'key-outline'}
                  size={18}
                  color={hasKey ? '#10B981' : '#F59E0B'}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.voiceBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={speakLastMessage}
              >
                <Ionicons name="volume-high-outline" size={20} color={Colors.purple} />
              </TouchableOpacity>
            </View>
          </View>

        {/* Free API Key Prompt Banner */}
        {!hasKey && (
          <TouchableOpacity
            style={styles.keyPromptBanner}
            onPress={() => setApiKeyModalVisible(true)}
          >
            <View style={styles.keyIconCircle}>
              <Ionicons name="key" size={16} color="#F59E0B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.keyPromptTitle}>Free AI Key Required 🔑</Text>
              <Text style={styles.keyPromptSub}>
                Tap here to connect your free Google Gemini key in 10 seconds.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#F59E0B" />
          </TouchableOpacity>
        )}

        {/* Quick Launchers */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.launchersScrollView}
          contentContainerStyle={styles.launchersScrollContent}
        >
          <TouchableOpacity
            style={[styles.launcherChip, { borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.08)' }]}
            onPress={() => handleSend("₹150 tea expense")}
          >
            <Text style={[styles.launcherText, { color: '#10B981' }]}>💳 Add ₹150 Tea</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.launcherChip, { borderColor: '#06B6D4', backgroundColor: 'rgba(6, 182, 212, 0.08)' }]}
            onPress={() => handleSend("500ml water")}
          >
            <Text style={[styles.launcherText, { color: '#06B6D4' }]}>💧 +500ml Water</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.launcherChip, { borderColor: '#F59E0B', backgroundColor: 'rgba(245, 158, 11, 0.08)' }]}
            onPress={() => handleSend("இன்றைய நல்ல நேரம் என்ன?")}
          >
            <Text style={[styles.launcherText, { color: '#F59E0B' }]}>🕉️ நல்ல நேரம்</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.launcherChip, { borderColor: '#38BDF8', backgroundColor: 'rgba(56, 189, 248, 0.08)' }]}
            onPress={() => handleSend("Chennai React jobs")}
          >
            <Text style={[styles.launcherText, { color: '#38BDF8' }]}>💼 Chennai Jobs</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.launcherChip, { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.08)' }]}
            onPress={() => handleSend("Summary")}
          >
            <Text style={[styles.launcherText, { color: '#8B5CF6' }]}>📊 Daily Briefing</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.launcherChip}
            onPress={() => handleSend("Add task: Finish mobile feature audit")}
          >
            <Text style={styles.launcherText}>🎯 Add Priority Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.launcherChip, { borderColor: Colors.gold }]}
            onPress={() => setFlashcardsVisible(true)}
          >
            <Text style={[styles.launcherText, { color: Colors.gold }]}>⚡ 10m Flashcards</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.launcherChip, { borderColor: Colors.purple }]}
            onPress={() => setSundayResetVisible(true)}
          >
            <Text style={[styles.launcherText, { color: Colors.purple }]}>🕯️ Sunday Reset</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.launcherChip, { borderColor: Colors.cyan }]}
            onPress={() => setSecondBrainVisible(true)}
          >
            <Text style={[styles.launcherText, { color: Colors.cyan }]}>📝 Second Brain</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Messages Stream */}
        <ScrollView style={styles.messagesList} contentContainerStyle={styles.messagesContent}>
          {messages.map((m) => (
            <View
              key={m.id}
              style={[
                styles.bubbleWrapper,
                m.sender === 'user' ? styles.bubbleUserWrapper : styles.bubbleAgentWrapper,
              ]}
            >
              <GlassCard
                variant={m.sender === 'user' ? 'elevated' : 'highlight'}
                style={[
                  styles.bubble,
                  m.sender === 'user' ? styles.bubbleUser : styles.bubbleAgent,
                ]}
              >
                {m.sender === 'agent' && (
                  <View style={styles.agentTag}>
                    <Ionicons name="sparkles" size={12} color={Colors.purple} />
                    <Text style={styles.agentTagText}>AAYON AI</Text>
                  </View>
                )}
                {m.actionTitle && (
                  <View style={styles.actionCardHeader}>
                    <Ionicons name="flash" size={13} color={Colors.gold} />
                    <Text style={styles.actionCardTitle}>{m.actionTitle}</Text>
                    {m.actionBadge && (
                      <View style={styles.actionCardPill}>
                        <Text style={styles.actionCardPillText}>{m.actionBadge}</Text>
                      </View>
                    )}
                  </View>
                )}
                <Text style={styles.bubbleText}>{m.text}</Text>
              </GlassCard>
            </View>
          ))}

          {isLoading && (
            <View style={[styles.bubbleWrapper, styles.bubbleAgentWrapper]}>
              <GlassCard variant="highlight" style={[styles.bubble, styles.bubbleAgent, styles.loadingBubble]}>
                <ActivityIndicator size="small" color={Colors.purple} />
                <Text style={[styles.bubbleText, styles.loadingText]}>AAYON is thinking...</Text>
              </GlassCard>
            </View>
          )}
        </ScrollView>

        {/* Chat Input Dock */}
        <View style={styles.inputDock}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Command: '₹150 tea', '500ml water', 'நல்ல நேரம்'..."
            placeholderTextColor={Colors.textMuted}
            editable={!isLoading}
            onSubmitEditing={() => handleSend()}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || isLoading) && styles.sendBtnDisabled]}
            onPress={() => handleSend()}
            disabled={!input.trim() || isLoading}
          >
            <Ionicons name="arrow-up" size={18} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      </View>
      </KeyboardAvoidingView>

      <ApiKeyModal
        visible={apiKeyModalVisible}
        onClose={() => setApiKeyModalVisible(false)}
      />

      <PreInterviewFlashcardsModal
        visible={flashcardsVisible}
        onClose={() => setFlashcardsVisible(false)}
      />

      <SundayResetModal
        visible={sundayResetVisible}
        onClose={() => setSundayResetVisible(false)}
      />

      <SecondBrainModal
        visible={secondBrainVisible}
        onClose={() => setSecondBrainVisible(false)}
      />
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.screenPadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  keyBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyBtnHighlight: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#F59E0B',
  },
  voiceBtn: {
    width: 38,
    height: 38,
    borderRadius: Radii.full,
    backgroundColor: Colors.purpleGlow,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPromptBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: Radii.md,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  keyIconCircle: {
    width: 30,
    height: 30,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPromptTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  keyPromptSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  launchersScrollView: {
    marginVertical: Spacing.xs,
    maxHeight: 38,
  },
  launchersScrollContent: {
    gap: 8,
    paddingRight: Spacing.md,
  },
  launchersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginVertical: Spacing.sm,
  },
  launcherChip: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radii.full,
  },
  launcherText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: Spacing.md,
  },
  bubbleWrapper: {
    marginBottom: Spacing.md,
    maxWidth: '85%',
  },
  bubbleUserWrapper: {
    alignSelf: 'flex-end',
  },
  bubbleAgentWrapper: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: Spacing.md,
    borderRadius: Radii.lg,
  },
  bubbleUser: {
    backgroundColor: Colors.cardSubtle || '#27272A',
    borderColor: Colors.borderLight,
  },
  bubbleAgent: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderColor: 'rgba(139, 92, 246, 0.25)',
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  agentTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  agentTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.purple,
    textTransform: 'uppercase',
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  actionCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.gold,
    letterSpacing: 0.3,
  },
  actionCardPill: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginLeft: 'auto',
  },
  actionCardPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FDE68A',
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
    color: Colors.textPrimary,
  },
  inputDock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: Spacing.sm,
    marginBottom: Platform.OS === 'ios' ? 14 : 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.textPrimary,
    paddingVertical: 6,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
