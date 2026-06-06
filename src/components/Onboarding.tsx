import { ArrowLeft, Heart, ShieldCheck, Zap } from 'lucide-react';
import { TranslationDict } from '../translations';

interface OnboardingProps {
  onComplete: () => void;
  t: TranslationDict;
}

export default function Onboarding({ onComplete, t }: OnboardingProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950 flex items-center justify-center p-4">
      {/* Background ambient light */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl opacity-60" />

      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800/80 rounded-3xl p-6 lg:p-10 text-white shadow-2xl overflow-hidden self-center my-8">
        {/* Banner */}
        <div className="flex flex-col items-center text-center gap-4 mb-8 font-sans">
          <img src="/src/assets/logo.svg" alt="AI Hub" className="w-16 h-16" />
          <div>
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">{t.onboardingTitle}</span>
            <h1 className="text-2xl lg:text-3xl font-black mt-2 tracking-tight bg-gradient-to-r from-amber-200 to-white bg-clip-text text-transparent">{t.appTitle}</h1>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 font-sans">
          <div className="bg-slate-950/45 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-2.5 text-center">
            <div className="mx-auto text-amber-400 bg-amber-400/10 p-2.5 rounded-xl border border-amber-400/10">
              <Zap size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-100">{t.toolsAvailable}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.welcomeOnboarding1}</p>
          </div>
          
          <div className="bg-slate-950/45 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-2.5 text-center">
            <div className="mx-auto text-emerald-400 bg-emerald-400/10 p-2.5 rounded-xl border border-emerald-400/10">
              <ShieldCheck size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-100">{t.connectionSecurityNotice}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.welcomeOnboarding2}</p>
          </div>

          <div className="bg-slate-950/45 border border-slate-800/80 p-5 rounded-2xl flex flex-col gap-2.5 text-center">
            <div className="mx-auto text-rose-400 bg-rose-400/10 p-2.5 rounded-xl border border-rose-400/10">
              <Heart size={20} />
            </div>
            <h3 className="font-bold text-sm text-slate-100">{t.customToolLabel}</h3>
            <p className="text-xs text-slate-400 leading-relaxed">{t.welcomeOnboarding3}</p>
          </div>
        </div>

        {/* Action Call */}
        <div className="flex flex-col items-center gap-3 pt-4 border-t border-slate-800/60 text-center font-sans">
          <button
            id="onboarding-complete-btn"
            onClick={onComplete}
            className="w-full sm:w-auto px-10 py-4 bg-gradient-to-l from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-950 font-black rounded-2xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2.5 cursor-pointer"
          >
            <span>{t.getStarted}</span>
            <ArrowLeft size={18} className="rtl:rotate-0 rotate-180" />
          </button>
        </div>
      </div>
    </div>
  );
}
