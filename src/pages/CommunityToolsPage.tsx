import { useState, useEffect } from 'react';
import { Globe, Search, Heart, Clock, Wrench, Sparkles, LogIn, Trash2, Edit3, User } from 'lucide-react';
import { getAllPublicTools, deleteCustomTool, incrementToolUseCount } from '../services/customToolsService';
import { StoredCustomTool } from '../types/storageTypes';
import { DynamicIcon } from '../components/ToolForm';
import { useAuth } from '../context/AuthContext';

interface CommunityToolsPageProps {
  t: any;
  language: string;
  onOpenTool?: (toolId: string) => void;
}

type SortFilter = 'all' | 'popular' | 'recent';

export default function CommunityToolsPage({ t, language, onOpenTool }: CommunityToolsPageProps) {
  const [tools, setTools] = useState<StoredCustomTool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sort, setSort] = useState<SortFilter>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const { user } = useAuth();

  const userId = user?.id || '';
  const isRtl = language === 'ar';

  useEffect(() => {
    loadTools();
  }, []);

  const loadTools = async () => {
    setIsLoading(true);
    try {
      const all = await getAllPublicTools();
      setTools(all);
    } catch (e) {
      console.error('Failed to load tools:', e);
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
  }).sort((a, b) => {
    if (sort === 'popular') return (b.usesCount || 0) - (a.usesCount || 0);
    if (sort === 'recent') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin text-blue-500"><Wrench size={32} /></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.communityTools || 'أدوات المجتمع'}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.communityToolsDesc || 'أدوات مخصصة من مستخدمين آخرين، شارك واستفد'}</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
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
        <div className="flex items-center gap-2 flex-wrap">
          {(['all', 'popular', 'recent'] as SortFilter[]).map(s => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={`px-3 py-1.5 text-[10px] font-semibold rounded-xl border transition-all cursor-pointer ${
                sort === s
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-[#18181b] border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400'
              }`}
            >
              {s === 'all' ? (t.all || 'الكل') : s === 'popular' ? (t.popular || 'الأكثر استخداماً') : (t.recent || 'الأحدث')}
            </button>
          ))}
        </div>
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
                <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-zinc-500">
                  <Heart size={11} className="text-rose-400" />
                  <span>{tool.likesCount}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-3">{tool.description}</p>

              {/* Author */}
              <div className="flex items-center gap-1.5 mb-2 text-[10px] text-slate-400 dark:text-zinc-500">
                <User size={11} />
                <span>{t.createdBy || 'بواسطة'}: {tool.createdByName || (isRtl ? 'مستخدم' : 'User')}</span>
              </div>

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
                    onClick={() => {
                      if (!user) {
                        onOpenTool?.(tool.id);
                        return;
                      }
                      handleUseTool(tool.id);
                    }}
                    className="px-3 py-1.5 text-[10px] font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-all cursor-pointer"
                  >
                    {t.useTool || 'استخدم الأداة'}
                  </button>

                  {/* Owner-only controls */}
                  {userId && tool.ownerId === userId && (
                    <>
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
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl">
          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-600 mb-4 inline-block">
            <Globe size={36} />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-200">{t.noCommunityTools || 'لا توجد أدوات مجتمع بعد'}</h4>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-2">{t.noCommunityToolsDesc || 'قم بإنشاء أداتك الخاصة وشاركها مع المجتمع!'}</p>
        </div>
      )}
    </div>
  );
}