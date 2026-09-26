import React from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  Terminal, 
  BookOpen, 
  Layers, 
  Target, 
  Cpu, 
  Award,
  Zap
} from 'lucide-react';

export default function Navbar({ 
  activeView, 
  setActiveView, 
  hasResults, 
  targetRole, 
  currentScore 
}) {
  return (
    <header className="sticky top-0 z-50 glass-panel-elevated border-b border-slate-800/80 backdrop-blur-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Logo */}
        <div 
          onClick={() => setActiveView('config')}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 p-0.5 shadow-lg glow-brand flex items-center justify-center transition-transform group-hover:scale-105">
            <div className="w-full h-full bg-[#04070F] rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-brand-400 group-hover:rotate-12 transition-transform duration-300" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight text-gradient-brand">
                Astria
              </span>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-500/30">
                SaaS v2.0
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block tracking-wide">
              Deterministic Gap Analysis & Pedagogy
            </p>
          </div>
        </div>

        {/* Navigation Tabs (All 5 Dashboard Views) */}
        <nav className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 text-xs sm:text-xs overflow-x-auto max-w-full">
          {/* View 1: Target Role Configurator */}
          <button
            type="button"
            onClick={() => setActiveView('config')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeView === 'config'
                ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white font-bold shadow-md glow-brand'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-brand-300" />
            <span>Target Role</span>
          </button>

          {/* View 2: Self-Assessment Matrix */}
          <button
            type="button"
            onClick={() => setActiveView('assessment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeView === 'assessment'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-md glow-cyan'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-cyan-300" />
            <span>Self-Assessment</span>
          </button>

          {/* View 3: Resume Gap Analysis */}
          <button
            type="button"
            onClick={() => setActiveView('analysis')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeView === 'analysis'
                ? 'bg-brand-600 text-white font-bold shadow-md glow-brand'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-indigo-300" />
            <span>Gap Analysis</span>
          </button>

          {/* View 4: Learning Roadmap */}
          <button
            type="button"
            onClick={() => setActiveView('roadmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeView === 'roadmap'
                ? 'bg-brand-600 text-white font-bold shadow-md glow-brand'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-300" />
            <span>Roadmap</span>
          </button>

          {/* View 5: ATS Bullets */}
          <button
            type="button"
            onClick={() => setActiveView('tailored')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeView === 'tailored'
                ? 'bg-brand-600 text-white font-bold shadow-md glow-brand'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-300" />
            <span>ATS Bullets</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('ai-tools')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              activeView === 'ai-tools'
                ? 'bg-brand-600 text-white font-bold shadow-md glow-brand'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Tools</span>
          </button>
        </nav>

        {/* Right Status Pill Box */}
        <div className="hidden lg:flex items-center gap-3 shrink-0">
          {currentScore !== undefined && currentScore !== null && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono">
              <Award className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-slate-400 font-sans">Score:</span>
              <span className="font-bold text-emerald-400">{currentScore}%</span>
            </div>
          )}

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden xl:inline">Presidio Local PII</span>
          </div>
        </div>
      </div>
    </header>
  );
}

