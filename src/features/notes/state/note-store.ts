import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NoteItem, NoteType, BookmarkStatus, CodeLanguage } from '../types';

interface NoteState {
  notes: NoteItem[];
  addNote: (item: Omit<NoteItem, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateNote: (id: string, updates: Partial<Omit<NoteItem, 'id' | 'createdAt'>>) => void;
  deleteNote: (id: string) => void;
  togglePin: (id: string) => void;
  updateBookmarkStatus: (id: string, status: BookmarkStatus) => void;
  getFilteredNotes: (query: string, tagFilter: string | null, typeFilter: NoteType | 'all') => NoteItem[];
}

const INITIAL_NOTES: NoteItem[] = [
  {
    id: 'note_1',
    title: 'React Native Performance Optimization Checklist',
    content: `### Mobile Core Web Vitals & Rendering
- **Avoid Inline Object Definitions** in render functions to reduce GC pressure and unnecessary prop re-renders.
- **Use FlashList instead of FlatList** for lists with >50 items for recycled cell rendering and 5x FPS gain.
- **Fast Image Caching**: Always use \`expo-image\` with cachePolicy \`memory-disk\` for instant avatar/banner renders.
- **Worklets & UI Thread**: Delegate complex gestures and spring physics to \`react-native-reanimated\` so the JS thread never drops below 60fps.`,
    type: 'note',
    tags: ['TechNotes', 'React'],
    isPinned: true,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'note_2',
    title: 'Redis Token Bucket Rate Limiter Snippet',
    content: 'Lua script pattern for atomic distributed rate limiting across backend API gateways.',
    type: 'snippet',
    tags: ['SystemDesign', 'Snippets'],
    codeLanguage: 'python',
    codeSnippet: `import time
import redis

r = redis.Redis(host='localhost', port=6379, db=0)

def is_rate_limited(user_id: str, limit: int = 100, window: int = 60) -> bool:
    key = f"ratelimit:{user_id}"
    current = int(time.time())
    pipeline = r.pipeline()
    pipeline.zremrangebyscore(key, 0, current - window)
    pipeline.zcard(key)
    pipeline.zadd(key, {str(current): current})
    pipeline.expire(key, window)
    _, req_count, _, _ = pipeline.execute()
    return req_count > limit`,
    isPinned: true,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'note_3',
    title: 'PostgreSQL Window Functions Deep Dive',
    content: 'Common SQL interview patterns: Running totals, DENSE_RANK vs RANK, and Lag/Lead.',
    type: 'snippet',
    tags: ['TechNotes', 'Snippets'],
    codeLanguage: 'sql',
    codeSnippet: `-- Compute cumulative salary per department and find 2nd highest earner
SELECT 
  emp_id, 
  department, 
  salary,
  DENSE_RANK() OVER (PARTITION BY department ORDER BY salary DESC) as rank,
  SUM(salary) OVER (PARTITION BY department ORDER BY hire_date) as running_dept_total
FROM employees;`,
    isPinned: false,
    createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 6).toISOString(),
  },
  {
    id: 'note_4',
    title: 'Designing Data-Intensive Applications (DDIA Summary)',
    content: 'Notes on distributed consensus (Raft/Paxos), partition tolerance, and eventual consistency vs read-your-writes guarantees.',
    type: 'bookmark',
    tags: ['SystemDesign', 'TechNotes'],
    url: 'https://dataintensive.net',
    bookmarkStatus: 'reading',
    isPinned: false,
    createdAt: new Date(Date.now() - 86400000 * 8).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 8).toISOString(),
  },
  {
    id: 'note_5',
    title: 'React 19 Server Actions & Compiler In-Depth',
    content: 'Official React team write-up detailing automatic memoization without useMemo/useCallback.',
    type: 'bookmark',
    tags: ['React', 'TechNotes'],
    url: 'https://react.dev/blog/2024/04/25/react-19',
    bookmarkStatus: 'to_read',
    isPinned: false,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
];

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      notes: [],

      addNote: (item) => {
        const id = `note_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const now = new Date().toISOString();
        const newNote: NoteItem = {
          ...item,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          notes: [newNote, ...state.notes],
        }));
        return id;
      },

      updateNote: (id, updates) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n
          ),
        }));
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.filter((n) => n.id !== id),
        }));
      },

      togglePin: (id) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, isPinned: !n.isPinned, updatedAt: new Date().toISOString() } : n
          ),
        }));
      },

      updateBookmarkStatus: (id, status) => {
        set((state) => ({
          notes: state.notes.map((n) =>
            n.id === id ? { ...n, bookmarkStatus: status, updatedAt: new Date().toISOString() } : n
          ),
        }));
      },

      getFilteredNotes: (query, tagFilter, typeFilter) => {
        const { notes } = get();
        const q = query.trim().toLowerCase();

        return notes
          .filter((note) => {
            // Type filter
            if (typeFilter !== 'all' && note.type !== typeFilter) return false;

            // Tag filter
            if (tagFilter && !note.tags.includes(tagFilter)) return false;

            // Search query filter
            if (q) {
              const inTitle = note.title.toLowerCase().includes(q);
              const inContent = note.content.toLowerCase().includes(q);
              const inSnippet = note.codeSnippet?.toLowerCase().includes(q) ?? false;
              const inUrl = note.url?.toLowerCase().includes(q) ?? false;
              const inTags = note.tags.some((t) => t.toLowerCase().includes(q));
              return inTitle || inContent || inSnippet || inUrl || inTags;
            }

            return true;
          })
          .sort((a, b) => {
            // Pinned first, then newest
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          });
      },
    }),
    {
      name: 'second-brain-notes-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
