import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useMemo } from 'react';
import { DynamicIcon } from '../components/ToolForm';
import { Tool, Category } from '../types';

interface CategoryDetailPageProps {
  t: any;
  localizedCategories: Category[];
  allTools: Tool[];
  openTool: (toolId: string) => void;
}

export default function CategoryDetailPage({ t, localizedCategories, allTools, openTool }: CategoryDetailPageProps) {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  const category = useMemo(() => {
    if (!categoryId) return null;
    return localizedCategories.find(c => c.id === categoryId) || null;
  }, [categoryId, localizedCategories]);

  const categoryTools = useMemo(() => {
    if (!categoryId) return [];
    return allTools.filter(t => t.categoryId === categoryId);
  }, [categoryId, allTools]);

  if (!category) {
    return (
      <div className="p-12 text-center">
        <h4 className="font-bold text-sm text-slate-500 dark:text-zinc-400">{t.notFound || 'الصفحة غير موجودة'}</h4>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/categories')}
            className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
          >
            <ArrowRight size={20} className="rtl:rotate-0 rotate-180" />
          </button>
          <div>
            <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{category.name}</h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{category.description}</p>
          </div>
        </div>
        <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
          {t.availableTools.replace('{count}', String(categoryTools.length))}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
        {categoryTools.map((tool) => (
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
  );
}
