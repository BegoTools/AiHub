interface SettingsPageProps {
  t: any;
}

export default function SettingsPage({ t }: SettingsPageProps) {
  return (
    <div className="space-y-6 animate-fade-in font-sans text-right">
      <div>
        <h2 className="font-extrabold text-xl text-slate-800 dark:text-zinc-100">{t.settingsTitle}</h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{t.settingsGuideDesc1}</p>
      </div>

      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 lg:p-8 shadow-sm space-y-4 dark:shadow-none">
        <h3 className="font-extrabold text-base text-slate-800 dark:text-zinc-100">
          {t.settingsInfo || 'الإعدادات'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-zinc-400 leading-relaxed">
          {t.settingsDesc || 'يمكنك تعديل اللغة والثيم من القائمة العلوية. يتم حفظ إعداداتك في حسابك وتظهر على جميع أجهزتك.'}
        </p>
      </div>

      <div className="bg-gradient-to-tr from-amber-500/5 to-orange-500/5 border border-amber-500/10 dark:border-amber-900/20 rounded-3xl p-6 lg:p-8 space-y-4 text-right">
        <h3 className="font-extrabold text-sm text-slate-800 dark:text-white">
          {t.settingsGuideTitle}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t.settingsDesc}
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
          {t.settingsGuideDesc2}
        </p>
      </div>
    </div>
  );
}
