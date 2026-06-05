export interface StoredCustomTool {
  id: string;
  ownerId?: string;
  title: string;
  description: string;
  category: string;
  icon?: string;
  visibility: 'private' | 'public' | 'unlisted';
  promptTemplateString: string;
  inputFields: {
    id: string;
    label: string;
    type: 'text' | 'textarea' | 'select' | 'number';
    placeholder: string;
    options?: { value: string; label: string }[];
    defaultValue?: string;
    required?: boolean;
  }[];
  tags: string[];
  likesCount: number;
  usesCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface StoredResult {
  id: string;
  title: string;
  toolId: string;
  toolName: string;
  content: string;
  type: 'text' | 'markdown' | 'table';
  isFavorite: boolean;
  source: 'generation' | 'manual' | 'import';
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export interface StoredFavorite {
  id: string;
  itemId: string;
  type: 'tool' | 'result' | 'workflow';
  label: string;
  createdAt: string;
}

export interface WorkflowProgress {
  workflowId: string;
  currentStep: number;
  completedSteps: number[];
  data: Record<string, any>;
  generatedOutputs?: Record<string, string>;
  updatedAt: string;
}

export interface LibraryItem {
  id: string;
  title: string;
  type: 'result' | 'tool' | 'workflow' | 'chat';
  content: string;
  isFavorite: boolean;
  createdAt: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface ChatHistoryItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatHistoryItem[];
  createdAt: string;
  updatedAt: string;
}

// TODO Future Backend: Add Supabase Auth user_id, RLS policies
// TODO Future Backend: Add profiles table mapping to these types
