import { useState } from 'react';
import { Key, Eye, EyeOff, Check, RefreshCw } from 'lucide-react';
import { getGeminiKey, setGeminiKey, getOpenRouterKey, setOpenRouterKey } from '../utils/apiKeyManager';

interface ConnectionSettingsPageProps {
  t: any;
  language: string;
}

export default function ConnectionSettingsPage({ t, language }: ConnectionSettingsPageProps) {
  const [geminiKey, setGeminiKeyLocal] = useState(getGeminiKey());
  const [openrouterKey, setOpenrouterKeyLocal] = useState(getOpenRouterKey());
  const [showGemini, setShowGemini] = useState(false);
  const [showOpenrouter, setShowOpenrouter] = useState(false);
  const [saved, setSaved] = useState(false);
  const isRtl = language === 'ar';

  const handleSave = () => {
    setGeminiKey(geminiKey.trim());
    setOpenRouterKey(openrouterKey.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100 flex items-center gap-2">
          <Key size={20} className="text-blue-500" />
          <span>{t.connectionSettingsTitle || 'إعدادات الاتصال والرموز'}</span>
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
          {isRtl
            ? 'أدخل مفاتيح API الخاصة بك لاستخدامها بدلاً من المفتاح الافتراضي'
            : 'Enter your own API keys to use instead of the default key'}
        </p>
      </div>

      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 space-y-6">
        {/* Gemini Key */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">
            {t.geminiKeyLabel || 'مفتاح Google Gemini API'}
          </label>
          <div className="relative">
            <input
              type={showGemini ? 'text' : 'password'}
              value={geminiKey}
              onChange={(e) => setGeminiKeyLocal(e.target.value)}
              placeholder={t.geminiKeyPlaceholder || 'AIzaSy...'}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-mono focus:border-blue-500 transition-all ltr text-left"
              dir="ltr"
            />
            <button
              onClick={() => setShowGemini(!showGemini)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
            >
              {showGemini ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">
            {t.getFreeKey || 'احصل على مفتاح مجاني'}:{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:underline">aistudio.google.com/apikey</a>
          </p>
        </div>

        {/* OpenRouter Key */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-zinc-300 mb-2">
            {t.openrouterKeyLabel || 'مفتاح OpenRouter API'}
          </label>
          <div className="relative">
            <input
              type={showOpenrouter ? 'text' : 'password'}
              value={openrouterKey}
              onChange={(e) => setOpenrouterKeyLocal(e.target.value)}
              placeholder={t.openrouterKeyPlaceholder || 'sk-or-v1-...'}
              className="w-full bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-700 text-slate-800 dark:text-zinc-100 rounded-2xl px-4 py-2.5 text-xs font-mono focus:border-blue-500 transition-all ltr text-left"
              dir="ltr"
            />
            <button
              onClick={() => setShowOpenrouter(!showOpenrouter)}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
            >
              {showOpenrouter ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1.5">
            {t.getOpenrouterKey || 'احصل على مفتاح OpenRouter'}:{' '}
            <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer"
              className="text-blue-500 hover:underline">openrouter.ai/keys</a>
          </p>
        </div>

        <button
          onClick={handleSave}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
        >
          {saved ? (
            <><Check size={15} /> {isRtl ? 'تم الحفظ ✓' : 'Saved ✓'}</>
          ) : (
            <><RefreshCw size={15} /> {t.saveChanges || 'حفظ التغييرات'}</>
          )}
        </button>
      </div>

      {/* Guide */}
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6">
        <h3 className="font-bold text-sm text-slate-800 dark:text-zinc-100 mb-3">
          {t.settingsGuideTitle || 'كيفية الإعداد خطوة بخطوة'}
        </h3>
        <ol className="space-y-2 text-xs text-slate-500 dark:text-zinc-400 list-decimal list-inside leading-relaxed">
          <li>{t.guideStep1 || 'تأكد من تحديد المزود الصحيح (Gemini).'}</li>
          <li>{t.guideStep2 || 'افتح رابط المفتاح المجاني أعلاه.'}</li>
          <li>{t.guideStep3 || 'انسخ المفتاح والصقه في الحقل أعلاه.'}</li>
          <li>{t.guideStep4 || 'احفظ التغييرات وافتح أي أداة للتوليد!'}</li>
        </ol>
      </div>
    </div>
  );
}
