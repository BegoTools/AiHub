import { ShieldAlert } from 'lucide-react';
import { ApiSettings } from '../types';

interface SettingsPageProps {
  t: any;
  settings: ApiSettings;
  handleSaveSettings: (settings: ApiSettings) => void;
}

export default function SettingsPage({ t, settings, handleSaveSettings }: SettingsPageProps) {
  return (
    <div className="space-y-6 animate-fade-in font-sans text-right">
      <div>
        <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.settingsTitle}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.settingsGuideDesc1}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        <div className="lg:col-span-7 bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-sm space-y-6 dark:shadow-none">
          <h3 className="font-extrabold text-base text-slate-800 dark:text-zinc-100 border-b border-slate-100 dark:border-zinc-800 pb-3">
            {t.connectionSettingsTitle}
          </h3>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700 dark:text-zinc-300 block">{t.providerLabel}</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                id="provider-select-gemini"
                type="button"
                onClick={() => handleSaveSettings({ ...settings, provider: 'gemini' })}
                className={`p-4 border rounded-2xl text-right transition-all cursor-pointer ${
                  settings.provider === 'gemini'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <h4 className="text-sm text-slate-800 dark:text-zinc-100">{t.geminiProviderTitle || 'Google Gemini API'}</h4>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">{t.geminiDesc}</span>
              </button>
              
              <button
                id="provider-select-openrouter"
                type="button"
                onClick={() => handleSaveSettings({ ...settings, provider: 'openrouter' })}
                className={`p-4 border rounded-2xl text-right transition-all cursor-pointer ${
                  settings.provider === 'openrouter'
                    ? 'border-amber-500 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-zinc-800'
                }`}
              >
                <h4 className="text-sm text-slate-800 dark:text-zinc-100">{t.openrouterProviderTitle || 'OpenRouter'}</h4>
                <span className="text-[10px] text-slate-500 dark:text-zinc-400 block mt-1">{t.openrouterDesc}</span>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-zinc-950/40 border border-slate-150 dark:border-zinc-805 rounded-2xl">
            <div>
              <h4 className="font-bold text-xs text-slate-800 dark:text-zinc-100">{t.useCustomKeys}</h4>
              <p className="text-[10px] text-slate-500 dark:text-zinc-400 mt-1">{t.customKeysDesc}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                id="custom-keys-toggle"
                type="checkbox"
                checked={settings.useCustomKeys}
                onChange={(e) => handleSaveSettings({ ...settings, useCustomKeys: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:-translate-x-5 after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {settings.useCustomKeys && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-zinc-850 animate-fade-in">
              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center justify-between">
                  <span>{t.geminiKeyLabel}</span>
                  <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 underline">{t.getFreeKey}</a>
                </label>
                <input
                  id="input-setting-gemini"
                  type="password"
                  placeholder={t.geminiKeyPlaceholder || 'AlzaSy...'}
                  value={settings.geminiKey}
                  onChange={(e) => handleSaveSettings({ ...settings, geminiKey: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:border-amber-400"
                />
              </div>

              <div className="space-y-1.5 text-right">
                <label className="text-xs font-semibold text-slate-705 dark:text-zinc-300 flex items-center justify-between">
                  <span>{t.openrouterKeyLabel}</span>
                  <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-[10px] text-amber-500 underline">{t.getOpenrouterKey}</a>
                </label>
                <input
                  id="input-setting-openrouter"
                  type="password"
                  placeholder={t.openrouterKeyPlaceholder || 'sk-or-v1-...'}
                  value={settings.openRouterKey}
                  onChange={(e) => handleSaveSettings({ ...settings, openRouterKey: e.target.value })}
                  className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-950 dark:text-slate-100 rounded-xl px-4 py-2.5 text-xs focus:border-amber-400"
                />
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-12 xl:col-span-5 bg-gradient-to-tr from-amber-500/5 to-orange-500/5 border border-amber-500/10 dark:border-amber-900/20 rounded-3xl p-6 lg:p-8 space-y-4 text-right">
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-white flex items-center gap-2">
            <ShieldAlert size={16} className="text-amber-500" />
            <span>{t.settingsGuideTitle}</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.settingsDesc}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{t.settingsGuideDesc2}</p>
          
          <div className="pt-2">
            <h4 className="font-bold text-xs text-slate-800 dark:text-white mb-2">{t.settingsGuideSteps}</h4>
            <ol className="text-[11px] text-slate-500 dark:text-slate-400 list-decimal list-inside space-y-1.5">
              <li>{t.guideStep1}</li>
              <li>{t.guideStep2}</li>
              <li>{t.guideStep3}</li>
              <li>{t.guideStep4}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
