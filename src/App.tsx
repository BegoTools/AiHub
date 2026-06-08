import { useState, useEffect, useMemo } from 'react';
import { useAuth } from './context/AuthContext';
import { getFirstName } from './utils/getFirstName';
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

import { Category, Tool, HistoryItem } from './types';
import { tools as arabicTools } from './data/tools';
import { getLocalizedTools, getLocalizedCategories } from './utils/localize-content';
import { LOCAL_STORAGE_KEYS } from './config/apiConfig';
import { generateAIContent } from './services/aiService';
import { getFavorites as loadFavoritesFromDB, toggleFavorite as toggleFavInDB } from './services/favoritesService';
import { saveResult as saveResultToDB, deleteSavedResult, clearAllResults, getSavedResults } from './services/resultsService';
import { createCustomTool, getAllPublicTools } from './services/customToolsService';
import { StoredCustomTool } from './types/storageTypes';
import { getUserSettings, upsertUserSettings } from './services/userSettingsService';
import { languages, translations, Language } from './translations';

import logoSrc from './assets/logo.png';
import Sidebar from './components/Sidebar';
import ToolForm, { DynamicIcon } from './components/ToolForm';
import OutputView from './components/OutputView';
import Onboarding from './components/Onboarding';
import AiChatAssistant from './components/AiChatAssistant';
import AuthModal from './components/AuthModal';
import ErrorBoundary from './components/ErrorBoundary';
import LibraryPage from './pages/LibraryPage';
import CommunityToolsPage from './pages/CommunityToolsPage';
import CreateToolWizard from './pages/CreateToolWizard';
import WorkflowRunner from './pages/WorkflowRunner';
import { workflows } from './data/workflows';
import { useNavigate, useLocation } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentRoute = pathParts[0] || 'home';
  const routeParam = pathParts[1] || null;

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authGuardMessage, setAuthGuardMessage] = useState('');
  const [pendingToolId, setPendingToolId] = useState<string | null>(null);
  const { user } = useAuth();

  const [customTools, setCustomTools] = useState<Tool[]>([]);

  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('ai_hub_language');
    return (saved as Language) || 'ar';
  });

  const localizedCategories = useMemo(() => getLocalizedCategories(language), [language]);
  const localizedTools = useMemo(() => getLocalizedTools(language), [language]);

  const allTools = useMemo(() => {
    return [...localizedTools, ...customTools];
  }, [localizedTools, customTools]);

  const [searchQuery, setSearchQuery] = useState('');

  const [favorites, setFavorites] = useState<string[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [theme, setTheme] = useState<'light' | 'dim' | 'dark'>('light');
  const [showOnboarding, setShowOnboarding] = useState(false);

  const t = useMemo(() => {
    return translations[language] || translations['ar'];
  }, [language]);

  useEffect(() => {
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    if (user) {
      upsertUserSettings(user.id, { language }).catch(() => {});
    } else {
      localStorage.setItem('ai_hub_language', language);
    }
  }, [language, user]);

  // Load public community tools on mount (no auth required)
  useEffect(() => {
    refreshPublicTools();
  }, []);

  async function refreshPublicTools() {
    try {
      const publicTools = await getAllPublicTools();
      if (publicTools.length > 0) {
        setCustomTools(prev => {
          const existingIds = new Set(prev.map(t => t.id));
          const newTools = publicTools
            .filter(st => !existingIds.has(st.id))
            .map(storedToRuntimeTool);
          return [...prev, ...newTools];
        });
      }
    } catch {}
  }

  function storedToRuntimeTool(st: StoredCustomTool): Tool {
    return {
      id: st.id,
      categoryId: st.category,
      title: st.title,
      description: st.description,
      icon: st.icon || 'Sparkles',
      inputs: st.inputFields || [],
      exampleInput: {},
      promptTemplate: (inputs: Record<string, string>) => {
        let template = st.promptTemplateString || '';
        Object.keys(inputs).forEach(key => {
          template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), inputs[key]);
        });
        return template;
      },
      tags: st.tags,
    };
  }

  // Reset saved theme to light once on first load after this update
  useEffect(() => {
    if (!localStorage.getItem(LOCAL_STORAGE_KEYS.THEME_RESET)) {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.THEME);
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME_RESET, '1');
    }
  }, []);

  const [currentToolOutput, setCurrentToolOutput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [showCreateTool, setShowCreateTool] = useState(false);
  const [activeWorkflowId, setActiveWorkflowId] = useState<string | null>(null);

  // Load all user data from Supabase when auth state changes
  useEffect(() => {
    if (user) {
      loadUserData(user.id);
    } else {
      setFavorites([]);
      setHistory([]);
      setCustomTools([]);
      setShowOnboarding(false);

      const savedTheme = localStorage.getItem(LOCAL_STORAGE_KEYS.THEME) as 'light' | 'dim' | 'dark' | null;
      if (savedTheme) setTheme(savedTheme);
      else setTheme('light');

      const savedOnboarding = localStorage.getItem(LOCAL_STORAGE_KEYS.ONBOARDED);
      if (!savedOnboarding) setShowOnboarding(true);
    }
  }, [user]);

  async function loadUserData(userId: string) {
    try {
      const [settings, favs, results] = await Promise.all([
        getUserSettings(userId),
        loadFavoritesFromDB(),
        getSavedResults(),
      ]);

      setLanguage(settings.language as Language || 'ar');
      setTheme(settings.theme || 'light');
      if (!settings.onboarding_completed) setShowOnboarding(true);

      setFavorites(favs);

      const mappedHistory: HistoryItem[] = results.map(r => ({
        id: r.id,
        toolId: r.toolId || '',
        inputs: r.metadata?.inputs || {},
        output: r.content || '',
        provider: r.metadata?.provider || 'gemini',
        timestamp: r.createdAt,
      }));
      setHistory(mappedHistory);
    } catch (e) {
      console.error('[App] Failed to load user data:', e);
    }
  }

  // Sync theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark', 'dim');
    if (theme === 'dark') root.classList.add('dark');
    else if (theme === 'dim') root.classList.add('dark', 'dim');
    else root.classList.add('light');

    if (user) {
      upsertUserSettings(user.id, { theme }).catch(() => {});
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEYS.THEME, theme);
    }
  }, [theme, user]);

  const toggleTheme = () => {
    setTheme(prev => {
      if (prev === 'light') return 'dim';
      if (prev === 'dim') return 'dark';
      return 'light';
    });
  };

  const handleCompleteOnboarding = () => {
    setShowOnboarding(false);
    if (user) {
      upsertUserSettings(user.id, { onboarding_completed: true }).catch(() => {});
    } else {
      localStorage.setItem(LOCAL_STORAGE_KEYS.ONBOARDED, 'true');
    }
  };

  const saveFavorites = async (newFavs: string[]) => {
    setFavorites(newFavs);
    if (!user) return;
    const current = await loadFavoritesFromDB();
    const toAdd = newFavs.filter(id => !current.includes(id));
    const toRemove = current.filter(id => !newFavs.includes(id));
    for (const id of toAdd) {
      await toggleFavInDB(id);
    }
    for (const id of toRemove) {
      await toggleFavInDB(id);
    }
  };

  const saveHistory = async (newHistory: HistoryItem[]) => {
    setHistory(newHistory);
    if (!user) return;
    const current = await getSavedResults();
    const currentIds = current.map(r => r.id);
    const newIds = newHistory.map(h => h.id);
    const toAdd = newHistory.filter(h => !currentIds.includes(h.id));
    const toRemove = current.filter(r => !newIds.includes(r.id));
    for (const item of toRemove) {
      await deleteSavedResult(item.id);
    }
    for (const item of toAdd) {
      await saveResultToDB({
        id: item.id,
        title: `${allTools.find(t => t.id === item.toolId)?.title || 'أداة'} - ${new Date(item.timestamp).toLocaleDateString()}`,
        toolId: item.toolId,
        toolName: allTools.find(t => t.id === item.toolId)?.title || '',
        content: item.output,
        type: 'markdown',
        isFavorite: false,
        source: 'generation',
        metadata: { inputs: item.inputs, provider: item.provider },
      });
    }
  };

  const toggleFavorite = async (toolId: string) => {
    if (!user) return;
    const { isFav, favorites: updated } = await toggleFavInDB(toolId);
    setFavorites(updated);
  };

  const handleClearHistory = () => {
    saveHistory([]);
  };

  const handleDeleteHistoryItem = (id: string) => {
    saveHistory(history.filter(item => item.id !== id));
  };

  const handleAddCustomTool = async (newToolRaw: any) => {
    if (arabicTools.some(t => t.id === newToolRaw.id) || customTools.some(t => t.id === newToolRaw.id)) return;

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

    setCustomTools(prev => [...prev, newTool]);

    if (user) {
      try {
        await createCustomTool({
          id: newToolRaw.id,
          title: newToolRaw.title || newToolRaw.id,
          description: newToolRaw.description || '',
          category: newToolRaw.categoryId || 'general',
          icon: newToolRaw.icon || 'Sparkles',
          visibility: 'public',
          promptTemplateString: newToolRaw.promptTemplateString || '',
          inputFields: newToolRaw.inputs || [],
          tags: newToolRaw.tags || [],
          ownerId: user.id,
          createdByName: newToolRaw.createdByName || getFirstName(undefined, user.user_metadata, user.email),
        });
        await refreshPublicTools();
      } catch (e) {
        console.error('[App] Failed to save custom tool:', e);
      }
    }
  };

  const activeTool = useMemo(() => {
    if (currentRoute !== 'tools' || !routeParam) return null;
    return allTools.find(t => t.id === routeParam) || null;
  }, [currentRoute, routeParam, allTools]);

  const openTool = (toolId: string) => {
    if (!user) {
      setAuthGuardMessage(t.authRequiredForTool);
      setPendingToolId(toolId);
      setShowAuthModal(true);
      return;
    }
    setCurrentToolOutput('');
    setGenerationError(null);
    setShowCreateTool(false);
    setActiveWorkflowId(null);
    setMobileMenuOpen(false);
    navigate('/tools/' + toolId);
  };

  useEffect(() => {
    if (user && pendingToolId) {
      const id = pendingToolId;
      setPendingToolId(null);
      setCurrentToolOutput('');
      setGenerationError(null);
      setShowCreateTool(false);
      setActiveWorkflowId(null);
      setMobileMenuOpen(false);
      navigate('/tools/' + id);
    }
  }, [user]);

  const navigateToTab = (tab: string) => {
    setSearchQuery('');
    setShowCreateTool(false);
    setActiveWorkflowId(null);
    setMobileMenuOpen(false);
    if (tab === 'create-tool') navigate('/create-tool');
    else if (tab === 'home') navigate('/home');
    else navigate(`/${tab}`);
  };

  const handleGenerate = async (inputs: Record<string, string>) => {
    if (!activeTool) return;
    setIsGenerating(true);
    setGenerationError(null);
    setCurrentToolOutput('');

    try {
      let imageBase64: string | undefined;
      let imageMimeType: string | undefined;
      for (const input of activeTool.inputs) {
        if (input.type === 'image') {
          console.log("=== HANDLEGENERATE: Found image input ===", input.id);
          console.log("input value (first 80):", inputs[input.id]?.substring(0, 80));
          console.log("starts with 'data:'?", inputs[input.id]?.startsWith('data:'));
          if (inputs[input.id]?.startsWith('data:')) {
            const dataUrl = inputs[input.id];
            const parts = dataUrl.split(',');
            imageBase64 = parts[1];
            imageMimeType = parts[0].split(':')[1]?.split(';')[0] || 'image/jpeg';
            console.log("Extracted base64 length:", imageBase64.length);
            console.log("Extracted mimeType:", imageMimeType);
          }
          break;
        }
      }

      const fullPrompt = activeTool.promptTemplate(inputs);
      console.log("Calling generateAIContent with imageBase64 present:", !!imageBase64);
      const textResult = await generateAIContent(fullPrompt, imageBase64, imageMimeType);
      setCurrentToolOutput(textResult);

      const newHistoryItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        toolId: activeTool.id,
        inputs: inputs,
        output: textResult,
        provider: 'gemini',
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
    const existItemIndex = history.findIndex(h => h.toolId === activeTool.id && h.output === currentToolOutput);
    if (existItemIndex === -1) {
      const newHistoryItem: HistoryItem = {
        id: `hist_${Date.now()}`,
        toolId: activeTool.id,
        inputs: {},
        output: currentToolOutput,
        provider: 'gemini',
        timestamp: new Date().toISOString()
      };
      saveHistory([newHistoryItem, ...history]);
    }
  };

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allTools.filter(t => 
      t.title.toLowerCase().includes(query) || 
      t.description.toLowerCase().includes(query)
    );
  }, [searchQuery, allTools]);

  const activeCategoryDetails = useMemo(() => {
    if (currentRoute !== 'categories' || !routeParam) return null;
    return localizedCategories.find(c => c.id === routeParam) || null;
  }, [currentRoute, routeParam, localizedCategories]);

  const recentToolsUsed = useMemo(() => {
    const uniqueIds: string[] = [];
    history.forEach(item => {
      if (!uniqueIds.includes(item.toolId)) uniqueIds.push(item.toolId);
    });
    return uniqueIds.slice(0, 4).map(id => allTools.find(t => t.id === id)).filter(Boolean) as Tool[];
  }, [history, allTools]);

  return (
    <div className="min-h-dvh bg-slate-50 dark:bg-[#09090b] text-slate-800 dark:text-zinc-100 font-sans transition-all duration-300 pb-20 lg:pb-0 overflow-x-hidden">
      
      {showOnboarding && <Onboarding onComplete={handleCompleteOnboarding} t={t} />}

      <div className="flex min-h-dvh lg:h-screen overflow-x-hidden lg:overflow-hidden relative">
        
        <Sidebar 
          currentTab={currentRoute === 'create-tool' ? 'home' : (currentRoute === '' ? 'home' : currentRoute)}
          setTab={navigateToTab}
          favoritesCount={favorites.length}
          theme={theme}
          toggleTheme={toggleTheme}
          t={t}
          onOpenAuth={() => setShowAuthModal(true)}
          toolsCount={customTools.length}
        />

        <main className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden relative bg-slate-50 dark:bg-[#09090b] transition-colors duration-300 pb-20 lg:pb-0">
          
          <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#09090b]/80 backdrop-blur-md border-b border-slate-200 dark:border-zinc-800/85 px-3 sm:px-4 lg:px-6 py-3 lg:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="lg:hidden flex items-center gap-2">
                <img src={logoSrc} alt="AI HUB" className="w-8 h-8 object-contain rounded-lg" />
                <h1 className="font-bold text-base text-slate-800 dark:text-zinc-100">{t.appTitle}</h1>
              </div>

              <div className="hidden lg:flex items-center gap-2 text-xs font-semibold text-slate-550 dark:text-zinc-500">
                <span className="hover:text-slate-800 dark:hover:text-zinc-300 cursor-pointer" onClick={() => { navigate('/home'); setSearchQuery(''); }}>{t.breadcrumbHome}</span>
                {currentRoute === 'categories' && routeParam && activeCategoryDetails && (
                  <>
                    <ArrowLeft size={12} className="rtl:rotate-0 rotate-180" />
                    <span className="hover:text-slate-800 dark:hover:text-zinc-300 cursor-pointer" onClick={() => navigate('/categories')}>{t.breadcrumbCategories}</span>
                    <ArrowLeft size={12} className="rtl:rotate-0 rotate-180" />
                    <span className="text-blue-600 dark:text-blue-400">{activeCategoryDetails.name}</span>
                  </>
                )}
                {currentRoute === 'tools' && routeParam && activeTool && (
                  <>
                    <ArrowLeft size={12} className="rtl:rotate-0 rotate-180" />
                    <span className="hover:text-slate-800 dark:hover:text-zinc-300 cursor-pointer" onClick={() => navigate('/categories')}>{localizedCategories.find(c => c.id === activeTool.categoryId)?.name}</span>
                    <ArrowLeft size={12} className="rtl:rotate-0 rotate-180" />
                    <span className="text-blue-600 dark:text-blue-400">{activeTool.title}</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="lg:hidden flex items-center">
                {user ? (
                  <button
                    onClick={() => navigate('/account')}
                    className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer shrink-0 overflow-hidden"
                    title={getFirstName(undefined, user.user_metadata, user.email)}
                  >
                    {user.user_metadata?.avatar_url || user.user_metadata?.picture ? (
                      <img
                        src={user.user_metadata?.avatar_url || user.user_metadata?.picture}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getFirstName(undefined, user.user_metadata, user.email)[0].toUpperCase()
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer whitespace-nowrap"
                  >
                    {t.signIn || 'تسجيل الدخول'}
                  </button>
                )}
              </div>
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
            <ErrorBoundary fallbackTitle="حدث خطأ أثناء تحميل الصفحة" fallbackMessage="قد يكون بسبب خطأ مؤقت. حاول إعادة التحميل أو العودة للصفحة الرئيسية.">

            {generationError && (
              <div className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl flex items-start gap-3 shadow-sm animate-shake">
                <ShieldAlert className="shrink-0 mt-0.5 text-rose-500" />
                <div>
                  <h4 className="font-bold text-sm">{t.errorOccurred}</h4>
                  <p className="text-xs mt-1 leading-relaxed">{generationError}</p>
                </div>
              </div>
            )}

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

            <AppRoutes
              t={t}
              language={language}
              allTools={allTools}
              localizedCategories={localizedCategories}
              favorites={favorites}
              toggleFavorite={toggleFavorite}
              openTool={openTool}
              recentToolsUsed={recentToolsUsed}
              history={history}
              handleClearHistory={handleClearHistory}
              handleDeleteHistoryItem={handleDeleteHistoryItem}
              handleGenerate={handleGenerate}
              currentToolOutput={currentToolOutput}
              setCurrentToolOutput={setCurrentToolOutput}
              isGenerating={isGenerating}
              saveManualResultToHistory={saveManualResultToHistory}
              workflows={workflows}
              onAddCustomTool={handleAddCustomTool}
              onOpenAuth={(msg) => { setAuthGuardMessage(msg); setShowAuthModal(true); }}
            />

            </ErrorBoundary>
          </div>

        </main>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => { setShowAuthModal(false); setAuthGuardMessage(''); }}
          t={t}
          message={authGuardMessage}
        />
      </div>
    </div>
  );
}
