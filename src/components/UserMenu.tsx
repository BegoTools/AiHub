import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../services/profileService';
import { getFirstName } from '../utils/getFirstName';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  t: any;
}

export default function UserMenu({ t }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [profileData, setProfileData] = useState<{ display_name?: string | null; avatar_url?: string | null }>({});
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!user) return;

    getProfile(user.id).then(profile => {
      if (profile) {
        setProfileData({ display_name: profile.display_name, avatar_url: profile.avatar_url });
      }

      const fbAvatar = user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
      const fbName = user.user_metadata?.full_name || user.user_metadata?.name || '';

      if ((fbName || fbAvatar) && (!profile?.display_name || !profile?.avatar_url)) {
        updateProfile(user.id, {
          display_name: fbName || undefined,
          avatar_url: fbAvatar || undefined,
        }).then(() => {
          setProfileData(prev => ({
            display_name: prev.display_name || fbName,
            avatar_url: prev.avatar_url || fbAvatar,
          }));
        }).catch(() => {});
      }
    });
  }, [user]);

  if (!user) return null;

  const firstName = getFirstName(
    profileData.display_name,
    user.user_metadata,
    user.email
  );
  const avatarUrl = profileData.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture || '';
  const avatarLetter = firstName[0].toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer text-xs"
      >
        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            avatarLetter
          )}
        </div>
        <span className="truncate text-slate-700 dark:text-zinc-300 font-medium max-w-[100px]">
          {firstName}
        </span>
        <ChevronDown size={12} className="text-slate-400 mr-auto" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">
              {user.email || (t.facebookNoEmail || 'لم يوفر Facebook البريد الإلكتروني لهذا الحساب')}
            </p>
          </div>
          <button
            onClick={() => { navigate('/account'); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer"
          >
            <User size={13} />
            <span>{t.profile || 'Profile'}</span>
          </button>
          <button
            onClick={() => { signOut(); setOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-all cursor-pointer"
          >
            <LogOut size={13} />
            <span>{t.signOut || 'Sign Out'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
