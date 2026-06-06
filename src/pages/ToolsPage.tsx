import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useState, useMemo } from 'react';
import { DynamicIcon } from '../components/ToolForm';
import { Tool, Category } from '../types';

interface ToolsPageProps {
  t: any;
  allTools: Tool[];
  localizedCategories: Category[];
}

export default function ToolsPage({ t, allTools, localizedCategories }: ToolsPageProps) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return allTools;
    const q = searchQuery.toLowerCase().trim();
    return allTools.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q)
    );
  }, [allTools, searchQuery]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.allTools || 'كل الأدوات'}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.allToolsDesc || 'جميع الأدوات المتاحة في المنصة'}</p>
        </div>
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-2xl pl-10 pr-4 py-2.5 placeholder-slate-400 dark:placeholder-zinc-500 text-xs focus:border-blue-500 transition-all"
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {filteredTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => navigate(`/tools/${tool.id}`)}
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
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-slate-500 dark:text-zinc-500 font-bold block mt-3 bg-slate-100 dark:bg-zinc-950 px-2.5 py-1 rounded-lg w-fit">
                {localizedCategories.find(c => c.id === tool.categoryId)?.name}
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                <span>{t.tryNow}</span>
              </span>
            </div>
          </button>
        ))}
      </div>

      {filteredTools.length === 0 && (
        <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl">
          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-600 mb-4 inline-block">
            <Search size={36} />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">{t.searchNoResults}</h4>
        </div>
      )}
    </div>
  );
}
