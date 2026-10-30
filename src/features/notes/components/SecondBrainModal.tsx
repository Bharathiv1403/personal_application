import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as WebBrowser from 'expo-web-browser';
import * as Speech from 'expo-speech';
import { useNoteStore } from '../state/note-store';
import { NoteItem, NoteType, BookmarkStatus, NOTE_TAGS } from '../types';
import { NoteEditorModal } from './NoteEditorModal';
import { QuickBrainDumpModal } from './QuickBrainDumpModal';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';

interface SecondBrainModalProps {
  visible: boolean;
  onClose: () => void;
}

export const SecondBrainModal: React.FC<SecondBrainModalProps> = ({ visible, onClose }) => {
  const { notes, deleteNote, togglePin, updateBookmarkStatus } = useNoteStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<NoteType | 'all'>('all');

  // Modals inside Second Brain
  const [editorVisible, setEditorVisible] = useState(false);
  const [editingNote, setEditingNote] = useState<NoteItem | null>(null);
  const [brainDumpVisible, setBrainDumpVisible] = useState(false);
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);
  const [speakingNoteId, setSpeakingNoteId] = useState<string | null>(null);

  const filteredNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return notes
      .filter((item) => {
        if (typeFilter !== 'all' && item.type !== typeFilter) return false;
        if (selectedTag && !item.tags.includes(selectedTag)) return false;
        if (q) {
          const inTitle = item.title.toLowerCase().includes(q);
          const inContent = item.content.toLowerCase().includes(q);
          const inSnippet = item.codeSnippet?.toLowerCase().includes(q) ?? false;
          const inUrl = item.url?.toLowerCase().includes(q) ?? false;
          const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
          return inTitle || inContent || inSnippet || inUrl || inTags;
        }
        return true;
      })
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [notes, searchQuery, selectedTag, typeFilter]);

  const handleCopyCode = async (id: string, code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setCopiedNoteId(id);
      setTimeout(() => setCopiedNoteId(null), 2000);
    } catch (e) {
      console.warn('Copy error:', e);
    }
  };

  const handleOpenUrl = async (url?: string) => {
    if (!url) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      if (url.startsWith('http://') || url.startsWith('https://')) {
        await WebBrowser.openBrowserAsync(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Linking.openURL(url).catch(() => {
        Alert.alert('Cannot Open URL', 'Please verify that this is a valid web link.');
      });
    }
  };

  const handleToggleSpeak = (item: NoteItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    if (speakingNoteId === item.id) {
      Speech.stop();
      setSpeakingNoteId(null);
      return;
    }

    Speech.stop();
    setSpeakingNoteId(item.id);
    const cleanContent = (item.content || '').replace(/[#\*\`\-]/g, '');
    const textToRead = `${item.title}. ${cleanContent}. ${item.codeSnippet ? 'Code snippet in ' + (item.codeLanguage || 'code') : ''}`;
    Speech.speak(textToRead, {
      language: 'en-US',
      pitch: 1.0,
      rate: 0.95,
      onDone: () => setSpeakingNoteId(null),
      onError: () => setSpeakingNoteId(null),
    });
  };

  const handleCycleBookmarkStatus = (item: NoteItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const order: BookmarkStatus[] = ['to_read', 'reading', 'completed'];
    const currentIdx = order.indexOf(item.bookmarkStatus || 'to_read');
    const nextStatus = order[(currentIdx + 1) % order.length];
    updateBookmarkStatus(item.id, nextStatus);
  };

  const handleDeletePrompt = (item: NoteItem) => {
    Alert.alert(
      'Delete Entry',
      `Are you sure you want to delete "${item.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            deleteNote(item.id);
          },
        },
      ]
    );
  };

  const renderNoteCard = ({ item }: { item: NoteItem }) => {
    const isSnippet = item.type === 'snippet';
    const isBookmark = item.type === 'bookmark';

    return (
      <View style={[styles.card, item.isPinned && styles.cardPinned]}>
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleBox}>
            <View style={styles.typeBadgeRow}>
              <View
                style={[
                  styles.typeBadge,
                  isSnippet
                    ? styles.badgeSnippet
                    : isBookmark
                    ? styles.badgeBookmark
                    : styles.badgeNote,
                ]}
              >
                <Ionicons
                  name={
                    isSnippet
                      ? 'code-slash'
                      : isBookmark
                      ? 'bookmark'
                      : 'document-text'
                  }
                  size={10}
                  color="#FFFFFF"
                />
                <Text style={styles.typeBadgeText}>
                  {isSnippet
                    ? (item.codeLanguage || 'snippet').toUpperCase()
                    : isBookmark
                    ? 'READ LATER'
                    : 'NOTE'}
                </Text>
              </View>

              {item.isPinned && (
                <View style={styles.pinnedBadge}>
                  <Ionicons name="pin" size={10} color={Colors.gold} />
                  <Text style={styles.pinnedText}>PINNED</Text>
                </View>
              )}
            </View>

            <Text style={styles.cardTitle} numberOfLines={2}>
              {item.title}
            </Text>
          </View>

          {/* Quick Actions Menu */}
          <View style={styles.cardActions}>
            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                togglePin(item.id);
              }}
            >
              <Ionicons
                name={item.isPinned ? 'pin' : 'pin-outline'}
                size={16}
                color={item.isPinned ? Colors.gold : Colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionIconBtn,
                speakingNoteId === item.id && { backgroundColor: 'rgba(6, 182, 212, 0.25)' },
              ]}
              onPress={() => handleToggleSpeak(item)}
            >
              <Ionicons
                name={speakingNoteId === item.id ? 'stop-circle' : 'volume-medium-outline'}
                size={16}
                color={speakingNoteId === item.id ? Colors.cyan : Colors.textMuted}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setEditingNote(item);
                setEditorVisible(true);
              }}
            >
              <Ionicons name="pencil" size={15} color={Colors.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionIconBtn}
              onPress={() => handleDeletePrompt(item)}
            >
              <Ionicons name="trash-outline" size={15} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Snippet Code Box */}
        {isSnippet && item.codeSnippet && (
          <View style={styles.snippetContainer}>
            <View style={styles.snippetToolbar}>
              <Text style={styles.snippetLang}>{item.codeLanguage || 'code'}</Text>
              <TouchableOpacity
                style={styles.copyBtn}
                onPress={() => handleCopyCode(item.id, item.codeSnippet!)}
              >
                <Ionicons
                  name={copiedNoteId === item.id ? 'checkmark' : 'copy-outline'}
                  size={12}
                  color={copiedNoteId === item.id ? Colors.primary : Colors.textMuted}
                />
                <Text
                  style={[
                    styles.copyBtnText,
                    copiedNoteId === item.id && { color: Colors.primary },
                  ]}
                >
                  {copiedNoteId === item.id ? 'Copied!' : 'Copy Code'}
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.snippetText} numberOfLines={6}>
              {item.codeSnippet}
            </Text>
          </View>
        )}

        {/* Bookmark URL & Status Toggle */}
        {isBookmark && (
          <View style={styles.bookmarkContainer}>
            {item.url && (
              <TouchableOpacity
                style={styles.urlClickRow}
                onPress={() => handleOpenUrl(item.url)}
              >
                <Ionicons name="globe-outline" size={14} color={Colors.cyan} />
                <Text style={styles.urlText} numberOfLines={1}>
                  {item.url}
                </Text>
                <Ionicons name="open-outline" size={12} color={Colors.cyan} />
              </TouchableOpacity>
            )}

            <View style={styles.bookmarkStatusRow}>
              <Text style={styles.statusLabel}>Reading Progress:</Text>
              <TouchableOpacity
                style={[
                  styles.statusTogglePill,
                  item.bookmarkStatus === 'completed'
                    ? styles.pillCompleted
                    : item.bookmarkStatus === 'reading'
                    ? styles.pillReading
                    : styles.pillToRead,
                ]}
                onPress={() => handleCycleBookmarkStatus(item)}
              >
                <Ionicons
                  name={
                    item.bookmarkStatus === 'completed'
                      ? 'checkmark-circle'
                      : item.bookmarkStatus === 'reading'
                      ? 'time'
                      : 'bookmark'
                  }
                  size={12}
                  color="#FFFFFF"
                />
                <Text style={styles.statusToggleText}>
                  {item.bookmarkStatus === 'completed'
                    ? 'Completed'
                    : item.bookmarkStatus === 'reading'
                    ? 'In Progress'
                    : 'To Read'}
                </Text>
                <Text style={styles.tapToCycleText}>(tap to cycle)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Markdown Content */}
        {item.content ? (
          <Text style={styles.cardContent} numberOfLines={4}>
            {item.content}
          </Text>
        ) : null}

        {/* Tags footer */}
        {item.tags.length > 0 && (
          <View style={styles.tagsFooter}>
            {item.tags.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.cardTag}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setSelectedTag(selectedTag === t ? null : t);
                }}
              >
                <Text style={styles.cardTagText}>#{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View style={styles.screen}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={onClose}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.topTitleBox}>
            <Text style={styles.topTitle}>Second Brain 📝💡</Text>
            <Text style={styles.topSubtitle}>Knowledge & Developer Snippet Vault</Text>
          </View>
          <View style={styles.topRightActions}>
            <TouchableOpacity
              style={styles.brainDumpTrigger}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
                setBrainDumpVisible(true);
              }}
            >
              <Ionicons name="flash" size={16} color={Colors.gold} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.addTrigger}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setEditingNote(null);
                setEditorVisible(true);
              }}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search notes, snippets, code, tags..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Type Filter Tabs */}
        <View style={styles.typeFilterRow}>
          {(
            [
              { id: 'all', label: `All (${notes.length})` },
              { id: 'note', label: 'Notes' },
              { id: 'snippet', label: 'Code' },
              { id: 'bookmark', label: 'Read Later' },
            ] as const
          ).map((t) => {
            const isSelected = typeFilter === t.id;
            return (
              <TouchableOpacity
                key={t.id}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  setTypeFilter(t.id);
                }}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tag Filters Carousel */}
        <View style={styles.tagCarouselBox}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={['All Tags', ...NOTE_TAGS]}
            keyExtractor={(item) => item}
            contentContainerStyle={styles.tagCarouselContent}
            renderItem={({ item }) => {
              const isAll = item === 'All Tags';
              const isSelected = isAll ? selectedTag === null : selectedTag === item;
              return (
                <TouchableOpacity
                  style={[styles.tagFilterPill, isSelected && styles.tagFilterPillActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    setSelectedTag(isAll ? null : isSelected ? null : item);
                  }}
                >
                  <Text
                    style={[
                      styles.tagFilterPillText,
                      isSelected && styles.tagFilterPillTextActive,
                    ]}
                  >
                    {isAll ? 'All Tags' : `#${item}`}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>

        {/* Notes List */}
        <FlatList
          data={filteredNotes}
          keyExtractor={(item) => item.id}
          renderItem={renderNoteCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="journal-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyTitle}>No Entries Found</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery || selectedTag || typeFilter !== 'all'
                  ? 'Try clearing your search or tag filters.'
                  : 'Capture your first developer note, code snippet, or read-later link!'}
              </Text>
              <TouchableOpacity
                style={styles.emptyAddBtn}
                onPress={() => {
                  setEditingNote(null);
                  setEditorVisible(true);
                }}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.emptyAddBtnText}>Add Knowledge Item</Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Note Editor Modal */}
        <NoteEditorModal
          visible={editorVisible}
          onClose={() => setEditorVisible(false)}
          initialNote={editingNote}
          defaultType={typeFilter === 'all' ? 'note' : typeFilter}
        />

        {/* Quick Brain Dump Modal */}
        <QuickBrainDumpModal
          visible={brainDumpVisible}
          onClose={() => setBrainDumpVisible(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0B10',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: 12,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitleBox: {
    flex: 1,
  },
  topTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  topSubtitle: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brainDumpTrigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTrigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#13141F',
    marginHorizontal: Spacing.lg,
    paddingHorizontal: 12,
    borderRadius: Radii.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  typeFilterRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    gap: 8,
    marginBottom: Spacing.sm,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: Radii.full,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  tagCarouselBox: {
    marginBottom: Spacing.sm,
  },
  tagCarouselContent: {
    paddingHorizontal: Spacing.lg,
    gap: 6,
  },
  tagFilterPill: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: Radii.md,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tagFilterPillActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: Colors.cyan,
  },
  tagFilterPillText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  tagFilterPillTextActive: {
    color: Colors.cyan,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    gap: 12,
  },
  card: {
    backgroundColor: '#12141F',
    borderRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
  },
  cardPinned: {
    borderColor: 'rgba(245, 158, 11, 0.4)',
    backgroundColor: '#141624',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardTitleBox: {
    flex: 1,
    marginRight: 8,
  },
  typeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 4,
  },
  badgeNote: {
    backgroundColor: 'rgba(99, 102, 241, 0.3)',
  },
  badgeSnippet: {
    backgroundColor: 'rgba(6, 182, 212, 0.3)',
  },
  badgeBookmark: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  pinnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  pinnedText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.gold,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 22,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snippetContainer: {
    backgroundColor: '#090A10',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.2)',
    padding: 10,
    marginVertical: 8,
  },
  snippetToolbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
    paddingBottom: 6,
    marginBottom: 8,
  },
  snippetLang: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cyan,
    textTransform: 'uppercase',
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  copyBtnText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  snippetText: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
    fontSize: 12,
    color: '#93C5FD',
    lineHeight: 18,
  },
  bookmarkContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
    padding: 10,
    marginVertical: 8,
    gap: 8,
  },
  urlClickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  urlText: {
    flex: 1,
    fontSize: 12,
    color: Colors.cyan,
    textDecorationLine: 'underline',
  },
  bookmarkStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  statusTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radii.full,
  },
  pillToRead: {
    backgroundColor: Colors.purple,
  },
  pillReading: {
    backgroundColor: Colors.gold,
  },
  pillCompleted: {
    backgroundColor: Colors.primary,
  },
  statusToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  tapToCycleText: {
    fontSize: 9,
    color: 'rgba(255,255,255,0.7)',
  },
  cardContent: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19,
    marginVertical: 4,
  },
  tagsFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  cardTag: {
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  cardTagText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radii.lg,
    marginTop: 10,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
