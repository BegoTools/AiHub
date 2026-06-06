import { useNavigate } from 'react-router-dom';
import { DynamicIcon } from '../components/ToolForm';
import { Category, Tool } from '../types';

interface CategoriesPageProps {
  t: any;
  localizedCategories: Category[];
  allTools: Tool[];
}

export default function CategoriesPage({ t, localizedCategories, allTools }: CategoriesPageProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.sectionsTitle}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.sectionsDesc}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {localizedCategories.map((category) => {
          const count = allTools.filter(t => t.categoryId === category.id).length;
          return (
            <button
              key={category.id}
              onClick={() => navigate(`/categories/${category.id}`)}
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
  );
}
