/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Star, 
  Share2, 
  Trash2, 
  ArrowLeft, 
  ArrowRight,
  Sparkles, 
  Cpu, 
  History as HistoryIcon,
  HelpCircle,
  Settings,
  ShieldAlert,
  CalendarDays,
  Menu,
  X,
  Copy,
  Check,
  Zap,
  BookOpen,
  Apple,
  LayoutGrid
} from 'lucide-react';

import { Category, Tool, HistoryItem, ApiSettings } from './types';
import { tools as arabicTools } from './data/tools';
import { getLocalizedTools, getLocalizedCategories } from './utils/localize-content';
import { LOCAL_STORAGE_KEYS, DEFAULT_SETTINGS } from './config/apiConfig';
import { generateAIContent } from './services/aiService';
import { languages, translations, Language } from './translations';

// Component imports
import Sidebar from './components/Sidebar';
import ToolForm, { DynamicIcon } from './components/ToolForm';
import OutputView from './components/OutputView';
import Onboarding from './components/Onboarding';
import AiChatAssistant from './components/AiChatAssistant';

export default function App() {
  // Navigation & Screen states
  const [currentTab, setTab] = useState<string>('home');
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Dynamic custom tools created by AI Assistant
  const [customTools, setCustomTools] = useState<Tool[]>(() => {
    const saved = localStorage.getItem('ai_hub_custom_tools');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((item: any) => ({
          ...item,
          promptTemplate: (inputs: Record<string, string>) => {
            let template = item.promptTemplateString || '';
            Object.keys(inputs).forEach(key => {
              template = template.replace(new RegExp(`{${key}}`, 'g'), inputs[key]);
            });
            return template;
          }
        }));
      } catch (e) {
        console.error('Failed to parse custom tools', e);
      }
    }
    return [];
  });

  const handleAddCustomTool = (newToolRaw: any) => {
    if (arabicTools.some(t => t.id === newToolRaw.id) || customTools.some(t => t.id === newToolRaw.id)) {
      return;
    }

    const newTool: Tool = {
      ...newToolRaw,
      promptTemplate: (inputs: Record<string, string>) => {
        let template = newToolRaw.promptTemplateString || '';
        Object.keys(inputs).forEach(key => {
          template = template.replace(new RegExp(`{${key}}`, 'g'), inputs[key]);
        });
        return template;
      }
    };

    const updated = [...customTools, newTool];
    setCustomTools(updated);
    try {
      localStorage.setItem('ai_hub_custom_tools', JSON.stringify(updated.map(({ promptTemplate, ...rest }) => rest)));
    } catch (e) {
      console.error(e);
    }
  };

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('ai_hub_language');
    return (saved as Language) || 'ar';
  });

  const localizedCategories = useMemo(() => getLocalizedCategories(language), [language]);
  const localizedTools = useMemo(() => getLocalizedTools(language), [language]);

  const allTools = useMemo(() => {
    return [...localizedTools, ...customTools];
  }, [localizedTools, customTools]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Local Storage states
  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [settings, setSettings] = useState<ApiSettings>(DEFAULT_SETTINGS);
  const [theme, setTheme] = useState<'light' | 'dim' | 'dark'>('light');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const t = useMemo(() => {
    return translations[language] || translations['ar'];
  }, [language]);

  useEffect(() => {
    localStorage.setItem('ai_hub_language', language);
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
  }, [language]);

  // Active generation states
  const [currentToolOutput, setCurrentToolOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Mobile menu control
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load state from LocalStorage on mount
  useEffect(() => {
    // Favorites
    const savedFavs = localStorage.getItem(LOCAL_STORAGE_KEYS.FAVORITES);
    if (savedFavs) {
      try { setFavorites(JSON.parse(savedFavs)); } catch (e) { console.error(e); }
    }

    // History
    const savedHistory = localStorage.getItem(LOCAL_STORAGE_KEYS.HISTORY);
    if (savedHistory) {
      try { setHistory(JSON.parse(savedHistory)); } catch (e) { console.error(e); }
    }

    // Settings
    const savedSettings = localStorage.getItem(LOCAL_STORAGE_KEYS.SETTINGS);
    if (savedSettings) {
      try { setSettings(JSON.parse(savedSettings)); } catch (e) { console.error(e); }
    }

    // Theme
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as 'light' | 'dim' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      // System selection fallback
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setTheme(prefersDark ? 'dark' : 'light');
    }

    // Onboarding
    const savedOnboarding = localStorage.getItem(LOCAL_STORAGE_KEYS.ONBOARDED);
    if (!savedOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  // Sync theme to root DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'dim');
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'dim') {
      root.classList.add('dark', 'dim');
    } else {
      root.classList.add('light');
    }
    localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dim';
      if (prev === 'dim') return 'dark';
      return 'light';
    });
  };

  const handleCompleteOnboarding = () => {
    localStorage.setItem(LOCAL_STORAGE_KEYS.ONBOARDED, 'true');
    setShowOnboarding(false);
  };

  // State savers
  const saveFavorites = (newFavs: string[]) => {
    setFavorites(newFavs);
    localStorage.setItem(LOCAL_STORAGE_KEYS.FAVORITES, JSON.stringify(newFavs));
  };

  const saveHistory = (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    localStorage.setItem(LOCAL_STORAGE_KEYS.HISTORY, JSON.stringify(newHistory));
  };

  const handleSaveSettings = (updated: ApiSettings) => {
    setSettings(updated);
    localStorage.setItem(LOCAL_STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
  };

  // Star / Favorite Toggle
  const toggleFavorite = (toolId: string) => {
    if (favorites.includes(toolId)) {
      saveFavorites(favorites.filter(id => id !== toolId));
    } else {
      saveFavorites([...favorites, toolId]);
    }
  };

  // Clear single items or total structures
  const handleClearHistory = () => {
    saveHistory([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    saveHistory(history.filter(item => item.id !== id));
  };

  // Find Tool details helper
  const activeTool = useMemo(() => {
    if (!selectedToolId) return null;
    return allTools.find(t => t.id === selectedToolId) || null;
  }, [selectedToolId, allTools]);

  // Deep navigation helpers
  const openTool = (toolId: string) => {
    setSelectedToolId(toolId);
    setCurrentToolOutput('');
    setGenerationError(null);
    setTab('tool');
    // Save to recently used if not already the newest
    setMobileMenuOpen(false);
  };

  const openCategory = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setTab('category-detail');
  };

  // Handle generation action
  const handleGenerate = async (inputs: Record<string, string>) => {
    if (!activeTool) return;
    setIsGenerating(true);
    setGenerationError(null);
    setCurrentToolOutput('');

    try {
      // Build prompt from template
      const fullPrompt = activeTool.promptTemplate(inputs);
      
      // Execute API call
      const textResult = await generateAIContent(fullPrompt, settings);
      
      setCurrentToolOutput(textResult);

      // Auto-save this output as a dynamic history record
      const newHistoryItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        toolId: activeTool.id,
        inputs: inputs,
        output: textResult,
        provider: settings.provider,
        timestamp: new Date().toISOString()
      };

      saveHistory([newHistoryItem, ...history]);

    } catch (err: any) {
      console.error(err);
      setGenerationError(err.message || t.errorOccurred);
    } finally {
      setIsGenerating(false);
    }
  };

  const saveManualResultToHistory = () => {
    if (!activeTool || !currentToolOutput) return;
    // Manual saving trigger for UI feedback
    const existItemIndex = history.findIndex(h => h.toolId === activeTool.id && h.output === currentToolOutput);
    if (existItemIndex === -1) {
      const newHistoryItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        toolId: activeTool.id,
        inputs: {},
        output: currentToolOutput,
        provider: settings.provider,
        timestamp: new Date().toISOString()
      };
      saveHistory([newHistoryItem, ...history]);
    }
  };

  // Search Engine Filtration
  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allTools.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query)
    );
  }, [searchQuery, allTools]);

  // Active Category Search Filter
  const activeCategoryTools = useMemo(() => {
    if (!selectedCategoryId) return [];
    return allTools.filter(t => t.categoryId === selectedCategoryId);
  }, [selectedCategoryId, allTools]);

  const activeCategoryDetails = useMemo(() => {
      if (!selectedCategoryId) return null;
      return localizedCategories.find(c => c.id === selectedCategoryId) || null;
    }, [selectedCategoryId, localizedCategories]);

  // General statistics
  const recentToolsUsed = useMemo(() => {
    // Extract unique tool IDs from history to find recently used
    const uniqueIds: string[] = [];
    history.forEach(item => {
      if (!uniqueIds.includes(item.toolId)) {
        uniqueIds.push(item.toolId);
      }
    });
    return uniqueIds.slice(0, 4).map(id => allTools.find(t => t.id === id)).filter(Boolean) as Tool[];
  }, [history, allTools]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-[#09090b] text-slate-800 dark:text-zinc-100 font-sans transition-all duration-300 pb-20 lg:pb-0 overflow-x-hidden">
      
      {/* Onboarding Overlay Screen */}
      {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} t={t} />}

      <div className="flex min-h-dvh lg:h-screen overflow-x-hidden lg:overflow-hidden relative">
        
        {/* Core Sidebar Container */}
        <Sidebar 
          currentTab={currentTab} 
          setTab={(tab) => {
            setTab(tab);
            setSelectedToolId(null);
            setSelectedCategoryId(null);
            setSearchQuery('');
          }} 
          favoritesCount={favorites.length}
          theme={theme}
          toggleTheme={toggleTheme}
          t={t}
        />

        {/* Outer content display wrapper */}
        <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden relative bg-slate-50 dark:bg-[#09090b] transition-colors duration-300 pb-20 lg:pb-0">
          
          {/* Main Top Navbar */}
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/85 px-3 sm:px-4 lg:px-6 py-3 lg:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between transition-colors duration-300">
            <div className="flex items-center gap-3">
              {/* Logo / Brand on mobile header */}
              <div className="lg:hidden flex items-center gap-2">
                <div className="p-2 bg-blue-600 rounded-xl text-white shadow-sm">
                  <Sparkles size={16} />
                </div>
                <h1 className="font-bold text-base text-slate-800 dark:text-zinc-100">{t.brandTitleMobile}</h1>
              </div>

              {/* Breadcrumbs for deep navigation */}
              <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-550 dark:text-zinc-500">
                <span className="hover:text-slate-800 dark:hover:text-zinc-300 cursor-pointer" onClick={() => { setTab('home'); setSelectedToolId(null); setSelectedCategoryId(null); setSearchQuery(''); }}>{t.breadcrumbHome}</span>
                {selectedCategoryId && (
                  <>
                    <ArrowLeft size={12} className="rtl:rotate-0 rotate-180" />
                    <span className="hover:text-slate-800 dark:hover:text-zinc-300 cursor-pointer" onClick={() => setTab('categories')}>{t.breadcrumbCategories}</span>
                    <ArrowLeft size={12} className="rtl:rotate-0 rotate-180" />
                    <span className="text-blue-600 dark:text-blue-400">{activeCategoryDetails?.name}</span>
                  </>
                )}
                {selectedToolId && activeTool && (
                  <>
                    <ArrowLeft size={12} className="rtl:rotate-0 rotate-180" />
                    <span className="hover:text-slate-800 dark:hover:text-zinc-300 cursor-pointer" onClick={() => { setTab('categories'); openCategory(activeTool.categoryId); }}>{localizedCategories.find(c => c.id === activeTool.categoryId)?.name}</span>
                    <ArrowLeft size={12} className="rtl:rotate-0 rotate-180" />
                    <span className="text-blue-600 dark:text-blue-400">{activeTool.title}</span>
                  </>
                )}
              </div>
            </div>

            {/* Quick Global Search Bar */}
            <div className="flex items-center gap-4">
              <div className="relative hidden md:block w-70">
                <input
                  id="top-search-input"
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-zinc-950/60 border border-slate-200 dark:border-zinc-850 text-slate-800 dark:text-zinc-100 rounded-2xl pl-10 pr-4 py-2 placeholder-slate-400 dark:placeholder-zinc-500 text-xs transition-all focus:border-blue-500"
                />
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              </div>

              {/* Multilingual Selector with flags */}
              <div id="language-switcher-group" className="flex items-center bg-slate-200/60 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-0.5 rounded-2xl gap-0.5">
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    id={`lang-select-${lang.id}`}
                    onClick={() => setLanguage(lang.id)}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      language === lang.id
                        ? 'bg-white dark:bg-zinc-950 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-100 dark:border-zinc-805'
                        : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                    }`}
                    title={lang.name}
                  >
                    <span className="text-sm">{lang.flag}</span>
                    <span className="hidden md:inline text-[9px] font-bold">{lang.id.toUpperCase()}</span>
                  </button>
                ))}
              </div>

              {/* Dedicated explicit theme switcher button group */}
              <div className="flex items-center bg-slate-200/60 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800/80 p-0.5 rounded-2xl gap-0.5">
                <button
                  id="theme-select-light"
                  onClick={() => setTheme('light')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    theme === 'light'
                      ? 'bg-white text-blue-600 shadow-sm border border-slate-100'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                  title={t.lightMode}
                >
                  <span>☀️</span>
                  <span className="hidden sm:inline text-[10px]">{t.lightMode.replace(/☀️|🌙|🌌/g, '').trim()}</span>
                </button>
                <button
                  id="theme-select-dim"
                  onClick={() => setTheme('dim')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dim'
                      ? 'bg-slate-300 dark:bg-zinc-850 text-amber-600 dark:text-amber-500 shadow-sm border border-amber-550/20'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                  title={t.dimMode}
                >
                  <span>🌙</span>
                  <span className="hidden sm:inline text-[10px]"> {t.dimMode.replace(/☀️|🌙|🌌/g, '').trim()}</span>
                </button>
                <button
                  id="theme-select-dark"
                  onClick={() => setTheme('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white dark:bg-zinc-950 text-indigo-600 dark:text-blue-400 shadow-sm border border-zinc-800'
                      : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
                  }`}
                  title={t.darkMode}
                >
                  <span>🌌</span>
                  <span className="hidden sm:inline text-[10px]">{t.darkMode.replace(/☀️|🌙|🌌/g, '').trim()}</span>
                </button>
              </div>

              <div className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 flex items-center gap-1.5 bg-slate-100 dark:bg-[#111113] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-855">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden xs:inline">{t.secureProtocolLabel}</span>
              </div>
            </div>
          </header>

          <div id="main-content-layout-container" className="flex-1 p-6 lg:p-8 space-y-8 max-w-7xl mx-auto w-full">

                {/* ERROR HANDLER TOAST BAR */}
            {generationError && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3 shadow-sm animate-shake">
                <ShieldAlert className="shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <h4 className="font-bold text-sm">{t.errorOccurred}</h4>
                  <p className="text-xs mt-1 leading-relaxed">{generationError}</p>
                </div>
              </div>
            )}

            {/* SEARCH RESULTS VIEW OVERLAY */}
            {searchQuery.trim() !== '' && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-bold text-lg text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                    <Search size={18} className="text-blue-500" />
                    <span>{t.searchResultTitle} "{searchQuery}"</span>
                  </h2>
                  <button onClick={() => setSearchQuery('')} className="text-xs text-slate-500 dark:text-zinc-400 hover:text-blue-500 underline">{t.searchCancel}</button>
                </div>
                {filteredTools.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => openTool(tool.id)}
                        className="p-5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl text-right transition-all hover:border-blue-500/50 hover:shadow-md cursor-pointer group flex flex-col justify-between h-full hover:-translate-y-0.5"
                      >
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="p-2.5 bg-blue-500/10 text-blue-550 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <DynamicIcon name={tool.icon} size={18} />
                            </div>
                            <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tool.title}</h4>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">{tool.description}</p>
                        </div>
                        <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold block mt-3 bg-slate-100 dark:bg-zinc-950 px-2.5 py-1 rounded-lg w-fit">
                          {localizedCategories.find(c => c.id === tool.categoryId)?.name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl">
                    <p className="text-sm text-slate-600 dark:text-zinc-400">{t.searchNoResults}</p>
                  </div>
                )}
              </div>
            )}

            {/* RENDER PAGES DYNAMICALLY */}

            {/* --- TAB 1: HOME PAGE --- */}
            {currentTab === 'home' && searchQuery.trim() === '' && (
              <div className="space-y-8 animate-fade-in font-sans">
                {/* Hero section banner */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-[#111113] dark:to-[#0d0d0f] text-slate-800 dark:text-white rounded-[2rem] p-6 lg:p-10 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl shadow-blue-500/5">
                  {/* Glowing blue accent in background */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-blue-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="relative space-y-4 max-w-xl">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">{t.allFeatures}</span>
                    <h1 className="text-2xl lg:text-3xl font-black leading-tight bg-gradient-to-l from-blue-650 via-slate-850 to-slate-900 dark:from-blue-200 dark:via-zinc-100 dark:to-white bg-clip-text text-transparent">{t.heroTitle}</h1>
                    <p className="text-sm text-slate-600 dark:text-zinc-300 leading-relaxed">
                      {t.heroDesc}
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button 
                        id="hero-explore-btn"
                        onClick={() => setTab('categories')} 
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                      >
                        {t.exploreTools}
                      </button>
                      <button 
                        id="hero-docs-btn"
                        onClick={() => setTab('about')}
                        className="px-4 py-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs rounded-xl transition-all cursor-pointer bg-white dark:bg-zinc-500/10"
                      >
                        {t.techDetails}
                      </button>
                    </div>
                  </div>

                  {/* Sparkles / Dynamic UI block */}
                  <div className="hidden md:flex relative p-8 bg-white dark:bg-zinc-900/60 border border-slate-200 dark:border-zinc-800 rounded-3xl w-56 h-56 items-center justify-center shrink-0">
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 to-transparent animate-pulse rounded-3xl" />
                    <div className="flex flex-col items-center gap-2 text-center">
                       <div className="text-blue-600 dark:text-blue-400 animate-spin-slow">
                        <Sparkles size={48} />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-zinc-500 block">{t.toolsAvailable}</span>
                      <span className="font-black text-2xl bg-gradient-to-l from-blue-600 to-indigo-600 bg-clip-text text-transparent mt-1">38</span>
                    </div>
                  </div>
                </div>

                {/* Categories Grid Preview Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-extrabold text-lg text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                      <LayoutGrid size={18} className="text-blue-500" />
                      <span>{t.categoriesGridTitle}</span>
                    </h2>
                    <button onClick={() => setTab('categories')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{t.viewAllCategories}</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {localizedCategories.map((category) => (
                      <button
                        key={category.id}
                       onClick={() => openCategory(category.id)}
  className="p-4 sm:p-5 lg:p-6 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800/80 hover:border-blue-500/40 rounded-2xl lg:rounded-[2rem] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 text-right cursor-pointer flex flex-col justify-between min-h-[135px] sm:min-h-[150px] lg:h-40 relative overflow-hidden group shadow-sm dark:shadow-none"
>
  <div className="absolute top-0 left-0 translate-x-3 -translate-y-3 opacity-[0.03] group-hover:opacity-[0.06] transition-opacity pointer-events-none">
    <DynamicIcon name={category.icon} size={150} />
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-[#111113] border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl text-slate-800 dark:text-zinc-100 w-fit">
                          <DynamicIcon name={category.icon} size={20} className="text-blue-500 dark:text-blue-400" />
                        </div>
                        <div className="mt-4">
                          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{category.name}</h4>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-500 line-clamp-2 leading-relaxed mt-1">{category.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Recently Used and Favorite Tools */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recently Used lists */}
                  <div className="space-y-4">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                      <HistoryIcon size={16} className="text-blue-500" />
                      <span>{t.recentToolsTitle}</span>
                    </h3>
                    {recentToolsUsed.length > 0 ? (
                      <div className="space-y-3">
                        {recentToolsUsed.map((tool) => (
                           <div
                            key={tool.id}
                            className="p-4 bg-white dark:bg-[#18181b]/90 hover:bg-slate-50 dark:hover:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between gap-4 transition-all shadow-sm dark:shadow-none"
                          >
                            <button
                              onClick={() => openTool(tool.id)}
                              className="flex items-center gap-3 text-right flex-1 cursor-pointer"
                            >
                              <div className="p-2 bg-blue-500/10 text-blue-550 dark:text-blue-450 rounded-xl">
                                <DynamicIcon name={tool.icon} size={16} />
                              </div>
                              <div>
                                <h4 className="font-bold text-xs text-slate-850 dark:text-zinc-100">{tool.title}</h4>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block mt-0.5">{localizedCategories.find(c => c.id === tool.categoryId)?.name}</span>
                              </div>
                            </button>
                            <button 
                              onClick={() => toggleFavorite(tool.id)} 
                              className="p-1.5 text-slate-400 dark:text-zinc-600 hover:text-blue-550 dark:hover:text-blue-400 rounded-xl transition-all cursor-pointer"
                            >
                              <Star size={16} fill={favorites.includes(tool.id) ? 'currentColor' : 'none'} className={favorites.includes(tool.id) ? 'text-blue-500' : 'text-slate-400 dark:text-zinc-600'} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center bg-white dark:bg-[#18181b]/30 border border-slate-200 dark:border-zinc-800 rounded-2xl text-xs text-slate-500 dark:text-zinc-500 shadow-sm dark:shadow-none">
                        {t.emptyRecentTools}
                      </div>
                    )}
                  </div>

                  {/* Highlights section / Tips */}
                  <div className="bg-[#18181b] border border-zinc-800 rounded-[2rem] p-6 flex flex-col justify-between h-full relative overflow-hidden">
                    <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
                    <div className="space-y-3 relative z-10">
                      <div className="p-3 bg-blue-500/10 border border-blue-505/20 text-blue-400 w-fit rounded-2xl">
                        <Cpu size={24} />
                      </div>
                      <h4 className="font-extrabold text-sm text-zinc-100">{t.connectionSecurityNotice}</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {t.connectionSecurityDesc}
                      </p>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {t.connectionSecuritySettingsLink}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 2: ALL CATEGORIES GRID --- */}
            {currentTab === 'categories' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.sectionsTitle}</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.sectionsDesc}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {localizedCategories.map((category) => {
                    const count = localizedTools.filter(t => t.categoryId === category.id).length;
                    return (
                      <button
                        key={category.id}
                        onClick={() => openCategory(category.id)}
                        className="p-4 sm:p-5 lg:p-6 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl lg:rounded-[2rem] text-right hover:border-blue-500/40 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 cursor-pointer flex flex-col justify-between min-h-[155px] sm:min-h-[175px] lg:h-48 relative overflow-hidden group shadow-sm dark:shadow-none"
                      >
                        <div className="absolute top-0 left-0 translate-x-3 -translate-y-3 opacity-[0.03] group-hover:scale-110 group-hover:opacity-[0.05] transition-all">
                          <DynamicIcon name={category.icon} size={150} />
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="p-3.5 bg-slate-50 dark:bg-[#111113] border border-slate-205 dark:border-zinc-800 shadow-sm rounded-xl text-slate-800 dark:text-zinc-100">
                            <DynamicIcon name={category.icon} size={20} className="text-blue-500 dark:text-blue-400" />
                          </div>
                          <span className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 dark:bg-zinc-950/80 text-slate-700 dark:text-zinc-300 rounded-lg">
{t.countTools.replace('{count}', String(count))}
                          </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{category.name}</h4>
                          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 line-clamp-2 leading-relaxed">{category.description}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* --- TAB 3: CATEGORY DETAIL --- */}
            {currentTab === 'category-detail' && selectedCategoryId && activeCategoryDetails && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setTab('categories')}
                      className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      <ArrowRight size={20} className="rtl:rotate-0 rotate-180" />
                    </button>
                    <div>
                      <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{activeCategoryDetails.name}</h2>
                      <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{activeCategoryDetails.description}</p>
                    </div>
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
                    {t.availableTools.replace('{count}', String(activeCategoryTools.length))}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
                  {activeCategoryTools.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => openTool(tool.id)}
                      className="p-4 sm:p-5 lg:p-6 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl text-right transition-all hover:border-blue-500/40 hover:shadow-md cursor-pointer group flex flex-col justify-between min-h-[140px] sm:min-h-[155px] lg:h-44 shadow-sm dark:shadow-none"
                    >
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-450 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                            <DynamicIcon name={tool.icon} size={18} />
                          </div>
                          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tool.title}</h4>
                        </div>
                        <p className="text-xs text-slate-550 dark:text-zinc-400 line-clamp-2 leading-relaxed">{tool.description}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-bold mt-2">
                        <span>{t.tryNow}</span>
                        <ArrowLeft size={10} className="rtl:rotate-0 rotate-180" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* --- TAB 4: ACTIVE TOOL WORKBENCH --- */}
            {currentTab === 'tool' && activeTool && (
              <div className="space-y-6 animate-fade-in">
                {/* Visual Tool navigation and action header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800/60">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => {
                        if (selectedCategoryId) {
                          setTab('category-detail');
                        } else {
                          setTab('home');
                        }
                      }}
                      className="p-2.5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm text-slate-600 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-white"
                    >
                      <ArrowRight size={18} className="rtl:rotate-0 rotate-180" />
                    </button>
                    <div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/25">
                        {localizedCategories.find(c => c.id === activeTool.categoryId)?.name}
                      </span>
                      <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100 mt-1">{activeTool.title}</h2>
                    </div>
                  </div>

                  {/* Actions: Favorite Toggle */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      id="tool-favorite-toggle"
                      onClick={() => toggleFavorite(activeTool.id)}
                      className={`w-full sm:w-auto justify-center px-4 py-2 text-xs font-semibold rounded-xl transition-all border flex items-center gap-2 cursor-pointer ${
                        favorites.includes(activeTool.id)
                          ? 'bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400 animate-pulse'
                          : 'bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-205 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 shadow-sm'
                      }`}
                    >
                      <Star size={14} fill={favorites.includes(activeTool.id) ? 'currentColor' : 'none'} />
                      <span>{favorites.includes(activeTool.id) ? t.removeFromFavorites : t.saveToFavorites}</span>
                    </button>
                  </div>
                </div>

                {/* Main Workbench layout grid */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-start">
                  {/* Left Column: Input Form (5 spans) */}
                  <div className="xl:col-span-5 h-full min-w-0">
                    <ToolForm 
                      tool={activeTool} 
                      onSubmit={handleGenerate} 
                      isLoading={isGenerating} 
                    />
                  </div>

                  {/* Right Column: Output Viewer (7 spans) */}
                  <div className="xl:col-span-7 h-full min-w-0">
                    <OutputView 
                      tool={activeTool} 
                      output={currentToolOutput} 
                      onClear={() => setCurrentToolOutput('')} 
                      isLoading={isGenerating}
                      onSaveOutputToHistory={saveManualResultToHistory}
                      t={t}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* --- TAB 5: FAVORITES TAB --- */}
            {currentTab === 'favorites' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.favoritesTitle}</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    {t.favoritesDesc}
                  </p>
                </div>

                {favorites.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {favorites.map((toolId) => {
                      const tool = allTools.find(t => t.id === toolId);
                      if (!tool) return null;
                      return (
                        <div
                          key={tool.id}
                          className="p-6 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl text-right transition-all hover:border-blue-500/40 hover:shadow-md flex flex-col justify-between h-48 relative group shadow-sm dark:shadow-none"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <button
                                onClick={() => openTool(tool.id)}
                                className="flex items-center gap-3 text-right cursor-pointer"
                              >
                                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-450 rounded-xl">
                                  <DynamicIcon name={tool.icon} size={18} />
                                </div>
                                <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{tool.title}</h4>
                              </button>
                              <button 
                                onClick={() => toggleFavorite(tool.id)} 
                                className="p-1.5 text-slate-400 dark:text-zinc-500 hover:text-blue-600 rounded-xl transition-all cursor-pointer"
                              >
                                <Star size={16} fill="currentColor" className="text-blue-500" />
                              </button>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed">{tool.description}</p>
                          </div>
                          <span className="text-[10px] text-slate-600 dark:text-zinc-500 font-bold block mt-3 bg-slate-100 dark:bg-zinc-950 px-2.5 py-1 rounded-lg w-fit">
                            {localizedCategories.find(c => c.id === tool.categoryId)?.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl shadow-sm dark:shadow-none">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-600 mb-4 inline-block">
                      <Star size={36} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200 font-sans">{t.noFavorites}</h4>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB 6: HISTORY TAB --- */}
            {currentTab === 'history' && (
              <div className="space-y-6 animate-fade-in font-sans">
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-zinc-805">
                  <div>
                    <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.historyTitle}</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                      {t.historyDesc}
                    </p>
                  </div>

                  {history.length > 0 && (
                    <button
                      id="btn-clear-all-history"
                      onClick={handleClearHistory}
                      className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 text-xs font-semibold rounded-xl border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 size={13} />
                      <span>{t.clearHistory}</span>
                    </button>
                  )}
                </div>

                {history.length > 0 ? (
                  <div className="space-y-6 font-sans">
                    {history.map((item) => {
                      const tool = allTools.find(t => t.id === item.toolId);
                      if (!tool) return null;
                      return (
                        <div
                          key={item.id}
                          className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 text-right space-y-4 font-sans shadow-sm dark:shadow-none"
                        >
                          <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-slate-100 dark:border-zinc-805/60">
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-450 rounded-xl">
                                <DynamicIcon name={tool.icon} size={15} />
                              </div>
                              <div>
                                <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{tool.title}</h3>
                                <span className="text-[10px] text-slate-500 dark:text-zinc-500 block mt-0.5">
                                  {t.by} {item.provider === 'gemini' ? 'Gemini API' : 'OpenRouter API'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-950 px-2 py-1 rounded">
                                {new Date(item.timestamp).toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'it-IT', { dateStyle: 'medium' })}
                              </span>
                              <button
                                onClick={() => handleDeleteHistoryItem(item.id)}
                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                                title={t.clearHistory}
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Inputs summary */}
                          {Object.keys(item.inputs).length > 0 && (
                            <div className="bg-slate-50 dark:bg-zinc-950/85 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-550 dark:text-zinc-400 space-y-1">
                              <strong className="text-slate-800 dark:text-zinc-200 block mb-1">
                                {t.inputsLabel}
                              </strong>
                              {Object.entries(item.inputs).map(([key, val]) => (
                                <div key={key} className="flex gap-2">
                                  <span className="font-semibold">{tool.inputs.find(i => i.id === key)?.label || key}:</span>
                                  <span className="truncate max-w-lg text-slate-700 dark:text-zinc-300">{val}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Output text box */}
                          <div className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-200 dark:border-zinc-800 rounded-xl line-clamp-5 hover:line-clamp-none transition-all duration-300">
                            {item.output}
                          </div>

                          {/* Action tools */}
                          <div className="pt-2 flex items-center gap-2 font-semibold">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(item.output);
                              }}
                              className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] rounded-lg border border-transparent transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Copy size={11} />
                              <span>{t.copyOutput}</span>
                            </button>
                            <button
                              onClick={() => {
                                setSelectedToolId(item.toolId);
                                setCurrentToolOutput(item.output);
                                setTab('tool');
                              }}
                              className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-650 dark:text-blue-400 text-[10px] rounded-lg border border-transparent transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <span>{t.openInWorkbench}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-205 dark:border-zinc-800 rounded-3xl shadow-sm dark:shadow-none">
                    <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500 mb-4 inline-block">
                      <HistoryIcon size={36} />
                    </div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{t.noHistory}</h4>
                  </div>
                )}
              </div>
            )}

            {/* --- TAB: CHAT ASSISTANT & TOOL BUILDER --- */}
{currentTab === 'chat' && (
  <div className="space-y-6 animate-fade-in text-right">
    <div>
      <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">
        {t.chatTitle}
      </h2>
      <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
        {t.chatDesc}
      </p>
    </div>

    <AiChatAssistant
      allTools={allTools}
      settings={settings}
      onOpenTool={openTool}
      onAddCustomTool={handleAddCustomTool}
      language={language}
    />
  </div>
)}

            {/* --- TAB 7: CONNECTION SETTINGS PAGE --- */}
            {currentTab === 'settings' && (
              <div className="space-y-6 animate-fade-in font-sans text-right">
                <div>
                  <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.settingsTitle}</h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
{t.settingsGuideDesc1}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* Form section (7 spans) */}
                  <div className="lg:col-span-7 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 dark:shadow-none">
                    <h3 className="font-extrabold text-base text-slate-800 dark:text-zinc-100 border-b border-slate-100 dark:border-zinc-800 pb-3">
                      {t.connectionSettingsTitle}
                    </h3>
                    
                    {/* Provider Select */}
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 block">{t.providerLabel}</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          id="provider-select-gemini"
                          type="button"
                          onClick={() => handleSaveSettings({ ...settings, provider: 'gemini' })}
                          className={`p-4 border rounded-2xl text-right transition-all cursor-pointer ${
                            settings.provider === 'gemini'
                              ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <h4 className="text-sm text-slate-800 dark:text-zinc-100">Google Gemini API</h4>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">{t.geminiDesc}</span>
                        </button>
                        
                        <button
                          id="provider-select-openrouter"
                          type="button"
                          onClick={() => handleSaveSettings({ ...settings, provider: 'openrouter' })}
                          className={`p-4 border rounded-2xl text-right transition-all cursor-pointer ${
                            settings.provider === 'openrouter'
                              ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold'
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                          }`}
                        >
                          <h4 className="text-sm text-slate-800 dark:text-zinc-100">OpenRouter</h4>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">{t.openrouterDesc}</span>
                        </button>
                      </div>
                    </div>

                    {/* Enable custom keys */}
                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-805 rounded-2xl">
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-100">{t.useCustomKeys}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">{t.customKeysDesc}</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          id="custom-keys-toggle"
                          type="checkbox"
                          checked={settings.useCustomKeys}
                          onChange={(e) => handleSaveSettings({ ...settings, useCustomKeys: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:-translate-x-5 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                      </label>
                    </div>

                    {/* Custom Keys Fields inputs */}
                    {settings.useCustomKeys && (
                      <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-850 animate-fade-in">
                        <div className="space-y-1.5 text-right">
                          <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                            <span>{t.geminiKeyLabel}</span>
                            <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 underline">{t.getFreeKey}</a>
                          </label>
                          <input
                            id="input-setting-gemini"
                            type="password"
                            placeholder="AlzaSy..."
                            value={settings.geminiKey}
                            onChange={(e) => handleSaveSettings({ ...settings, geminiKey: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:border-amber-400"
                          />
                        </div>

                        <div className="space-y-1.5 text-right">
                          <label className="text-xs font-semibold text-slate-705 dark:text-zinc-300 flex items-center justify-between">
                            <span>{t.openrouterKeyLabel}</span>
                            <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 underline">{t.getOpenrouterKey}</a>
                          </label>
                          <input
                            id="input-setting-openrouter"
                            type="password"
                            placeholder="sk-or-v1-..."
                            value={settings.openRouterKey}
                            onChange={(e) => handleSaveSettings({ ...settings, openRouterKey: e.target.value })}
                            className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:border-amber-400"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Guide column (5 spans) */}
                  <div className="lg:col-span-12 xl:col-span-5 bg-gradient-to-tr from-amber-500/5 to-orange-500/5 border border-amber-500/10 dark:border-amber-900/20 rounded-3xl p-6 lg:p-8 space-y-4 text-right">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                      <ShieldAlert size={16} className="text-amber-500" />
                      <span>{t.settingsGuideTitle}</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
{t.settingsDesc}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                      {t.settingsGuideDesc2}
                    </p>
                    
                    <div className="pt-2">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white mb-2">{t.settingsGuideSteps}</h4>
                      <ol className="text-[11px] text-slate-500 dark:text-slate-400 list-decimal list-inside space-y-1.5">
                        <li>{t.guideStep1}</li>
                        <li>{t.guideStep2}</li>
                        <li>{t.guideStep3}</li>
                        <li>{t.guideStep4}</li>
                      </ol>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* --- TAB 8: ABOUT PLATFORM TAB --- */}
            {currentTab === 'about' && (
              <div className="space-y-8 animate-fade-in text-right font-sans">
                {/* Header card banner */}
                <div className="p-8 lg:p-12 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm dark:shadow-none animate-fade-in">
                  <div className="space-y-4">
                    <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-orange-600 dark:text-amber-400 rounded-full font-bold text-[10px] tracking-wide uppercase">
{t.aboutVersion}
                    </span>
                    <h2 className="font-extrabold text-2xl lg:text-3xl text-slate-800 dark:text-zinc-100">{t.aboutTitle}</h2>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xl">
                      {t.aboutDesc}
                    </p>
                  </div>
                  <div className="p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shrink-0 flex items-center justify-center w-40 h-40">
                    <Sparkles size={64} className="text-amber-500 animate-pulse" />
                  </div>
                </div>

                {/* Sub features / Technology layout lists */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#18181b] p-6 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs dark:shadow-none space-y-3 text-right">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">{t.aboutFeature1Title}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{t.aboutFeature1Desc}</p>
                  </div>

                  <div className="bg-white dark:bg-[#18181b] p-6 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs dark:shadow-none space-y-3 text-right">
                    <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">{t.aboutFeature2Title}</h3>
                    <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{t.aboutFeature2Desc}</p>
                  </div>
                </div>
              </div>
            )}

          </div>

        </main>
      </div>
    </div>
  );
}
