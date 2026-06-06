import { Star } from 'lucide-react';
import { DynamicIcon } from '../components/ToolForm';
import { Tool, Category } from '../types';

interface FavoritesPageProps {
  t: any;
  favorites: string[];
  allTools: Tool[];
  localizedCategories: Category[];
  openTool: (toolId: string) => void;
  toggleFavorite: (toolId: string) => void;
}

export default function FavoritesPage({ t, favorites, allTools, localizedCategories, openTool, toggleFavorite }: FavoritesPageProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.favoritesTitle}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.favoritesDesc}</p>
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
  );
}
