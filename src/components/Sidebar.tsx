import { 
  Home, 
  LayoutGrid, 
  Star, 
  History as HistoryIcon, 
  Settings, 
  HelpCircle, 
  Sun, 
  Moon, 
  Sparkles,
  Search
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  favoritesCount: number;
  theme: 'light' | 'dim' | 'dark';
  toggleTheme: () => void;
  t: any;
}

export default function Sidebar({ 
  currentTab, 
  setTab, 
  favoritesCount, 
  theme, 
  toggleTheme,
  t
}: SidebarProps) {
  
  const navItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'chat', label: t.chatAssistant, icon: Sparkles },
    { id: 'categories', label: t.categories, icon: LayoutGrid },
    { id: 'favorites', label: t.favorites, icon: Star, badge: favoritesCount > 0 ? favoritesCount : undefined },
    { id: 'history', label: t.history, icon: HistoryIcon },
    { id: 'settings', label: t.settings, icon: Settings },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#f8fafc] dark:bg-[#111113] border-l border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 h-screen sticky top-0 transition-colors duration-300">
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-lg font-black shadow-lg shadow-blue-900/40 text-white">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight bg-gradient-to-l from-blue-600 dark:from-blue-400 to-slate-900 dark:to-white bg-clip-text text-transparent">{t.appTitle}</h1>
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-zinc-500">{t.appSubtitle}</span>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-250 group text-sm ${
                  isActive 
                    ? 'bg-blue-50 dark:bg-zinc-800/60 text-blue-600 dark:text-blue-400 border border-blue-105 dark:border-zinc-700/50 font-bold' 
                    : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/30 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3 font-medium">
                  <Icon size={17} className={`transition-colors ${isActive ? 'text-blue-500 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500 group-hover:text-slate-900 group-hover:dark:text-white'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Connection status section inside Sidebar (as shown in Design HTML) */}
        <div className="px-6 py-4">
          <div className="bg-slate-100 dark:bg-zinc-900/65 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800/80">
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-2 uppercase tracking-widest font-black">{t.serviceStatus}</p>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Gemini AI Active</span>
            </div>
          </div>
        </div>

        {/* Footer Settings & Theme */}
        <div className="p-4 border-t border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <button
            id="theme-toggle-desktop"
            onClick={toggleTheme}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white p-2.5 rounded-xl bg-slate-100 dark:bg-zinc-800/10 hover:bg-slate-200 dark:hover:bg-zinc-800/50 transition-all w-full justify-center border border-slate-200 dark:border-zinc-800/50"
          >
            {theme === 'light' ? (
              <>
                <Sun size={15} className="text-amber-500" />
                <span>{t.lightMode}</span>
              </>
            ) : theme === 'dim' ? (
              <>
                <Moon size={15} className="text-yellow-500 animate-pulse" />
                <span>{t.dimMode}</span>
              </>
            ) : (
              <>
                <Sparkles size={15} className="text-violet-500" />
                <span>{t.darkMode}</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f8fafc]/95 dark:bg-[#111113]/95 backdrop-blur-md border-t border-slate-250 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 flex justify-around px-3 transition-colors duration-300 shadow-lg"
        style={{ 
          paddingTop: '0.5rem', 
          paddingBottom: 'calc(0.5rem + var(--safe-area-inset-bottom))' 
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-mobile-${item.id}`}
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center justify-center relative flex-1 py-1.5 px-1 rounded-lg transition-all ${
                isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 hover:dark:text-white'
              }`}
            >
              <Icon size={18} className={`mb-1 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-zinc-500'}`} />
              <span className="text-[9px] tracking-tight truncate">{item.label}</span>
              {item.badge !== undefined && (
                <span className="absolute -top-1 right-2/4 translate-x-3 bg-blue-600 text-white text-[9px] font-bold h-4 min-w-[16px] flex items-center justify-center rounded-full px-1">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
        
        {/* Mobile Quick Theme Toggle */}
        <button
          id="theme-toggle-mobile"
          onClick={toggleTheme}
          className="flex flex-col items-center justify-center flex-1 py-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-900 hover:dark:text-white"
        >
          {theme === 'light' ? (
            <Sun size={18} className="text-amber-500" />
          ) : theme === 'dim' ? (
            <Moon size={18} className="text-yellow-500 animate-pulse" />
          ) : (
            <Sparkles size={18} className="text-violet-500" />
          )}
          <span className="text-[9px] font-bold tracking-tight">{t.dimMode || 'Theme'}</span>
        </button>
      </nav>
    </>
  );
}
