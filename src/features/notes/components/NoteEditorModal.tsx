import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { NoteItem, NoteType, BookmarkStatus, CodeLanguage, NOTE_TAGS } from '../types';
import { useNoteStore } from '../state/note-store';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';

interface NoteEditorModalProps {
  visible: boolean;
  onClose: () => void;
  initialNote?: NoteItem | null;
  defaultType?: NoteType;
}

export const NoteEditorModal: React.FC<NoteEditorModalProps> = ({
  visible,
  onClose,
  initialNote,
  defaultType = 'note',
}) => {
  const { addNote, updateNote } = useNoteStore();

  const [type, setType] = useState<NoteType>(defaultType);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [codeLanguage, setCodeLanguage] = useState<CodeLanguage>('typescript');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [url, setUrl] = useState('');
  const [bookmarkStatus, setBookmarkStatus] = useState<BookmarkStatus>('to_read');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customTagInput, setCustomTagInput] = useState('');
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    if (visible) {
      if (initialNote) {
        setType(initialNote.type);
        setTitle(initialNote.title);
        setContent(initialNote.content);
        setCodeLanguage(initialNote.codeLanguage || 'typescript');
        setCodeSnippet(initialNote.codeSnippet || '');
        setUrl(initialNote.url || '');
        setBookmarkStatus(initialNote.bookmarkStatus || 'to_read');
        setSelectedTags(initialNote.tags || []);
        setIsPinned(initialNote.isPinned || false);
      } else {
        setType(defaultType);
        setTitle('');
        setContent('');
        setCodeLanguage('typescript');
        setCodeSnippet('');
        setUrl('');
        setBookmarkStatus('to_read');
        setSelectedTags(defaultType === 'snippet' ? ['Snippets'] : defaultType === 'bookmark' ? ['TechNotes'] : ['TechNotes']);
        setIsPinned(false);
      }
      setCustomTagInput('');
    }
  }, [visible, initialNote, defaultType]);

  const toggleTag = (tag: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const cleaned = customTagInput.trim().replace(/^#/, '');
    if (cleaned && !selectedTags.includes(cleaned)) {
      setSelectedTags([...selectedTags, cleaned]);
      setCustomTagInput('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const insertMarkdown = (prefix: string, suffix: string = '') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    setContent((prev) => prev + (prev.endsWith('\n') || prev === '' ? '' : '\n') + prefix + suffix);
  };

  const handleSave = () => {
    if (!title.trim()) {
      Alert.alert('Required Title', 'Please enter a title for your second brain entry.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    if (initialNote) {
      updateNote(initialNote.id, {
        title: title.trim(),
        content: content.trim(),
        type,
        tags: selectedTags,
        codeLanguage: type === 'snippet' ? codeLanguage : undefined,
        codeSnippet: type === 'snippet' ? codeSnippet.trim() : undefined,
        url: type === 'bookmark' ? url.trim() : undefined,
        bookmarkStatus: type === 'bookmark' ? bookmarkStatus : undefined,
        isPinned,
      });
    } else {
      addNote({
        title: title.trim(),
        content: content.trim(),
        type,
        tags: selectedTags,
        codeLanguage: type === 'snippet' ? codeLanguage : undefined,
        codeSnippet: type === 'snippet' ? codeSnippet.trim() : undefined,
        url: type === 'bookmark' ? url.trim() : undefined,
        bookmarkStatus: type === 'bookmark' ? bookmarkStatus : undefined,
        isPinned,
      });
    }

    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>
                {initialNote ? 'Edit Knowledge Entry' : 'New Second Brain Entry'}
              </Text>
              <Text style={styles.headerSubtitle}>Personal Developer Vault & Brain Dump</Text>
            </View>
            <View style={styles.headerRightActions}>
              <TouchableOpacity
                style={[styles.pinButton, isPinned && styles.pinButtonActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setIsPinned(!isPinned);
                }}
              >
                <Ionicons
                  name={isPinned ? 'pin' : 'pin-outline'}
                  size={18}
                  color={isPinned ? Colors.primary : Colors.textMuted}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                <Ionicons name="close" size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Type Selector */}
          <View style={styles.typeSelector}>
            {(
              [
                { id: 'note', label: 'Markdown Note', icon: 'document-text' },
                { id: 'snippet', label: 'Code Snippet', icon: 'code-slash' },
                { id: 'bookmark', label: 'Read Later', icon: 'bookmark' },
              ] as const
            ).map((t) => {
              const isSelected = type === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.typeTab, isSelected && styles.typeTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setType(t.id);
                  }}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={14}
                    color={isSelected ? '#FFFFFF' : Colors.textMuted}
                  />
                  <Text style={[styles.typeTabText, isSelected && styles.typeTabTextActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.bodyScroll}>
            {/* Title Input */}
            <Text style={styles.fieldLabel}>Title / Subject</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="e.g. Distributed Consensus in Raft"
              placeholderTextColor={Colors.textMuted}
              value={title}
              onChangeText={setTitle}
            />

            {/* Read-Later URL & Status */}
            {type === 'bookmark' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.fieldLabel}>Resource URL</Text>
                <View style={styles.urlInputRow}>
                  <Ionicons name="link-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.urlInput}
                    placeholder="https://..."
                    placeholderTextColor={Colors.textMuted}
                    value={url}
                    onChangeText={setUrl}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>

                <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Read Status</Text>
                <View style={styles.statusRow}>
                  {(
                    [
                      { id: 'to_read', label: 'To Read', color: Colors.purple },
                      { id: 'reading', label: 'Reading', color: Colors.gold },
                      { id: 'completed', label: 'Completed', color: Colors.primary },
                    ] as const
                  ).map((s) => {
                    const isSelected = bookmarkStatus === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.statusChip,
                          isSelected && { backgroundColor: `${s.color}25`, borderColor: s.color },
                        ]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                          setBookmarkStatus(s.id);
                        }}
                      >
                        <View
                          style={[
                            styles.statusDot,
                            { backgroundColor: isSelected ? s.color : Colors.textMuted },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusChipText,
                            isSelected && { color: '#FFFFFF', fontWeight: '700' },
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Code Snippet Language & Box */}
            {type === 'snippet' && (
              <View style={styles.sectionBlock}>
                <Text style={styles.fieldLabel}>Programming Language</Text>
                <View style={styles.langRow}>
                  {(['typescript', 'javascript', 'python', 'sql', 'other'] as CodeLanguage[]).map(
                    (lang) => {
                      const isSelected = codeLanguage === lang;
                      return (
                        <TouchableOpacity
                          key={lang}
                          style={[styles.langChip, isSelected && styles.langChipActive]}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                            setCodeLanguage(lang);
                          }}
                        >
                          <Text
                            style={[
                              styles.langChipText,
                              isSelected && styles.langChipTextActive,
                            ]}
                          >
                            {lang}
                          </Text>
                        </TouchableOpacity>
                      );
                    }
                  )}
                </View>

                <Text style={[styles.fieldLabel, { marginTop: Spacing.md }]}>Code</Text>
                <TextInput
                  style={styles.codeArea}
                  placeholder={`// Paste your ${codeLanguage} code here...`}
                  placeholderTextColor={Colors.textMuted}
                  value={codeSnippet}
                  onChangeText={setCodeSnippet}
                  multiline
                  textAlignVertical="top"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            )}

            {/* Markdown Helper Bar (for Notes & Descriptions) */}
            <View style={styles.markdownBar}>
              <Text style={styles.fieldLabel}>
                {type === 'snippet' ? 'Explanation / Notes' : 'Markdown Content'}
              </Text>
              <View style={styles.formattingButtons}>
                <TouchableOpacity
                  style={styles.mdBtn}
                  onPress={() => insertMarkdown('### Heading\n')}
                >
                  <Text style={styles.mdBtnText}>H3</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mdBtn}
                  onPress={() => insertMarkdown('**', '**')}
                >
                  <Text style={styles.mdBtnText}>B</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mdBtn}
                  onPress={() => insertMarkdown('- ')}
                >
                  <Text style={styles.mdBtnText}>• List</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mdBtn}
                  onPress={() => insertMarkdown('- [ ] ')}
                >
                  <Text style={styles.mdBtnText}>Task</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.mdBtn}
                  onPress={() => insertMarkdown('```\n', '\n```')}
                >
                  <Text style={styles.mdBtnText}>Code</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TextInput
              style={styles.contentInput}
              placeholder="Write your notes, learnings, key takeaways (Markdown supported)..."
              placeholderTextColor={Colors.textMuted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />

            {/* Tag Taxonomy */}
            <Text style={[styles.fieldLabel, { marginTop: Spacing.lg }]}>Tags</Text>
            <View style={styles.tagGrid}>
              {NOTE_TAGS.map((tag) => {
                const isSelected = selectedTags.includes(tag);
                return (
                  <TouchableOpacity
                    key={tag}
                    style={[styles.tagChip, isSelected && styles.tagChipActive]}
                    onPress={() => toggleTag(tag)}
                  >
                    <Text style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}>
                      #{tag}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Add Custom Tag */}
            <View style={styles.customTagRow}>
              <TextInput
                style={styles.customTagInput}
                placeholder="Add custom tag (e.g. NextJS)..."
                placeholderTextColor={Colors.textMuted}
                value={customTagInput}
                onChangeText={setCustomTagInput}
                onSubmitEditing={handleAddCustomTag}
              />
              <TouchableOpacity style={styles.addTagBtn} onPress={handleAddCustomTag}>
                <Ionicons name="add" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Ionicons name="save" size={18} color="#FFFFFF" />
            <Text style={styles.saveBtnText}>
              {initialNote ? 'Update Knowledge Entry' : 'Save into Second Brain'}
            </Text>
          </TouchableOpacity>
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
    backgroundColor: '#12131A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.xl,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pinButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinButtonActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: Radii.lg,
    padding: 4,
    marginBottom: Spacing.md,
  },
  typeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radii.md,
    gap: 6,
  },
  typeTabActive: {
    backgroundColor: Colors.primary,
  },
  typeTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  typeTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bodyScroll: {
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  titleInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: Spacing.md,
  },
  sectionBlock: {
    marginBottom: Spacing.md,
  },
  urlInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    gap: 8,
  },
  urlInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statusChipText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  langChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langChipActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.2)',
    borderColor: Colors.cyan,
  },
  langChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  langChipTextActive: {
    color: Colors.cyan,
    fontWeight: '700',
  },
  codeArea: {
    backgroundColor: '#0A0B10',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    borderRadius: Radii.md,
    padding: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 13,
    color: '#E0E7FF',
    minHeight: 120,
  },
  markdownBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  formattingButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  mdBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  mdBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
  },
  contentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.md,
    padding: 14,
    fontSize: 14,
    color: '#FFFFFF',
    minHeight: 110,
    lineHeight: 20,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tagChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.primary,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  tagChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  customTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customTagInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radii.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#FFFFFF',
  },
  addTagBtn: {
    width: 36,
    height: 36,
    borderRadius: Radii.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radii.lg,
    gap: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
