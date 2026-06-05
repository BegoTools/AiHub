export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  bgLight: string;
  bgDark: string;
  borderColor: string;
}

export interface InputField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  placeholder: string;
  options?: { value: string; label: string }[];
  defaultValue?: string;
  required?: boolean;
}

export interface Tool {
  id: string;
  categoryId: string;
  title: string;
  description: string;
  icon: string;
  inputs: InputField[];
  exampleInput: Record<string, string>;
  promptTemplate: (inputs: Record<string, string>) => string;
  keywords?: string[];
  tags?: string[];
  isNew?: boolean;
}

export interface HistoryItem {
  id: string;
  toolId: string;
  inputs: Record<string, string>;
  output: string;
  provider: 'gemini' | 'openrouter';
  timestamp: string;
}

export interface ApiSettings {
  geminiKey: string;
  openRouterKey: string;
  provider: 'gemini' | 'openrouter';
  useCustomKeys: boolean;
  selectedModel?: string;
}
