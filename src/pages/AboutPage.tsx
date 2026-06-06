import { Sparkles } from 'lucide-react';

interface AboutPageProps {
  t: any;
}

export default function AboutPage({ t }: AboutPageProps) {
  return (
    <div className="space-y-8 animate-fade-in text-right font-sans">
      <div className="p-8 lg:p-12 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm dark:shadow-none animate-fade-in">
        <div className="space-y-4">
          <span className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-orange-600 dark:text-amber-400 rounded-full font-bold text-[10px] tracking-wide uppercase">
            {t.aboutVersion}
          </span>
          <h2 className="font-extrabold text-2xl lg:text-3xl text-slate-800 dark:text-zinc-100">{t.aboutTitle}</h2>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xl">
            {t.aboutDesc}
          </p>
        </div>
        <div className="p-6 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-3xl shrink-0 flex items-center justify-center w-40 h-40">
          <Sparkles size={64} className="text-amber-500 animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#18181b] p-6 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs dark:shadow-none space-y-3 text-right">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">{t.aboutFeature1Title}</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{t.aboutFeature1Desc}</p>
        </div>

        <div className="bg-white dark:bg-[#18181b] p-6 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-xs dark:shadow-none space-y-3 text-right">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-zinc-100">{t.aboutFeature2Title}</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">{t.aboutFeature2Desc}</p>
        </div>
      </div>
    </div>
  );
}
