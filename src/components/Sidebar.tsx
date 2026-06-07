import logoSrc from '../assets/logo.png';
import { 
  Home, 
  LayoutGrid, 
  Star, 
  History as HistoryIcon, 
  User, 
  HelpCircle, 
  Sun, 
  Moon, 
  Sparkles,
  Search,
  Library,
  Globe,
  Workflow,
  Plus,
  LogIn,
  Wrench
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UserMenu from './UserMenu';

interface SidebarProps {
  currentTab: string;
  setTab: (tab: string) => void;
  favoritesCount: number;
  theme: 'light' | 'dim' | 'dark';
  toggleTheme: () => void;
  t: any;
  onOpenAuth?: () => void;
  toolsCount?: number;
}

const routeForTab: Record<string, string> = {
  home: '/home',
  chat: '/assistant',
  categories: '/categories',
  library: '/library',
  workflows: '/workflows',
  community: '/community',
  'my-tools': '/my-tools',
  favorites: '/favorites',
  history: '/history',
  profile: '/account',
};

export default function Sidebar({ 
  currentTab, 
  setTab, 
  favoritesCount, 
  theme, 
  toggleTheme,
  t,
  onOpenAuth,
  toolsCount
}: SidebarProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const navItems = [
    { id: 'home', label: t.home, icon: Home },
    { id: 'chat', label: t.chatAssistant, icon: Sparkles },
    { id: 'categories', label: t.categories, icon: LayoutGrid },
    { id: 'library', label: t.libraryNav || 'المكتبة', icon: Library },
    { id: 'workflows', label: t.workflowsNav || 'الرحلات', icon: Workflow },
    { id: 'community', label: t.communityNav || 'المجتمع', icon: Globe },
    { id: 'my-tools', label: t.myToolsNav || 'أدواتي', icon: Wrench, badge: toolsCount && toolsCount > 0 ? toolsCount : undefined },
    { id: 'favorites', label: t.favorites, icon: Star, badge: favoritesCount > 0 ? favoritesCount : undefined },
    { id: 'history', label: t.history, icon: HistoryIcon },
    { id: 'profile', label: t.profile, icon: User },
  ];

  const handleCreateTool = () => navigate('/create-tool');

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[#f8fafc] dark:bg-[#111113] border-l border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 h-screen sticky top-0 transition-colors duration-300">
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={logoSrc} alt="AI Hub" className="w-10 h-10 shrink-0 object-contain rounded-xl" />
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
            const to = routeForTab[item.id] || `/${item.id}`;
            return (
              <NavLink
                key={item.id}
                to={to}
                id={`nav-link-${item.id}`}
                end={item.id === 'home'}
                className={({ isActive }) =>
                  `w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-250 group text-sm ${
                    isActive
                      ? 'bg-blue-50 dark:bg-zinc-800/60 text-blue-600 dark:text-blue-400 border border-blue-105 dark:border-zinc-700/50 font-bold'
                      : 'text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/30 hover:text-slate-900 dark:hover:text-white'
                  }`
                }
              >
                <div className="flex items-center gap-3 font-medium">
                  <Icon size={17} className="transition-colors group-hover:text-inherit" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-600 text-white rounded-full">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Create Tool Button */}
        <div className="px-4 py-2">
          <button
            onClick={handleCreateTool}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            <Plus size={15} />
            <span>{t.createToolNav || 'أداة جديدة'}</span>
          </button>
        </div>

        {/* Connection status section */}
        <div className="px-6 py-4">
          <div
            onClick={() => navigate('/settings')}
            className="bg-slate-100 dark:bg-zinc-900/65 rounded-2xl p-4 border border-slate-200 dark:border-zinc-800/80 cursor-pointer hover:bg-slate-200 dark:hover:bg-zinc-800/80 transition-all"
          >
            <p className="text-[10px] text-slate-500 dark:text-zinc-500 mb-2 uppercase tracking-widest font-black">{t.serviceStatus}</p>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300">{t.geminiActiveStatus || 'Gemini AI Active'}</span>
            </div>
          </div>
        </div>

        {/* Auth Section */}
        <div className="px-3 py-2 border-t border-slate-200 dark:border-zinc-800">
          {user ? (
            <UserMenu t={t} />
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-zinc-800/50 rounded-xl transition-all cursor-pointer"
            >
              <LogIn size={14} />
              <span>{t.signIn || 'Sign In'}</span>
            </button>
          )}
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
        className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f8fafc]/95 dark:bg-[#111113]/95 backdrop-blur-md border-t border-slate-250 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 transition-colors duration-300 shadow-lg"
        style={{ 
          paddingTop: '0.5rem', 
          paddingBottom: 'calc(0.5rem + var(--safe-area-inset-bottom))' 
        }}
      >
        <div className="flex overflow-x-auto flex-nowrap gap-0.5 px-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const to = routeForTab[item.id] || `/${item.id}`;
            return (
              <NavLink
                key={item.id}
                to={to}
                id={`nav-mobile-${item.id}`}
                end={item.id === 'home'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center relative shrink-0 py-1 px-1.5 rounded-lg transition-all ${
                    isActive ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 hover:dark:text-white'
                  }`
                }
              >
                <Icon size={15} className="mb-0.5" />
                <span className="text-[8px] leading-tight tracking-tight truncate max-w-[50px]">{item.label}</span>
                {item.badge !== undefined && (
                  <span className="absolute -top-0.5 right-1/2 translate-x-2 bg-blue-600 text-white text-[7px] font-bold h-3.5 min-w-[14px] flex items-center justify-center rounded-full px-0.5">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
          
          {/* Mobile Quick Theme Toggle */}
          <button
            id="theme-toggle-mobile"
            onClick={toggleTheme}
            className="flex flex-col items-center justify-center shrink-0 py-1 px-1.5 text-slate-500 dark:text-zinc-400 hover:text-slate-900 hover:dark:text-white"
          >
            {theme === 'light' ? (
              <Sun size={15} className="text-amber-500 mb-0.5" />
            ) : theme === 'dim' ? (
              <Moon size={15} className="text-yellow-500 animate-pulse mb-0.5" />
            ) : (
              <Sparkles size={15} className="text-violet-500 mb-0.5" />
            )}
            <span className="text-[8px] leading-tight tracking-tight">{t.dimMode || 'Theme'}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
