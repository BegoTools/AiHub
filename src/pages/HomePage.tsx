import { useNavigate } from 'react-router-dom';
import { Sparkles, LayoutGrid, History as HistoryIcon, Star, Cpu } from 'lucide-react';
import { DynamicIcon } from '../components/ToolForm';
import { Tool, Category } from '../types';

interface HomePageProps {
  t: any;
  localizedCategories: Category[];
  allTools: Tool[];
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  openTool: (toolId: string) => void;
  recentToolsUsed: Tool[];
}

export default function HomePage({ t, localizedCategories, allTools, favorites, toggleFavorite, openTool, recentToolsUsed }: HomePageProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-[#111113] dark:to-[#0d0d0f] text-slate-800 dark:text-white rounded-[2rem] p-6 lg:p-10 border border-slate-200 dark:border-zinc-800 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl shadow-blue-500/5">
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
              onClick={() => navigate('/categories')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {t.exploreTools}
            </button>
            <button
              id="hero-docs-btn"
              onClick={() => navigate('/about')}
              className="px-4 py-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 text-xs rounded-xl transition-all cursor-pointer bg-white dark:bg-zinc-500/10"
            >
              {t.techDetails}
            </button>
          </div>
        </div>

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

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-extrabold text-lg text-slate-800 dark:text-zinc-100 flex items-center gap-2">
            <LayoutGrid size={18} className="text-blue-500" />
            <span>{t.categoriesGridTitle}</span>
          </h2>
          <button onClick={() => navigate('/categories')} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">{t.viewAllCategories}</button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {localizedCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => navigate(`/categories/${category.id}`)}
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
  );
}
