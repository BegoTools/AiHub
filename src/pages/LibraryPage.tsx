import { useState, useEffect } from 'react';
import { Library, Star, Trash2, Wrench, Workflow, FileText, Copy, ExternalLink, Clock, Filter } from 'lucide-react';
import { getLibraryData, LibraryAggregate } from '../services/libraryService';
import { deleteSavedResult } from '../services/resultsService';
import { deleteCustomTool } from '../services/customToolsService';
import { DynamicIcon } from '../components/ToolForm';

interface LibraryPageProps {
  t: any;
  language: string;
  onOpenTool: (toolId: string) => void;
  onOpenWorkflow: (wfId: string) => void;
}

type FilterType = 'all' | 'results' | 'tools' | 'workflows';

export default function LibraryPage({ t, language, onOpenTool, onOpenWorkflow }: LibraryPageProps) {
  const [data, setData] = useState<LibraryAggregate | null>(null);
  const [filter, setFilter] = useState<FilterType>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await getLibraryData();
      setData(result);
    } catch (e) {
      console.error('Failed to load library:', e);
    }
    setIsLoading(false);
  };

  const handleDeleteResult = async (id: string) => {
    await deleteSavedResult(id);
    loadData();
  };

  const handleDeleteTool = async (id: string) => {
    await deleteCustomTool(id);
    loadData();
  };

  const filteredItems = data?.recentItems.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'results') return item.type === 'result';
    if (filter === 'tools') return item.type === 'tool';
    if (filter === 'workflows') return item.type === 'workflow';
    return true;
  }) || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-blue-500"><Library size={32} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.libraryTitle || 'المكتبة'}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.libraryDesc || 'كل نتائجك وأدواتك المخصصة ورحلاتك في مكان واحد'}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'results', 'tools', 'workflows'] as FilterType[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              filter === f
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:border-blue-500/30'
            }`}
          >
            {f === 'all' ? (t.all || 'الكل') :
             f === 'results' ? (t.savedResults || 'النتائج') :
             f === 'tools' ? (t.customToolsTitle || 'الأدوات') :
             (t.workflowsTitle || 'الرحلات')}
            <span className="mr-1.5 opacity-60">
              {f === 'all' ? data?.recentItems.length :
               f === 'results' ? data?.results.length :
               f === 'tools' ? data?.customTools.length :
               Object.keys(data || {}).length}
            </span>
          </button>
        ))}
      </div>

      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="p-5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-blue-500/40 transition-all shadow-sm dark:shadow-none group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${
                    item.type === 'result' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                    item.type === 'tool' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                    'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                  }`}>
                    {item.type === 'result' ? <FileText size={18} /> :
                     item.type === 'tool' ? <Wrench size={18} /> :
                     <Workflow size={18} />}
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100 line-clamp-1">{item.title}</h4>
                </div>
                {item.isFavorite && <Star size={14} className="text-amber-500 fill-amber-500" />}
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                {item.content || t.noContent || 'لا يوجد محتوى'}
              </p>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Clock size={10} />
                  {new Date(item.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { dateStyle: 'short' })}
                </span>
                <div className="flex items-center gap-1">
                  {item.type === 'result' && (
                    <>
                      <button onClick={() => navigator.clipboard.writeText(item.content)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 hover:text-blue-500 transition-all cursor-pointer" title={t.copyOutput}>
                        <Copy size={13} />
                      </button>
                      <button onClick={() => handleDeleteResult(item.id)} className="p-1.5 hover:bg-rose-100 dark:hover:bg-rose-900/20 rounded-lg text-slate-400 hover:text-rose-500 transition-all cursor-pointer" title={t.delete}>
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                  {item.type === 'tool' && item.metadata?.toolId && (
                    <button onClick={() => onOpenTool(item.metadata.toolId)} className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg text-slate-400 hover:text-blue-500 transition-all cursor-pointer" title={t.open}>
                      <ExternalLink size={13} />
                    </button>
                  )}
                  {item.type === 'workflow' && (
                    <button onClick={() => onOpenWorkflow(item.metadata?.workflowId || item.id.replace('wf_', ''))} className="p-1.5 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg text-slate-400 hover:text-purple-500 transition-all cursor-pointer" title={t.open}>
                      <ExternalLink size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl">
          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-600 mb-4 inline-block">
            <Library size={36} />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">{t.emptyLibrary || 'مكتبتك فارغة'}</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">{t.emptyLibraryDesc || 'استخدم الأدوات وستظهر نتائجك هنا'}</p>
        </div>
      )}
    </div>
  );
}
