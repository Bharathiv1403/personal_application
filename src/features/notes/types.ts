export type NoteType = 'note' | 'snippet' | 'bookmark';

export type BookmarkStatus = 'to_read' | 'reading' | 'completed';

export type CodeLanguage = 'typescript' | 'javascript' | 'python' | 'sql' | 'other';

export interface NoteItem {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  tags: string[];
  codeLanguage?: CodeLanguage;
  codeSnippet?: string;
  url?: string;
  bookmarkStatus?: BookmarkStatus;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
}

export const NOTE_TAGS = [
  'TechNotes',
  'SystemDesign',
  'Career',
  'Ideas',
  'Snippets',
  'Finance',
  'React',
  'DSA',
] as const;

export type NoteTag = (typeof NOTE_TAGS)[number];
