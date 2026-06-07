import { useParams, useNavigate } from 'react-router-dom';
import { useMemo, useState, useEffect } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import ToolForm from '../components/ToolForm';
import OutputView from '../components/OutputView';
import { Tool, Category } from '../types';
import { getCustomToolById } from '../services/customToolsService';
import { StoredCustomTool } from '../types/storageTypes';

interface ToolDetailsPageProps {
  t: any;
  allTools: Tool[];
  localizedCategories: Category[];
  favorites: string[];
  toggleFavorite: (toolId: string) => void;
  handleGenerate: (inputs: Record<string, string>) => Promise<void>;
  currentToolOutput: string;
  setCurrentToolOutput: (val: string) => void;
  isGenerating: boolean;
  saveManualResultToHistory: () => void;
}

function storedToTool(st: StoredCustomTool): Tool {
  return {
    id: st.id,
    categoryId: st.category,
    title: st.title,
    description: st.description,
    icon: st.icon || 'Sparkles',
    inputs: st.inputFields || [],
    exampleInput: {},
    promptTemplate: (inputs: Record<string, string>) => {
      let template = st.promptTemplateString || '';
      Object.keys(inputs).forEach(key => {
        template = template.replace(new RegExp(`\\{${key}\\}`, 'g'), inputs[key]);
      });
      return template;
    },
    tags: st.tags,
  };
}

export default function ToolDetailsPage({
  t, allTools, localizedCategories, favorites, toggleFavorite,
  handleGenerate, currentToolOutput, setCurrentToolOutput,
  isGenerating, saveManualResultToHistory
}: ToolDetailsPageProps) {
  const { toolId } = useParams<{ toolId: string }>();
  const navigate = useNavigate();
  const [fallbackTool, setFallbackTool] = useState<Tool | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!toolId) return;
    const exists = allTools.find(t => t.id === toolId);
    if (exists) {
      setFallbackTool(null);
      return;
    }
    setLoading(true);
    getCustomToolById(toolId).then(st => {
      if (st) setFallbackTool(storedToTool(st));
    }).catch(() => {}).finally(() => setLoading(false));
  }, [toolId, allTools]);

  const activeTool = useMemo(() => {
    if (!toolId) return null;
    return allTools.find(t => t.id === toolId) || fallbackTool || null;
  }, [toolId, allTools, fallbackTool]);

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="animate-spin inline-block w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!activeTool) {
    return (
      <div className="p-12 text-center">
        <h4 className="font-bold text-sm text-slate-500 dark:text-zinc-400">{t.notFound || 'الأداة غير موجودة'}</h4>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-zinc-800/60">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-800 transition-all cursor-pointer shadow-sm text-slate-600 dark:text-zinc-300 hover:text-slate-800 dark:hover:text-white"
          >
            <ArrowRight size={18} className="rtl:rotate-0 rotate-180" />
          </button>
          <div>
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/25">
              {localizedCategories.find(c => c.id === activeTool.categoryId)?.name}
            </span>
            <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100 mt-1">{activeTool.title}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            id="tool-favorite-toggle"
            onClick={() => toggleFavorite(activeTool.id)}
            className={`w-full sm:w-auto justify-center px-4 py-2 text-xs font-semibold rounded-xl transition-all border flex items-center gap-2 cursor-pointer ${
              favorites.includes(activeTool.id)
                ? 'bg-blue-600/10 border-blue-500/30 text-blue-600 dark:text-blue-400 animate-pulse'
                : 'bg-white dark:bg-[#18181b] hover:bg-slate-50 dark:hover:bg-zinc-800 border-slate-205 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 shadow-sm'
            }`}
          >
            <Star size={14} fill={favorites.includes(activeTool.id) ? 'currentColor' : 'none'} />
            <span>{favorites.includes(activeTool.id) ? t.removeFromFavorites : t.saveToFavorites}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 lg:gap-6 items-start">
        <div className="xl:col-span-5 h-full min-w-0">
          <ToolForm
            tool={activeTool}
            onSubmit={handleGenerate}
            isLoading={isGenerating}
            t={t}
          />
        </div>

        <div className="xl:col-span-7 h-full min-w-0">
          <OutputView
            tool={activeTool}
            output={currentToolOutput}
            onClear={() => setCurrentToolOutput('')}
            isLoading={isGenerating}
            onSaveOutputToHistory={saveManualResultToHistory}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}