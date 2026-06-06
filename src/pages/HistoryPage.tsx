import { useNavigate } from 'react-router-dom';
import { Trash2, Copy, History as HistoryIcon } from 'lucide-react';
import { DynamicIcon } from '../components/ToolForm';
import { Tool, HistoryItem } from '../types';

interface HistoryPageProps {
  t: any;
  language: string;
  history: HistoryItem[];
  allTools: Tool[];
  openTool: (toolId: string) => void;
  handleClearHistory: () => void;
  handleDeleteHistoryItem: (id: string) => void;
}

export default function HistoryPage({
  t, language, history, allTools, openTool,
  handleClearHistory, handleDeleteHistoryItem
}: HistoryPageProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in font-sans">
      <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-slate-200 dark:border-zinc-805">
        <div>
          <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.historyTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.historyDesc}</p>
        </div>

        {history.length > 0 && (
          <button
            id="btn-clear-all-history"
            onClick={handleClearHistory}
            className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-455 text-xs font-semibold rounded-xl border border-rose-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={13} />
            <span>{t.clearHistory}</span>
          </button>
        )}
      </div>

      {history.length > 0 ? (
        <div className="space-y-6 font-sans">
          {history.map((item) => {
            const tool = allTools.find(t => t.id === item.toolId);
            if (!tool) return null;
            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 text-right space-y-4 font-sans shadow-sm dark:shadow-none"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-slate-100 dark:border-zinc-805/60">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-450 rounded-xl">
                      <DynamicIcon name={tool.icon} size={15} />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{tool.title}</h3>
                      <span className="text-[10px] text-slate-500 dark:text-zinc-500 block mt-0.5">
                        {t.by} {item.provider === 'gemini' ? (t.providerGemini || 'Gemini API') : (t.providerOpenRouter || 'OpenRouter API')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 bg-slate-100 dark:bg-zinc-950 px-2 py-1 rounded">
                      {new Date(item.timestamp).toLocaleDateString(language === 'ar' ? 'ar-EG' : language === 'en' ? 'en-US' : language === 'de' ? 'de-DE' : language === 'fr' ? 'fr-FR' : 'it-IT', { dateStyle: 'medium' })}
                    </span>
                    <button
                      onClick={() => handleDeleteHistoryItem(item.id)}
                      className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all cursor-pointer"
                      title={t.clearHistory}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {Object.keys(item.inputs).length > 0 && (
                  <div className="bg-slate-50 dark:bg-zinc-950/85 p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 text-[11px] text-slate-550 dark:text-zinc-400 space-y-1">
                    <strong className="text-slate-800 dark:text-zinc-200 block mb-1">{t.inputsLabel}</strong>
                    {Object.entries(item.inputs).map(([key, val]) => (
                      <div key={key} className="flex gap-2">
                        <span className="font-semibold">{tool.inputs.find(i => i.id === key)?.label || key}:</span>
                        <span className="truncate max-w-lg text-slate-700 dark:text-zinc-300">{val}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-sm text-slate-700 dark:text-zinc-300 leading-relaxed font-sans bg-slate-50 dark:bg-zinc-950 p-4 border border-slate-200 dark:border-zinc-800 rounded-xl line-clamp-5 hover:line-clamp-none transition-all duration-300">
                  {item.output}
                </div>

                <div className="pt-2 flex items-center gap-2 font-semibold">
                  <button
                    onClick={() => navigator.clipboard.writeText(item.output)}
                    className="px-3 py-1.5 hover:bg-slate-100 dark:hover:bg-zinc-900 text-slate-500 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 text-[10px] rounded-lg border border-transparent transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Copy size={11} />
                    <span>{t.copyOutput}</span>
                  </button>
                  <button
                    onClick={() => openTool(item.toolId)}
                    className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-600 hover:text-white text-blue-650 dark:text-blue-400 text-[10px] rounded-lg border border-transparent transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <span>{t.openInWorkbench}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-[#18181b] border border-slate-205 dark:border-zinc-800 rounded-3xl shadow-sm dark:shadow-none">
          <div className="p-4 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 rounded-3xl text-slate-400 dark:text-zinc-500 mb-4 inline-block">
            <HistoryIcon size={36} />
          </div>
          <h4 className="font-bold text-sm text-slate-800 dark:text-zinc-100">{t.noHistory}</h4>
        </div>
      )}
    </div>
  );
}
