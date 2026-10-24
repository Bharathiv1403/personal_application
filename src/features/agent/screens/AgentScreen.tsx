import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { AIService, ChatMessage } from '@/core/utils/ai-service';
import { useHealthStore } from '@/features/health/state/health-store';
import { useWealthStore } from '@/features/wealth/state/wealth-store';
import { useJobStore } from '@/features/career/state/job-store';
import { useAuthStore } from '@/features/auth/state/auth-store';

export const AgentScreen: React.FC = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const todaySteps = useHealthStore((s) => s.todaySteps);
  const loans = useWealthStore((s) => s.loans);
  const jobs = useJobStore((s) => s.jobs);
  const user = useAuthStore((s) => s.user);
  const userName = user?.name ? user.name.split(' ')[0] : 'Bharathi';

  const activeLoansCount = loans.filter((l) => l.status === 'active').length;
  const upcomingInterviewsCount = jobs.filter((j) => j.interviews && j.interviews.length > 0).length;

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'agent',
      text: `${getGreeting()} ${userName}! I am AAYON, your AI Executive Copilot. I'm connected to your live health, career pipeline, and financial records. How can I help you excel today?`,
    },
  ]);

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
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const reply = await AIService.generateReply(
        messageToSend,
        messages,
        {
          steps: todaySteps,
          pendingLoansCount: activeLoansCount,
          upcomingInterviewsCount,
        }
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: reply,
      };
      setMessages((prev) => [...prev, replyMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        text: "Sorry, I couldn't reach the AI network. Please check your connection or API key.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>AAYON • AI Copilot</Text>
            <Text style={styles.subtitle}>Executive Assistant & Career Mentor</Text>
          </View>
          <TouchableOpacity style={styles.voiceBtn} onPress={speakLastMessage}>
            <Ionicons name="volume-high-outline" size={20} color={Colors.purple} />
          </TouchableOpacity>
        </View>

        {/* Quick Launchers */}
        <View style={styles.launchersRow}>
          <TouchableOpacity
            style={styles.launcherChip}
            onPress={() => handleSend("Give me a 5-minute system design interview quick prep summary")}
          >
            <Text style={styles.launcherText}>⚡ 5m Interview Prep</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.launcherChip}
            onPress={() => handleSend("What are my financial and health priorities right now?")}
          >
            <Text style={styles.launcherText}>📊 Daily Status Check</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.launcherChip}
            onPress={() => handleSend("Give me 3 tips to negotiate a higher tech salary in Chennai/Bangalore")}
          >
            <Text style={styles.launcherText}>💼 Salary Negotiation</Text>
          </TouchableOpacity>
        </View>

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
            placeholder="Type a command or ask AAYON..."
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
