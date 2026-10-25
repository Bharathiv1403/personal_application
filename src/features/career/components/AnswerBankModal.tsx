import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Share } from 'react-native';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useCandidateProfileStore, AnswerBankItem } from '../state/candidate-profile-store';
import { Badge } from '@/core/design-system/primitives/Badge';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const AnswerBankModal: React.FC<Props> = ({ visible, onClose }) => {
  const answerBank = useCandidateProfileStore((s) => s.answerBank);
  const updateAnswer = useCandidateProfileStore((s) => s.updateAnswer);
  const addAnswer = useCandidateProfileStore((s) => s.addAnswer);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');

  const handleStartEdit = (item: AnswerBankItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setEditingId(item.id);
    setEditText(item.answer);
  };

  const handleSaveEdit = (id: string) => {
    if (!editText.trim()) {
      Alert.alert('Required', 'Answer cannot be blank.');
      return;
    }
    updateAnswer(id, editText.trim());
    setEditingId(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  const handleCopy = async (text: string) => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      await Share.share({ message: text });
    } catch {
      // ignore
    }
  };

  const handleCreateNew = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) {
      Alert.alert('Required', 'Please enter both question and verified answer.');
      return;
    }
    addAnswer({
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      category: 'General',
    });
    setNewQuestion('');
    setNewAnswer('');
    setShowAddForm(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Application Answer Bank</Text>
              <Text style={styles.modalSubtitle}>Reusable verified answers for instant job forms</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <View style={styles.topActionRow}>
            <Text style={styles.answerCountText}>{answerBank.length} Reusable Answers Ready</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setShowAddForm(!showAddForm)}
            >
              <Ionicons name={showAddForm ? 'close' : 'add'} size={15} color="#FFFFFF" />
              <Text style={styles.addBtnText}>{showAddForm ? 'Cancel' : '+ New Question'}</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {showAddForm && (
              <View style={styles.addFormCard}>
                <Text style={styles.formLabel}>Employer Question</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Willing to relocate to Bangalore?"
                  placeholderTextColor={Colors.textMuted}
                  value={newQuestion}
                  onChangeText={setNewQuestion}
                />

                <Text style={styles.formLabel}>Your Verified Answer</Text>
                <TextInput
                  style={[styles.textInput, { height: 60 }]}
                  placeholder="e.g. Yes, open to relocation for full-time on-site/hybrid."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                  value={newAnswer}
                  onChangeText={setNewAnswer}
                />

                <TouchableOpacity style={styles.createBtn} onPress={handleCreateNew}>
                  <Text style={styles.createBtnText}>Save to Answer Bank</Text>
                </TouchableOpacity>
              </View>
            )}

            {answerBank.map((item) => {
              const isEditing = editingId === item.id;

              return (
                <View key={item.id} style={styles.answerCard}>
                  <View style={styles.cardHeader}>
                    <Badge label={item.category} variant="primary" />
                    <TouchableOpacity onPress={() => handleCopy(item.answer)} style={styles.copyBtn}>
                      <Ionicons name="copy-outline" size={14} color="#38BDF8" />
                      <Text style={styles.copyBtnText}>Copy</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.questionText}>Q: {item.question}</Text>

                  {isEditing ? (
                    <View style={styles.editWrap}>
                      <TextInput
                        style={styles.editInput}
                        value={editText}
                        onChangeText={setEditText}
                        multiline
                      />
                      <View style={styles.editActionRow}>
                        <TouchableOpacity
                          style={styles.cancelBtn}
                          onPress={() => setEditingId(null)}
                        >
                          <Text style={styles.cancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.saveEditBtn}
                          onPress={() => handleSaveEdit(item.id)}
                        >
                          <Text style={styles.saveEditText}>Save</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ) : (
                    <TouchableOpacity
                      onPress={() => handleStartEdit(item)}
                      style={styles.answerWrap}
                    >
                      <Text style={styles.answerText}>{item.answer}</Text>
                      <View style={styles.tapToEditRow}>
                        <Ionicons name="pencil" size={11} color={Colors.textMuted} />
                        <Text style={styles.tapToEditText}>Tap to edit answer</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#12131A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  answerCountText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.md,
    gap: 4,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalBody: {
    marginBottom: Spacing.md,
  },
  addFormCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: Spacing.md,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
    marginBottom: 4,
    marginTop: 6,
    textTransform: 'uppercase',
  },
  textInput: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 13,
  },
  createBtn: {
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radii.md,
    marginTop: 10,
  },
  createBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  answerCard: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radii.sm,
    gap: 4,
  },
  copyBtnText: {
    fontSize: 10,
    color: '#38BDF8',
    fontWeight: '700',
  },
  questionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  answerWrap: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 10,
    borderRadius: Radii.md,
  },
  answerText: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 19,
  },
  tapToEditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  tapToEditText: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  editWrap: {
    marginTop: 6,
  },
  editInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: 10,
    color: '#FFFFFF',
    fontSize: 13,
    minHeight: 60,
  },
  editActionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cancelText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  saveEditBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.primary,
  },
  saveEditText: {
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
