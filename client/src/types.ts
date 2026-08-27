export type ReflectionMode = 'reflect' | 'brainstorm' | 'deepen' | 'summarize';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
  mode?: ReflectionMode;
  modelUsed?: string;
}

export interface EntrySynthesis {
  title: string;
  summary: string;
  insights: string[];
  actionItems: string[];
  dominantMood: string;
  tags: string[];
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  initialThought: string;
  messages: ChatMessage[];
  synthesis?: EntrySynthesis;
  mood?: string;
  tags: string[];
  wordCount: number;
  createdAt: number;
  updatedAt: number;
  isFavorite?: boolean;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isAnonymous?: boolean;
}
