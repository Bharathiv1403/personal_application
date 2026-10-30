import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { useNoteStore } from '../state/note-store';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';

interface QuickBrainDumpModalProps {
  visible: boolean;
  onClose: () => void;
}

export const QuickBrainDumpModal: React.FC<QuickBrainDumpModalProps> = ({ visible, onClose }) => {
  const { addNote } = useNoteStore();
  const [text, setText] = useState('');
  const [selectedTag, setSelectedTag] = useState<'Ideas' | 'TechNotes' | 'Career' | 'SystemDesign'>('Ideas');
  const [isRecording, setIsRecording] = useState(false);

  const handleSimulateVoiceInput = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    if (isRecording) {
      setIsRecording(false);
      return;
    }

    setIsRecording(true);
    // Voice prompt simulation
    setTimeout(() => {
      setText((prev) => (prev ? prev + ' ' : '') + 'Need to benchmark SQLite vs AsyncStorage on Android release build for the new offline cache.');
      setIsRecording(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    }, 1800);
  };

  const handleSave = () => {
    if (!text.trim()) {
      Alert.alert('Empty Brain Dump', 'Please write or record your thought before saving.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    // Derive title from first line or first 40 chars
    const lines = text.trim().split('\n');
    const firstLine = lines[0].replace(/^[#\-\*\s]+/, '').slice(0, 50);
    const title = firstLine || 'Quick Brain Dump';

    addNote({
      title,
      content: text.trim(),
      type: 'note',
      tags: [selectedTag],
      isPinned: false,
    });

    setText('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.iconBadge}>
              <Ionicons name="flash" size={18} color={Colors.gold} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Quick Brain Dump</Text>
              <Text style={styles.subtitle}>Instant thought capture • Zero friction</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Quick Tag Pills */}
          <View style={styles.tagRow}>
            {(['Ideas', 'TechNotes', 'Career', 'SystemDesign'] as const).map((t) => {
              const active = selectedTag === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagPill, active && styles.tagPillActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedTag(t);
                  }}
                >
                  <Text style={[styles.tagPillText, active && styles.tagPillTextActive]}>
                    #{t}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Main Quick Input */}
          <TextInput
            style={styles.textInput}
            placeholder="Type anything on your mind... an idea, question, interview topic, or system design insight."
            placeholderTextColor={Colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            autoFocus
            textAlignVertical="top"
          />

          {/* Voice Memo row */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.voiceBtn, isRecording && styles.voiceBtnRecording]}
              onPress={handleSimulateVoiceInput}
            >
              <Ionicons
                name={isRecording ? 'radio' : 'mic'}
                size={18}
                color={isRecording ? '#FFFFFF' : Colors.cyan}
              />
              <Text
                style={[
                  styles.voiceBtnText,
                  isRecording && { color: '#FFFFFF', fontWeight: '700' },
                ]}
              >
                {isRecording ? 'Listening...' : 'Voice Dictate'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
              <Ionicons name="checkmark" size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>Capture</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  container: {
    backgroundColor: '#12131A',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  closeBtn: {
    padding: 6,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  tagPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tagPillActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: Colors.gold,
  },
  tagPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tagPillTextActive: {
    color: Colors.gold,
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: Radii.lg,
    padding: 14,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 120,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  voiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.25)',
  },
  voiceBtnRecording: {
    backgroundColor: Colors.danger,
    borderColor: Colors.danger,
  },
  voiceBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.cyan,
  },
  saveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 11,
    borderRadius: Radii.md,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
