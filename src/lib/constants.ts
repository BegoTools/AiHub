export const STORAGE_KEYS = {
  SETTINGS: 'ai_tools_hub_settings',
  FAVORITES: 'ai_tools_hub_favorites',
  HISTORY: 'ai_tools_hub_history',
  THEME: 'ai_tools_hub_theme',
  ONBOARDED: 'ai_tools_hub_onboarded',
  LANGUAGE: 'ai_hub_language',
  CUSTOM_TOOLS: 'ai_hub_custom_tools',
  SAVED_RESULTS: 'ai_hub_saved_results',
  CHAT_SESSIONS: 'ai_hub_chat_sessions',
} as const;

export const HUBS = [
  { id: 'writing', name: 'Writing Hub', icon: 'PenTool', color: 'from-blue-500 to-indigo-600' },
  { id: 'business', name: 'Business Hub', icon: 'Briefcase', color: 'from-emerald-500 to-teal-600' },
  { id: 'social', name: 'Social Media Hub', icon: 'Megaphone', color: 'from-rose-500 to-red-600' },
  { id: 'study', name: 'Study & Learn Hub', icon: 'GraduationCap', color: 'from-amber-500 to-orange-600' },
  { id: 'career', name: 'Career Hub', icon: 'UserCheck', color: 'from-violet-500 to-purple-600' },
  { id: 'daily', name: 'Daily Life Hub', icon: 'Sun', color: 'from-yellow-500 to-orange-500' },
  { id: 'coding', name: 'Coding Hub', icon: 'Code', color: 'from-cyan-500 to-blue-600' },
  { id: 'media', name: 'Image & File Hub', icon: 'Image', color: 'from-pink-500 to-rose-600' },
] as const;

export const QUICK_CARDS = [
  { id: 'write', label: 'اكتب', icon: 'PenLine', prompt: 'عايز أكتب' },
  { id: 'summarize', label: 'لخص', icon: 'FileText', prompt: 'عايز ألخص' },
  { id: 'plan', label: 'خطط', icon: 'Calendar', prompt: 'عايز أخطط' },
  { id: 'market', label: 'سوّق', icon: 'Megaphone', prompt: 'عايز أسوق' },
  { id: 'study', label: 'ادرس', icon: 'GraduationCap', prompt: 'عايز أدرس' },
  { id: 'work', label: 'اشتغل', icon: 'Briefcase', prompt: 'عايز شغل' },
  { id: 'code', label: 'برمج', icon: 'Code', prompt: 'عايز أبرمج' },
  { id: 'create', label: 'اصنع أداة', icon: 'Wand', prompt: 'عايز أصنع أداة' },
] as const;
