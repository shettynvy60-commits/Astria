import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  BarChart2, 
  Layers, 
  Mic, 
  FileText, 
  BookOpen,
  User,
  Sliders
} from 'lucide-react';

export default function Navbar({ 
  activeView, 
  setActiveView, 
  hasCompletedAnalysis,
  candidateName = 'Alex Chen'
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Left: App Brand Astria */}
        <div 
          onClick={() => setActiveView(hasCompletedAnalysis ? 'dashboard' : 'workspace')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-sm group-hover:bg-zinc-800 transition-colors">
            <Sparkles className="w-5 h-5 text-sky-400 group-hover:rotate-12 transition-transform duration-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 tracking-tight">
                Astria
              </span>
              <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                Co-Pilot
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveView('workspace')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'workspace'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
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
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Performance Dashboard</span>
          </button>

          {hasCompletedAnalysis && (
            <button
              type="button"
              onClick={() => setActiveView('analysis')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                activeView === 'analysis'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Gap Audit</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveView('interview')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'interview'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Mock Interview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('tailored')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'tailored'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>ATS Resume</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('roadmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeView === 'roadmap'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Roadmap</span>
          </button>
        </nav>

        {/* Right: User Status & Privacy Shield Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Zero-Trust Shield</span>
          </div>

          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold">
              <User className="w-4 h-4 text-slate-600" />
            </div>
            <span className="font-semibold text-slate-800 hidden sm:inline">{candidateName}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
