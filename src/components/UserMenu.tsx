import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, ChevronDown } from 'lucide-react';

interface UserMenuProps {
  t: any;
}

export default function UserMenu({ t }: UserMenuProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
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

  if (!user) return null;

  const displayName = user.email?.split('@')[0] || 'User';
  const avatarLetter = (user.email?.[0] || 'U').toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 w-full p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800/50 transition-all cursor-pointer text-xs"
      >
        <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
          {avatarLetter}
        </div>
        <span className="truncate text-slate-700 dark:text-zinc-300 font-medium max-w-[100px]">
          {displayName}
        </span>
        <ChevronDown size={12} className="text-slate-400 mr-auto" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white dark:bg-[#1c1c1f] border border-slate-200 dark:border-zinc-800 rounded-xl shadow-lg overflow-hidden">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-zinc-800">
            <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate">{user.email}</p>
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
