import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { useAiConfigStore } from '@/core/state/ai-config-store';

interface ApiKeyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ visible, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'groq' | 'openrouter'>('gemini');
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const geminiKey = useAiConfigStore((s) => s.geminiKey);
  const groqKey = useAiConfigStore((s) => s.groqKey);
  const openrouterKey = useAiConfigStore((s) => s.openrouterKey);
  const saveGeminiKey = useAiConfigStore((s) => s.saveGeminiKey);
  const saveGroqKey = useAiConfigStore((s) => s.saveGroqKey);
  const saveOpenRouterKey = useAiConfigStore((s) => s.saveOpenRouterKey);
  const removeKey = useAiConfigStore((s) => s.removeKey);
  const testApiKey = useAiConfigStore((s) => s.testApiKey);

  useEffect(() => {
    if (visible) {
      const current =
        activeTab === 'gemini' ? geminiKey : activeTab === 'groq' ? groqKey : openrouterKey;
      setApiKeyInput(current);
      setTestResult(null);
    }
  }, [visible, activeTab, geminiKey, groqKey, openrouterKey]);

  const handleOpenAiStudio = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (activeTab === 'gemini') {
      await WebBrowser.openBrowserAsync('https://aistudio.google.com/app/apikey');
    } else if (activeTab === 'groq') {
      await WebBrowser.openBrowserAsync('https://console.groq.com/keys');
    } else {
      await WebBrowser.openBrowserAsync('https://openrouter.ai/keys');
    }
  };

  const handlePasteClipboard = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.trim().length > 5) {
        setApiKeyInput(text.trim());
        setTestResult(null);
      } else {
        Alert.alert('Clipboard Empty', 'No valid text found in your clipboard.');
      }
    } catch {
      Alert.alert('Error', 'Unable to read from clipboard.');
    }
  };

  const handleTestKey = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Missing Key', 'Please paste or enter your API key first.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    setIsTesting(true);
    setTestResult(null);

    const res = await testApiKey(activeTab, apiKeyInput.trim());
    setIsTesting(false);
    setTestResult(res);

    if (res.success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
    }
  };

  const handleSave = async () => {
    if (!apiKeyInput.trim()) {
      Alert.alert('Empty Key', 'Please enter a valid API key.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    let saved = false;
    if (activeTab === 'gemini') {
      saved = await saveGeminiKey(apiKeyInput.trim());
    } else if (activeTab === 'groq') {
      saved = await saveGroqKey(apiKeyInput.trim());
    } else {
      saved = await saveOpenRouterKey(apiKeyInput.trim());
    }

    if (saved) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert('API Key Saved 🔐', 'Your key is securely saved on your device. AI features are now active!');
      if (onSuccess) onSuccess();
      onClose();
    } else {
      Alert.alert('Error', 'Failed to store API key securely.');
    }
  };

  const handleRemove = async () => {
    const providerName =
      activeTab === 'gemini' ? 'Google Gemini' : activeTab === 'groq' ? 'Groq Cloud' : 'OpenRouter';
    Alert.alert(
      'Remove API Key?',
      `Are you sure you want to remove your ${providerName} key?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeKey(activeTab);
            setApiKeyInput('');
            setTestResult(null);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
          },
        },
      ]
    );
  };

  const hasSavedKey =
    activeTab === 'gemini'
      ? Boolean(geminiKey)
      : activeTab === 'groq'
      ? Boolean(groqKey)
      : Boolean(openrouterKey);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.headerTitle}>AI Engine & Keys</Text>
                <Badge label="Zero-Key Ready ✨" variant="gold" />
              </View>
              <Text style={styles.headerSubtitle}>
                Free Zero-Key AI (Pollinations.ai) is active out-of-the-box! Connect personal keys below for private limits.
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Provider Switcher */}
            <View style={styles.tabBar}>
              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'gemini' && styles.tabButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveTab('gemini');
                }}
              >
                <Ionicons
                  name="sparkles"
                  size={14}
                  color={activeTab === 'gemini' ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.tabText, activeTab === 'gemini' && styles.tabTextActive]}>
                  Gemini (Free)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'groq' && styles.tabButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveTab('groq');
                }}
              >
                <Ionicons
                  name="flash"
                  size={14}
                  color={activeTab === 'groq' ? Colors.cyan : Colors.textMuted}
                />
                <Text style={[styles.tabText, activeTab === 'groq' && styles.tabTextActive]}>
                  Groq (Fast)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabButton, activeTab === 'openrouter' && styles.tabButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setActiveTab('openrouter');
                }}
              >
                <Ionicons
                  name="globe"
                  size={14}
                  color={activeTab === 'openrouter' ? '#A855F7' : Colors.textMuted}
                />
                <Text style={[styles.tabText, activeTab === 'openrouter' && styles.tabTextActive]}>
                  OpenRouter
                </Text>
              </TouchableOpacity>
            </View>

            {/* Instruction Card */}
            <GlassCard style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Ionicons
                  name={
                    activeTab === 'gemini'
                      ? 'logo-google'
                      : activeTab === 'groq'
                      ? 'server-outline'
                      : 'globe-outline'
                  }
                  size={20}
                  color={
                    activeTab === 'gemini' ? '#38BDF8' : activeTab === 'groq' ? '#F59E0B' : '#A855F7'
                  }
                />
                <Text style={styles.infoTitle}>
                  {activeTab === 'gemini'
                    ? 'Google AI Studio (Gemini 1.5 & 2.0)'
                    : activeTab === 'groq'
                    ? 'Groq Cloud Console (Llama 3.1 & 3.3)'
                    : 'OpenRouter (DeepSeek R1 / Llama 3.3 Free)'}
                </Text>
              </View>
              <Text style={styles.infoDesc}>
                {activeTab === 'gemini'
                  ? 'Google offers 15 requests per minute 100% free with no credit card required. It generates cover letters, ATS resume fixes, and morning life briefings.'
                  : activeTab === 'groq'
                  ? 'Groq provides ultra-fast sub-second responses using Llama 3 models with generous free daily limits.'
                  : 'OpenRouter connects you with DeepSeek R1, Llama 3.3 70B, and Gemini for 100% free. Sign in with Google at openrouter.ai and generate your free API key.'}
              </Text>

              <TouchableOpacity style={styles.externalLinkBtn} onPress={handleOpenAiStudio}>
                <Ionicons name="open-outline" size={16} color="#FFFFFF" />
                <Text style={styles.externalLinkText}>
                  {activeTab === 'gemini'
                    ? 'Open Google AI Studio (Get Key)'
                    : activeTab === 'groq'
                    ? 'Open Groq Console (Get Key)'
                    : 'Open OpenRouter Keys Console'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleOpenAiStudio} style={{ marginTop: 6 }}>
                <Text style={styles.urlHintText}>
                  {activeTab === 'gemini'
                    ? 'https://aistudio.google.com/app/apikey'
                    : activeTab === 'groq'
                    ? 'https://console.groq.com/keys'
                    : 'https://openrouter.ai/keys'}
                </Text>
              </TouchableOpacity>
            </GlassCard>

            {/* API Key Input Section */}
            <View style={styles.inputSection}>
              <View style={styles.inputHeaderRow}>
                <Text style={styles.inputLabel}>
                  {activeTab === 'gemini'
                    ? 'Gemini API Key'
                    : activeTab === 'groq'
                    ? 'Groq API Key'
                    : 'OpenRouter API Key'}
                </Text>
                <TouchableOpacity style={styles.pasteBtn} onPress={handlePasteClipboard}>
                  <Ionicons name="clipboard-outline" size={13} color={Colors.cyan} />
                  <Text style={styles.pasteBtnText}>Paste Key</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputBox}>
                <TextInput
                  style={styles.keyTextInput}
                  value={apiKeyInput}
                  onChangeText={(val) => {
                    setApiKeyInput(val);
                    setTestResult(null);
                  }}
                  placeholder={
                    activeTab === 'gemini'
                      ? 'AIzaSy...'
                      : activeTab === 'groq'
                      ? 'gsk_...'
                      : 'sk-or-v1-...'
                  }
                  placeholderTextColor={Colors.textMuted}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity onPress={() => setShowKey(!showKey)} style={styles.eyeBtn}>
                  <Ionicons
                    name={showKey ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={Colors.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Test Connection Result Alert */}
            {testResult && (
              <View
                style={[
                  styles.resultBox,
                  testResult.success ? styles.resultSuccess : styles.resultError,
                ]}
              >
                <Ionicons
                  name={testResult.success ? 'checkmark-circle' : 'alert-circle'}
                  size={18}
                  color={testResult.success ? '#10B981' : '#EF4444'}
                />
                <Text
                  style={[
                    styles.resultText,
                    testResult.success ? styles.resultTextSuccess : styles.resultTextError,
                  ]}
                >
                  {testResult.message}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.testBtn, isTesting && { opacity: 0.7 }]}
                onPress={handleTestKey}
                disabled={isTesting}
              >
                {isTesting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.testBtnText}>Test Key ⚡</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Ionicons name="checkmark-done" size={16} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save & Activate</Text>
              </TouchableOpacity>
            </View>

            {/* Remove Key option if exists */}
            {hasSavedKey && (
              <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                <Ionicons name="trash-outline" size={14} color="#EF4444" />
                <Text style={styles.removeBtnText}>Remove Saved Key</Text>
              </TouchableOpacity>
            )}

            {/* Privacy Note */}
            <View style={styles.privacyNote}>
              <Ionicons name="shield-checkmark" size={14} color="#10B981" />
              <Text style={styles.privacyText}>
                Your key never leaves your phone. It is saved in encrypted hardware storage (SecureStore) and sent directly to Google/Groq.
              </Text>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#0F172A',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    lineHeight: 16,
  },
  closeBtn: {
    padding: 6,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginLeft: Spacing.sm,
  },
  scrollBody: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: Radii.md,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radii.sm,
  },
  tabButtonActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.25)',
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  infoCard: {
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  infoDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  externalLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: Radii.md,
    paddingVertical: 10,
  },
  externalLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38BDF8',
  },
  urlHintText: {
    fontSize: 11,
    color: '#38BDF8',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  inputSection: {
    marginBottom: Spacing.md,
  },
  inputHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  pasteBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.cyan,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: Radii.md,
    paddingHorizontal: Spacing.md,
  },
  keyTextInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 13,
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  eyeBtn: {
    padding: 6,
  },
  resultBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: Spacing.md,
    borderRadius: Radii.md,
    marginBottom: Spacing.md,
  },
  resultSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  resultError: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  resultText: {
    fontSize: 12,
    flex: 1,
  },
  resultTextSuccess: {
    color: '#10B981',
    fontWeight: '600',
  },
  resultTextError: {
    color: '#F87171',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  testBtn: {
    flex: 1,
    minWidth: 120,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveBtn: {
    flex: 1.2,
    minWidth: 140,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.md,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  removeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
    padding: Spacing.sm,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.15)',
  },
  privacyText: {
    fontSize: 11,
    color: '#94A3B8',
    flex: 1,
    lineHeight: 15,
  },
});
