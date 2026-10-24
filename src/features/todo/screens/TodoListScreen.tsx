import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import { ScreenContainer } from '@/core/design-system/primitives/ScreenContainer';
import { GlassCard } from '@/core/design-system/primitives/GlassCard';
import { Badge } from '@/core/design-system/primitives/Badge';
import { Colors } from '@/core/design-system/tokens/colors';
import { Spacing, Radii } from '@/core/design-system/tokens/spacing';
import { useTodoStore, TodoCategory, TodoPriority, TodoItem } from '../state/todo-store';

export const TodoListScreen: React.FC = () => {
  const navigation = useNavigation();
  const todos = useTodoStore((s) => s.todos);
  const addTodo = useTodoStore((s) => s.addTodo);
  const toggleTodo = useTodoStore((s) => s.toggleTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const clearCompleted = useTodoStore((s) => s.clearCompleted);

  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Completed'>('Pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [modalVisible, setModalVisible] = useState(false);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskCategory, setTaskCategory] = useState<TodoCategory>('Work');
  const [taskPriority, setTaskPriority] = useState<TodoPriority>('medium');

  const filteredTodos = todos.filter((t) => {
    const matchesStatus =
      statusFilter === 'All'
        ? true
        : statusFilter === 'Pending'
        ? !t.completed
        : t.completed;
    const matchesCategory =
      selectedCategory === 'All' ? true : t.category === selectedCategory;
    return matchesStatus && matchesCategory;
  });

  const handleSaveTask = () => {
    if (!taskTitle.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    addTodo({
      title: taskTitle.trim(),
      category: taskCategory,
      priority: taskPriority,
    });
    setTaskTitle('');
    setModalVisible(false);
  };

  const getPriorityColor = (p: TodoPriority) => {
    switch (p) {
      case 'high':
        return Colors.danger;
      case 'medium':
        return Colors.gold;
      case 'low':
        return Colors.cyan;
    }
  };

  const getCategoryIcon = (c: TodoCategory) => {
    switch (c) {
      case 'Work':
        return 'briefcase-outline';
      case 'Tech':
        return 'code-slash-outline';
      case 'Health':
        return 'fitness-outline';
      case 'Finance':
        return 'wallet-outline';
      case 'Personal':
        return 'person-outline';
    }
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              navigation.goBack();
            }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: Spacing.sm }}>
            <Text style={styles.screenTitle}>To-Do & Action Items</Text>
            <Text style={styles.screenSubtitle}>
              {todos.filter((t) => !t.completed).length} Pending • {todos.filter((t) => t.completed).length} Completed
            </Text>
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
              setModalVisible(true);
            }}
          >
            <Ionicons name="add" size={20} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>

        {/* Status Filter Tabs */}
        <View style={styles.statusTabsRow}>
          {(['Pending', 'Completed', 'All'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              style={[styles.statusTab, statusFilter === status && styles.statusTabActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setStatusFilter(status);
              }}
            >
              <Text style={[styles.statusTabText, statusFilter === status && styles.statusTabTextActive]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Category Filter Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {['All', 'Work', 'Tech', 'Health', 'Finance', 'Personal'].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                setSelectedCategory(cat);
              }}
            >
              <Text style={[styles.categoryChipText, selectedCategory === cat && styles.categoryChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Task List */}
        {filteredTodos.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="checkbox-outline" size={36} color={Colors.primary} />
            <Text style={styles.emptyTitle}>
              {statusFilter === 'Completed' ? 'No Completed Tasks' : 'All Clear! No Pending Tasks'}
            </Text>
            <Text style={styles.emptySubtitle}>
              Tap the "+" button above to add an action item for work, tech, or daily goals.
            </Text>
          </GlassCard>
        ) : (
          filteredTodos.map((todo) => (
            <GlassCard key={todo.id} style={[styles.todoCard, todo.completed && styles.todoCardDone]}>
              <View style={styles.todoRow}>
                <TouchableOpacity
                  style={styles.checkBtn}
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                    toggleTodo(todo.id);
                  }}
                >
                  <Ionicons
                    name={todo.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={22}
                    color={todo.completed ? Colors.primary : Colors.textMuted}
                  />
                </TouchableOpacity>

                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={[styles.todoTitle, todo.completed && styles.todoTitleDone]}>
                    {todo.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={styles.catBadge}>
                      <Ionicons name={getCategoryIcon(todo.category)} size={11} color={Colors.textSecondary} />
                      <Text style={styles.catBadgeText}>{todo.category}</Text>
                    </View>
                    <View style={styles.priorityIndicator}>
                      <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(todo.priority) }]} />
                      <Text style={[styles.priorityText, { color: getPriorityColor(todo.priority) }]}>
                        {todo.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    deleteTodo(todo.id);
                  }}
                >
                  <Ionicons name="trash-outline" size={15} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            </GlassCard>
          ))
        )}

        {/* Clear Completed Footer */}
        {todos.some((t) => t.completed) && statusFilter !== 'Pending' ? (
          <TouchableOpacity
            style={styles.clearBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
              Alert.alert('Clear Completed Tasks', 'Delete all completed tasks?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Clear', style: 'destructive', onPress: clearCompleted },
              ]);
            }}
          >
            <Ionicons name="trash-bin-outline" size={14} color={Colors.danger} />
            <Text style={styles.clearBtnText}>Clear Completed Tasks</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      {/* New Task Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Action Item</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.modalInput}
              placeholder="What needs to get done?"
              placeholderTextColor={Colors.textMuted}
              value={taskTitle}
              onChangeText={setTaskTitle}
              autoFocus
            />

            {/* Category Selector */}
            <Text style={styles.selectorLabel}>Category:</Text>
            <View style={styles.selectorRow}>
              {(['Work', 'Tech', 'Health', 'Finance', 'Personal'] as const).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.selectorBtn, taskCategory === cat && styles.selectorBtnActive]}
                  onPress={() => setTaskCategory(cat)}
                >
                  <Text style={[styles.selectorBtnText, taskCategory === cat && styles.selectorBtnTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Priority Selector */}
            <Text style={styles.selectorLabel}>Priority:</Text>
            <View style={styles.selectorRow}>
              {(['high', 'medium', 'low'] as const).map((p) => (
                <TouchableOpacity
                  key={p}
                  style={[styles.selectorBtn, taskPriority === p && styles.selectorBtnActive]}
                  onPress={() => setTaskPriority(p)}
                >
                  <Text style={[styles.selectorBtnText, taskPriority === p && styles.selectorBtnTextActive]}>
                    {p.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleSaveTask}>
              <Ionicons name="checkmark-circle-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.submitBtnText}>Add Action Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: Spacing.screenPadding,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  screenSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: Radii.full,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTabsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.cardSubtle,
    borderRadius: Radii.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 3,
    marginBottom: Spacing.sm,
  },
  statusTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: Radii.sm,
  },
  statusTabActive: {
    backgroundColor: '#1E1E24',
  },
  statusTabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusTabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  categoryScroll: {
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.full,
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  categoryChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  todoCard: {
    marginBottom: Spacing.sm,
    padding: Spacing.md,
  },
  todoCardDone: {
    opacity: 0.6,
  },
  todoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkBtn: {
    paddingRight: 10,
  },
  todoTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },
  todoTitleDone: {
    textDecorationLine: 'line-through',
    color: Colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  catBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radii.xs,
    gap: 4,
  },
  catBadgeText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  priorityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
  },
  deleteBtn: {
    padding: 6,
  },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: Spacing.md,
    gap: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#141418',
    borderTopLeftRadius: Radii.xl,
    borderTopRightRadius: Radii.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalInput: {
    backgroundColor: '#1A1A20',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.md,
    color: Colors.textPrimary,
    padding: Spacing.md,
    fontSize: 14,
    marginBottom: Spacing.md,
  },
  selectorLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 6,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
    flexWrap: 'wrap',
  },
  selectorBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radii.sm,
    backgroundColor: Colors.cardSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  selectorBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  selectorBtnText: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  selectorBtnTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: Radii.md,
    marginTop: Spacing.sm,
    gap: 6,
  },
  submitBtnText: {
    color: Colors.textInverse,
    fontSize: 13,
    fontWeight: '700',
  },
});
