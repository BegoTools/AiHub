import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile, type Profile } from '../services/profileService';
import { User, Mail, Calendar, LogOut, Save } from 'lucide-react';

interface ProfilePageProps {
  t: any;
  onOpenAuth?: () => void;
}

export default function ProfilePage({ t, onOpenAuth }: ProfilePageProps) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    getProfile(user.id).then(p => {
      if (p) {
        setProfile(p);
        setDisplayName(p.display_name || '');
      }
    });
  }, [user]);

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-fade-in">
        <div className="p-6 bg-slate-100 dark:bg-zinc-900 rounded-3xl">
          <User size={48} className="text-slate-400 dark:text-zinc-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-zinc-100">{t.accountTitle || 'حسابي'}</h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-2">{t.authSignInRequired || 'يرجى تسجيل الدخول لعرض حسابك'}</p>
        </div>
        {onOpenAuth && (
          <button
            onClick={onOpenAuth}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {t.signIn || 'تسجيل الدخول'}
          </button>
        )}
      </div>
    );
  }

  const avatarLetter = (user.email?.[0] || 'U').toUpperCase();
  const memberDate = profile?.created_at || user.created_at || '';

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      await updateProfile(user.id, { display_name: displayName });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e: any) {
      const msg = e?.message || t.errorOccurred || 'حدث خطأ';
      console.error('[ProfilePage] Save error:', msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in font-sans">
      <div className="bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 rounded-[2rem] p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col items-center text-center gap-4 mb-8">
          <div className="w-20 h-20 rounded-full bg-amber-500 flex items-center justify-center text-white font-black text-2xl shadow-lg">
            {avatarLetter}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100">{t.accountTitle}</h1>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">{user.email}</p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 block mb-1.5">{t.displayName || 'Display Name'}</label>
            <div className="relative">
              <User size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" />
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder={user.email?.split('@')[0] || ''}
                className="w-full bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 text-slate-800 dark:text-zinc-100 rounded-xl px-4 py-2.5 pr-10 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 outline-none transition-all"
              />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-950/50 rounded-xl p-4 space-y-3 overflow-hidden">
            <div className="flex items-center gap-3 text-sm min-w-0">
              <Mail size={15} className="text-slate-400 shrink-0" />
              <span className="text-slate-600 dark:text-zinc-400 shrink-0">{t.email || 'Email'}:</span>
              <span className="text-slate-800 dark:text-zinc-200 font-medium ms-auto break-all min-w-0 text-left">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar size={15} className="text-slate-400 shrink-0" />
              <span className="text-slate-600 dark:text-zinc-400">{t.memberSince || 'Member since'}:</span>
              <span className="text-slate-800 dark:text-zinc-200 font-medium ms-auto">
                {memberDate ? new Date(memberDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
              </span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-xl text-xs text-red-600 dark:text-red-400 text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-400 text-white text-sm font-bold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {saving ? (t.saving || 'جاري الحفظ...') : saved ? (t.saved || 'تم الحفظ ✓') : (t.saveChanges || 'Save Changes')}
          </button>
        </div>
      </div>

      <button
        onClick={signOut}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-[#18181b] border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
      >
        <LogOut size={16} />
        {t.signOut || 'Sign Out'}
      </button>
    </div>
  );
}
