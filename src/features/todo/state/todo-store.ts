import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type TodoCategory = 'Work' | 'Tech' | 'Health' | 'Finance' | 'Personal';
export type TodoPriority = 'high' | 'medium' | 'low';

export interface TodoItem {
  id: string;
  title: string;
  description?: string;
  category: TodoCategory;
  priority: TodoPriority;
  dueDate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

interface TodoState {
  todos: TodoItem[];
  addTodo: (params: {
    title: string;
    description?: string;
    category?: TodoCategory;
    priority?: TodoPriority;
    dueDate?: string;
  }) => void;
  toggleTodo: (id: string) => void;
  deleteTodo: (id: string) => void;
  updateTodo: (id: string, updates: Partial<TodoItem>) => void;
  clearCompleted: () => void;
}

export const useTodoStore = create<TodoState>()(
  persist(
    (set, get) => ({
      todos: [],

      addTodo: ({ title, description, category = 'Work', priority = 'medium', dueDate }) => {
        if (!title.trim()) return;
        const newTodo: TodoItem = {
          id: `todo-${Date.now()}`,
          title: title.trim(),
          description: description?.trim() || undefined,
          category,
          priority,
          dueDate,
          completed: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ todos: [newTodo, ...state.todos] }));
      },

      toggleTodo: (id) => {
        set((state) => ({
          todos: state.todos.map((t) =>
            t.id === id
              ? {
                  ...t,
                  completed: !t.completed,
                  completedAt: !t.completed ? new Date().toISOString() : undefined,
                }
              : t
          ),
        }));
      },

      deleteTodo: (id) => {
        set((state) => ({ todos: state.todos.filter((t) => t.id !== id) }));
      },

      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        }));
      },

      clearCompleted: () => {
        set((state) => ({ todos: state.todos.filter((t) => !t.completed) }));
      },
    }),
    {
      name: 'personal-app:todo-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
