import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  BarChart2, 
  Layers, 
  Terminal, 
  FileText, 
  BookOpen,
  User,
  Sliders,
  Sun,
  Moon,
  Flame,
  LogOut,
  Settings,
  ChevronDown,
  Edit3,
  Save,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useUser } from '../context/UserContext';

export default function Navbar({ 
  activeView, 
  setActiveView, 
  hasCompletedAnalysis,
}) {
  const { theme, toggleTheme, isDark } = useTheme();
  const { user, updateUser, logout, streakCount, initials } = useUser();
  const [profileOpen, setProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ fullName: '', email: '', phone: '' });
  const profileRef = useRef(null);

  // Sync edit form when opening
  const openEdit = () => {
    setEditForm({ fullName: user.fullName || '', email: user.email || '', phone: user.phone || '' });
    setEditingProfile(true);
  };

  const saveEdit = () => {
    updateUser({ fullName: editForm.fullName.trim(), email: editForm.email.trim(), phone: editForm.phone.trim() });
    setEditingProfile(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
        setEditingProfile(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const displayName = user.fullName || (user.isGuest ? 'Guest User' : 'Account');
  const displayEmail = user.email || (user.isGuest ? 'Demo Mode' : '—');

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-2xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: App Brand Astria */}
        <div 
          onClick={() => setActiveView(hasCompletedAnalysis ? 'dashboard' : 'workspace')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-slate-100 text-white dark:text-slate-900 flex items-center justify-center shadow-sm group-hover:bg-zinc-800 dark:group-hover:bg-white transition-colors">
            <Sparkles className="w-5 h-5 text-sky-400 dark:text-sky-600 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
                Astria
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                Co-Pilot
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveView('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'workspace'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Workspace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('dashboard')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'dashboard'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {hasCompletedAnalysis && (
            <button
              type="button"
              onClick={() => setActiveView('analysis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'analysis'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Gap Audit</span>
            </button>
          )}

          {/* Interview tab: Terminal icon instead of Mic */}
          <button
            type="button"
            onClick={() => setActiveView('interview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'interview'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Interview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('resume-builder')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'resume-builder'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Resume Builder</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('roadmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'roadmap'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>
        </nav>

        {/* Right: Streak + Theme Toggle + Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Streak Counter Badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-orange-800 dark:text-orange-300 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span>{streakCount}-Day Streak</span>
          </div>

          {/* Privacy Shield Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Zero-Trust</span>
          </div>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600" />
            )}
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => { setProfileOpen(!profileOpen); setEditingProfile(false); }}
              className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700 text-xs cursor-pointer hover:opacity-90 transition-opacity"
            >
              <div className="w-7 h-7 rounded-full bg-sky-100 dark:bg-sky-900/40 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-xs">
                {initials}
              </div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 hidden sm:inline max-w-[120px] truncate">
                {displayName}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${profileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Profile Popover Menu */}
            {profileOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-elevated z-50 animate-slide-up overflow-hidden">
                {!editingProfile ? (
                  <>
                    {/* Profile Header */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center text-sky-700 dark:text-sky-300 font-bold text-sm">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate">
                            {displayName}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Profile Details */}
                    <div className="p-3 space-y-2.5 border-b border-slate-100 dark:border-slate-800">
                      {user.phone && (
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 dark:text-slate-400">Phone</span>
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{user.phone}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Mode</span>
                        <span className={`font-semibold ${user.isGuest ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {user.isGuest ? 'Guest / Demo' : 'Authenticated'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Streak</span>
                        <span className="text-orange-600 dark:text-orange-400 font-semibold flex items-center gap-1">
                          <Flame className="w-3 h-3" /> {streakCount}-Day Streak
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2">
                      <button
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        onClick={openEdit}
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        <span>Edit Profile</span>
                      </button>
                      <button
                        type="button"
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                        onClick={() => {
                          setProfileOpen(false);
                          logout();
                        }}
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </>
                ) : (
                  /* Edit Profile Inline Form */
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Edit Profile</h4>
                      <button type="button" onClick={() => setEditingProfile(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Full Name</label>
                        <input
                          type="text"
                          value={editForm.fullName}
                          onChange={e => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                          placeholder="Your full name"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                          placeholder="you@example.com"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wide">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                          placeholder="+1 (555) 000-0000"
                          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={saveEdit}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-zinc-800 dark:hover:bg-white transition-all"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
