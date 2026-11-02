import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { AIService } from '@/core/utils/ai-service';
import { TranslationService } from '../utils/translation-service';

export type RoleplayScenario = 'interview' | 'standup' | 'casual';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  tamilTranslation?: string;
  grammarTip?: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Record<RoleplayScenario, ChatMessage[]> = {
  interview: [
    {
      id: 'init-1',
      sender: 'ai',
      text: "Hello! Welcome to our technical interview. Could you please introduce yourself and tell me about your recent project experience?",
      tamilTranslation: 'வணக்கம்! நமது தொழில்நுட்ப நேர்காணலுக்கு வரவேற்கிறோம். உங்களை அறிமுகப்படுத்திக் கொண்டு உங்கள் சமீபத்திய திட்ட அனுபவத்தைப் பற்றி கூற முடியுமா?',
      timestamp: '10:00 AM',
    },
  ],
  standup: [
    {
      id: 'init-2',
      sender: 'ai',
      text: "Good morning team! Let's start our daily standup. What did you work on yesterday, and what are you working on today?",
      tamilTranslation: 'காலை வணக்கம்! நமது தினசரி ஸ்டாண்டப்பைத் தொடங்குவோம். நேற்று நீங்கள் என்ன செய்தீர்கள், இன்று என்ன செய்ய உள்ளீர்கள்?',
      timestamp: '10:00 AM',
    },
  ],
  casual: [
    {
      id: 'init-3',
      sender: 'ai',
      text: "Hey there! How has your day been so far? Are you learning anything exciting today?",
      tamilTranslation: 'ஹே! உங்கள் நாள் இதுவரை எப்படி இருந்தது? இன்று ஏதேனும் சுவாரஸ்யமானதைக் கற்றுக்கொள்கிறீர்களா?',
      timestamp: '10:00 AM',
    },
  ],
};

const SCENARIO_SUGGESTIONS: Record<RoleplayScenario, string[]> = {
  interview: [
    "I am a software engineer with React Native experience.",
    "Yesterday I built an authentication and offline sync module.",
    "I am very passionate about clean architecture and performance.",
  ],
  standup: [
    "Yesterday I completed the job sync card bug fix.",
    "Today I am implementing the English learning features.",
    "No blockers from my end, everything is on track.",
  ],
  casual: [
    "I had a very productive day working on my app.",
    "I love drinking coffee and exploring new tech.",
    "How about you? What are you up to?",
  ],
};

export const AiEnglishChatPartnerView: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<RoleplayScenario>('interview');
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    ...INITIAL_MESSAGES.interview,
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showTamilMap, setShowTamilMap] = useState<Record<string, boolean>>({});

  const handleSelectScenario = (sc: RoleplayScenario) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setActiveScenario(sc);
    setMessages([...INITIAL_MESSAGES[sc]]);
    setShowTamilMap({});
  };

  const speakText = (text: string) => {
    try {
      Speech.stop();
      Speech.speak(text, {
        language: 'en-US',
        pitch: 1.0,
        rate: 0.88,
      });
    } catch {}
  };

  const toggleTamil = async (msg: ChatMessage) => {
    const isShowing = !!showTamilMap[msg.id];
    if (isShowing) {
      setShowTamilMap((prev) => ({ ...prev, [msg.id]: false }));
      return;
    }

    if (!msg.tamilTranslation) {
      const res = await TranslationService.translate(msg.text, 'en-to-ta');
      msg.tamilTranslation = res.translatedText;
    }
    setShowTamilMap((prev) => ({ ...prev, [msg.id]: true }));
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!text.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Prompt persona
      let rolePrompt = '';
      if (activeScenario === 'interview') {
        rolePrompt = 'You are an encouraging and professional Tech Interviewer. Ask follow-up technical questions. Respond in 2-3 natural sentences.';
      } else if (activeScenario === 'standup') {
        rolePrompt = 'You are an Agile Scrum Master leading daily standup. Acknowledge updates and ask about blockers or next PRs in 2 sentences.';
      } else {
        rolePrompt = 'You are a warm, friendly English conversation partner. Chat about daily life in 2 sentences.';
      }

      const prompt = `System: ${rolePrompt}
The user is a non-native English speaker learning English.
User said: "${userMsg.text}"

Task:
1. Respond naturally in simple, fluent English.
2. If the user made any grammatical mistake (e.g., tense, be-verb, preposition), provide a 1-sentence friendly correction in Tamil.
Output format:
AI Reply: <English response>
Grammar Tip: <Tamil correction or 'None'>`;

      const aiReply = await AIService.translateText(prompt, 'en-to-ta'); // uses LLM query under the hood

      let replyEn = "Thank you for sharing that! Tell me more about what challenges you faced.";
      let grammarTip: string | undefined = undefined;

      if (aiReply) {
        if (aiReply.includes('AI Reply:')) {
          const parts = aiReply.split('Grammar Tip:');
          replyEn = parts[0].replace('AI Reply:', '').trim();
          if (parts[1] && !parts[1].toLowerCase().includes('none')) {
            grammarTip = parts[1].trim();
          }
        } else {
          replyEn = aiReply.replace(/^["']|["']$/g, '').trim();
        }
      }

      // Quick translation for AI message
      const transRes = await TranslationService.translate(replyEn, 'en-to-ta');

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: replyEn,
        tamilTranslation: transRes.translatedText,
        grammarTip,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      speakText(replyEn);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: "That sounds very interesting! Could you tell me a little more about that?",
        tamilTranslation: 'அது மிகவும் சுவாரஸ்யமாகத் தெரிகிறது! அதைப் பற்றி இன்னும் கொஞ்சம் சொல்ல முடியுமா?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Intro Banner */}
      <GlassCard style={styles.topBanner}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.iconCircle}>
            <Ionicons name="chatbubbles" size={20} color="#38BDF8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>AI Conversation Partner 🤖</Text>
            <Text style={styles.bannerSub}>
              நேர்காணல் & அலுவலக உரையாடல் பயிற்சி • உடனடி ஆடியோ & தமிழ் வழிகாட்டல்
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* Scenario Selector Chips */}
      <View style={styles.scenarioBar}>
        {[
          { id: 'interview', label: 'Job Interview 💼' },
          { id: 'standup', label: 'Daily Standup 💻' },
          { id: 'casual', label: 'Casual Chat ☕' },
        ].map((sc) => {
          const isSelected = activeScenario === sc.id;
          return (
            <TouchableOpacity
              key={sc.id}
              style={[styles.scenarioChip, isSelected && styles.scenarioChipActive]}
              onPress={() => handleSelectScenario(sc.id as RoleplayScenario)}
            >
              <Text
                style={[
                  styles.scenarioChipText,
                  isSelected && styles.scenarioChipTextActive,
                ]}
              >
                {sc.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Messages Scroll Area */}
      <ScrollView
        style={styles.chatScroll}
        contentContainerStyle={styles.chatContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isAi = msg.sender === 'ai';
          const isTamilVisible = !!showTamilMap[msg.id];

          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                isAi ? styles.messageRowAi : styles.messageRowUser,
              ]}
            >
              {isAi && (
                <View style={styles.aiAvatar}>
                  <Ionicons name="hardware-chip" size={14} color="#38BDF8" />
                </View>
              )}

              <View
                style={[
                  styles.bubble,
                  isAi ? styles.bubbleAi : styles.bubbleUser,
                ]}
              >
                <Text style={[styles.bubbleText, !isAi && styles.bubbleTextUser]}>
                  {msg.text}
                </Text>

                {/* Tamil Translation Reveal */}
                {isAi && isTamilVisible && msg.tamilTranslation && (
                  <View style={styles.tamilRevealBox}>
                    <Text style={styles.tamilRevealText}>
                      🇮🇳 {msg.tamilTranslation}
                    </Text>
                  </View>
                )}

                {/* Grammar Tip if AI detected any error */}
                {msg.grammarTip && (
                  <View style={styles.grammarTipBox}>
                    <Ionicons name="sparkles" size={12} color="#F59E0B" />
                    <Text style={styles.grammarTipText}>💡 {msg.grammarTip}</Text>
                  </View>
                )}

                {/* Tools bar for AI message */}
                {isAi && (
                  <View style={styles.bubbleToolsRow}>
                    <TouchableOpacity
                      style={styles.toolBtn}
                      onPress={() => speakText(msg.text)}
                    >
                      <Ionicons name="volume-high" size={14} color="#38BDF8" />
                      <Text style={styles.toolBtnText}>Speak</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.toolBtn}
                      onPress={() => toggleTamil(msg)}
                    >
                      <Ionicons
                        name={isTamilVisible ? 'eye-off-outline' : 'language-outline'}
                        size={14}
                        color={isTamilVisible ? '#10B981' : Colors.textMuted}
                      />
                      <Text
                        style={[
                          styles.toolBtnText,
                          isTamilVisible && { color: '#10B981' },
                        ]}
                      >
                        {isTamilVisible ? 'Hide Tamil' : 'Tamil அர்த்தம்'}
                      </Text>
                    </TouchableOpacity>

                    <Text style={styles.timestampText}>{msg.timestamp}</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}

        {isLoading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color="#38BDF8" />
            <Text style={styles.loadingText}>AI is thinking in English...</Text>
          </View>
        )}
      </ScrollView>

      {/* Suggested Quick Replies */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>Quick Suggestions (பரிந்துரைகள்):</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 6, marginTop: 4 }}
        >
          {SCENARIO_SUGGESTIONS[activeScenario].map((sug, sIdx) => (
            <TouchableOpacity
              key={sIdx}
              style={styles.suggestionChip}
              onPress={() => handleSendMessage(sug)}
            >
              <Text style={styles.suggestionChipText}>{sug}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.chatInput}
          placeholder="Reply in English (ஆங்கிலத்தில் பதிலளிக்கவும்)..."
          placeholderTextColor={Colors.textMuted}
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            (!inputText.trim() || isLoading) && styles.sendBtnDisabled,
          ]}
          disabled={!inputText.trim() || isLoading}
          onPress={() => handleSendMessage()}
        >
          <Ionicons name="arrow-up" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBanner: {
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
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  bannerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  scenarioBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  scenarioChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  scenarioChipActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38BDF8',
  },
  scenarioChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  scenarioChipTextActive: {
    color: '#38BDF8',
    fontWeight: '800',
  },
  chatScroll: {
    maxHeight: 280,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: Radii.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  chatContent: {
    paddingBottom: Spacing.sm,
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  aiAvatar: {
    width: 26,
    height: 26,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  bubble: {
    maxWidth: '82%',
    borderRadius: Radii.lg,
    padding: Spacing.md,
  },
  bubbleAi: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopLeftRadius: 2,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderTopRightRadius: 2,
  },
  bubbleText: {
    fontSize: 13,
    color: '#FFFFFF',
    lineHeight: 18,
    fontWeight: '600',
  },
  bubbleTextUser: {
    color: '#FFFFFF',
  },
  tamilRevealBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: Radii.sm,
    padding: 8,
    marginTop: 6,
    borderLeftWidth: 2,
    borderLeftColor: '#10B981',
  },
  tamilRevealText: {
    fontSize: 11,
    color: '#A7F3D0',
    lineHeight: 16,
  },
  grammarTipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: Radii.sm,
    padding: 6,
    marginTop: 6,
    gap: 4,
  },
  grammarTipText: {
    flex: 1,
    fontSize: 10,
    color: '#FDE68A',
    fontWeight: '600',
  },
  bubbleToolsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toolBtnText: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '700',
  },
  timestampText: {
    fontSize: 9,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
  },
  loadingText: {
    fontSize: 11,
    color: '#38BDF8',
    fontStyle: 'italic',
  },
  suggestionsContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  suggestionsTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  suggestionChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  suggestionChipText: {
    fontSize: 11,
    color: '#E2E8F0',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radii.full,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    marginBottom: Spacing.sm,
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    color: '#FFFFFF',
    maxHeight: 60,
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
