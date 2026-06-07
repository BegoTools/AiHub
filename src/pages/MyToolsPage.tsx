import { useState, useEffect } from 'react';
import { Wrench, Search, Clock, LogIn, Trash2, Edit3, Plus } from 'lucide-react';
import { getCustomTools, deleteCustomTool, incrementToolUseCount } from '../services/customToolsService';
import { StoredCustomTool } from '../types/storageTypes';
import { DynamicIcon } from '../components/ToolForm';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MyToolsPageProps {
  t: any;
  language: string;
  onOpenTool?: (toolId: string) => void;
}

export default function MyToolsPage({ t, language, onOpenTool }: MyToolsPageProps) {
  const [tools, setTools] = useState<StoredCustomTool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { user } = useAuth();
  const navigate = useNavigate();
  const isRtl = language === 'ar';

  useEffect(() => {
    if (user) loadTools();
    else { setIsLoading(false); setTools([]); }
  }, [user]);

  const loadTools = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const all = await getCustomTools();
      setTools(all || []);
    } catch (e) {
      console.error('Failed to load tools:', e);
      setLoadError(true);
      setTools([]);
    }
    setIsLoading(false);
  };

  const handleDeleteTool = async (toolId: string) => {
    const ok = await deleteCustomTool(toolId);
    if (ok) {
      setTools(prev => prev.filter(t => t.id !== toolId));
    }
    setConfirmDeleteId(null);
  };

  const handleUseTool = (toolId: string) => {
    incrementToolUseCount(toolId).catch(() => {});
    onOpenTool?.(toolId);
  };

  const filtered = tools.filter(t => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q));
  });

  if (!user) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.myToolsNav || 'أدواتي'}</h2>
        </div>
        <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl">
          <LogIn size={36} className="mx-auto text-slate-400 mb-4" />
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">{isRtl ? 'سجل دخولك لعرض أدواتك' : 'Sign in to view your tools'}</h4>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-blue-500"><Wrench size={32} /></div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div>
          <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.myToolsNav || 'أدواتي'}</h2>
        </div>
        <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl">
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 rounded-3xl text-rose-400 mb-4 inline-block">
            <Wrench size={36} />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">{isRtl ? 'تعذر تحميل أدواتك حاليًا' : 'Failed to load your tools'}</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">{isRtl ? 'حاول مرة أخرى لاحقًا.' : 'Try again later.'}</p>
          <button onClick={loadTools} className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer">
            {t.retry || (isRtl ? 'إعادة المحاولة' : 'Retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.myToolsNav || 'أدواتي'}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{isRtl ? 'الأدوات التي قمت بإنشائها' : 'Tools you have created'}</p>
        </div>
        <button
          onClick={() => navigate('/create-tool')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          <Plus size={14} />
          <span>{t.createTool || (isRtl ? 'أداة جديدة' : 'New Tool')}</span>
        </button>
      </div>

      <div className="relative w-full sm:w-72">
        <input
          type="text"
          placeholder={t.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-2xl pl-10 pr-4 py-2.5 placeholder-slate-400 dark:placeholder-zinc-500 text-xs focus:border-blue-500 transition-all"
        />
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((tool) => (
            <div
              key={tool.id}
              className="p-5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl hover:border-blue-500/40 hover:shadow-md transition-all group flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <DynamicIcon name={tool.icon || 'Tool'} size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{tool.title}</h4>
                    <span className="text-[10px] text-blue-500 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded mt-0.5 inline-block">
                      {tool.category}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">{tool.description}</p>

              <div className="flex items-center gap-1.5 flex-wrap mb-3">
                {(tool.tags || []).slice(0, 3).map((tag, i) => (
                  <span key={i} className="text-[9px] px-2 py-0.5 bg-slate-100 dark:bg-zinc-950 text-slate-500 dark:text-zinc-500 rounded-lg">
                    #{tag}
                  </span>
                ))}
                {(tool.tags || []).length > 3 && (
                  <span className="text-[9px] text-slate-400 dark:text-zinc-600">+{(tool.tags || []).length - 3}</span>
                )}
              </div>
              <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-100 dark:border-zinc-800">
                <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                  <Clock size={10} />
                  {tool.usesCount} {t.uses || 'استخدام'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleUseTool(tool.id)}
                    className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
                  >
                    {t.useTool || 'استخدم الأداة'}
                  </button>
                  {confirmDeleteId === tool.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeleteTool(tool.id)}
                        className="px-2 py-1.5 text-[10px] font-semibold rounded-lg bg-red-600 hover:bg-red-500 text-white transition-all cursor-pointer"
                      >
                        {t.confirmDelete || 'تأكيد'}
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2 py-1.5 text-[10px] font-semibold rounded-lg border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
                      >
                        {t.cancel || 'إلغاء'}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(tool.id)}
                      className="p-1.5 text-rose-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg transition-all"
                      title={t.deleteTool || 'حذف'}
                    >
                      <Trash2 size={14} />
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
            <Wrench size={36} />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">{isRtl ? 'لم تقم بإنشاء أي أداة بعد' : 'No tools created yet'}</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">{isRtl ? 'أنشئ أداتك الأولى وشاركها مع المجتمع!' : 'Create your first tool and share it with the community!'}</p>
          <button
            onClick={() => navigate('/create-tool')}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <Plus size={14} className="inline mr-1" />
            {t.createTool || (isRtl ? 'إنشاء أداة' : 'Create Tool')}
          </button>
        </div>
      )}
    </div>
  );
}
