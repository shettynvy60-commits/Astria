import React, { useState } from 'react';
import { Check, AlertTriangle, XCircle, Star, Layers, HelpCircle } from 'lucide-react';

export default function SkillBadges({
  matchedSkills = [],
  partialSkills = [],
  missingSkills = [],
  bonusSkills = [],
  onSelectSkill
}) {
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'matched' | 'partial' | 'missing'

  const totalCount = matchedSkills.length + partialSkills.length + missingSkills.length + bonusSkills.length;

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Requirement Breakdown
          </h3>
          <p className="text-xs text-slate-400">Classified by evidence and adjacency mapping</p>
        </div>

        {/* Tab Filters */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'all'
                ? 'bg-slate-800 text-white font-semibold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All ({totalCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matched')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'matched'
                ? 'bg-emerald-950/80 text-emerald-300 font-semibold border border-emerald-500/30'
                : 'text-slate-400 hover:text-emerald-300'
            }`}
          >
            Matched ({matchedSkills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('partial')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'partial'
                ? 'bg-amber-950/80 text-amber-300 font-semibold border border-amber-500/30'
                : 'text-slate-400 hover:text-amber-300'
            }`}
          >
            Partial ({partialSkills.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('missing')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              activeTab === 'missing'
                ? 'bg-rose-950/80 text-rose-300 font-semibold border border-rose-500/30'
                : 'text-slate-400 hover:text-rose-300'
            }`}
          >
            Missing ({missingSkills.length})
          </button>
        </div>
      </div>

      {/* Badges Container */}
      <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
        {/* MATCHED SECTION */}
        {(activeTab === 'all' || activeTab === 'matched') && matchedSkills.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Fully Verified Skills (1.0x Weight)
            </div>
            <div className="flex flex-wrap gap-2">
              {matchedSkills.map((skill, idx) => (
                <div
                  key={`m-${idx}`}
                  onClick={() => onSelectSkill && onSelectSkill(skill)}
                  className="group relative cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-900/50 hover:border-emerald-400 transition-all shadow-sm"
                >
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="capitalize">{skill.name}</span>
                  {skill.candidate_evidence && (
                    <span className="text-[10px] text-emerald-400/70 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      100%
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PARTIAL SECTION */}
        {(activeTab === 'all' || activeTab === 'partial') && partialSkills.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Transferable / Adjacent (0.5x Weight)
            </div>
            <div className="flex flex-wrap gap-2">
              {partialSkills.map((skill, idx) => (
                <div
                  key={`p-${idx}`}
                  onClick={() => onSelectSkill && onSelectSkill(skill)}
                  className="group relative cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:bg-amber-900/50 hover:border-amber-400 transition-all shadow-sm"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span className="capitalize">{skill.name}</span>
                  {skill.candidate_evidence && (
                    <span className="text-[10px] text-amber-300/80 bg-amber-950/90 px-1.5 py-0.5 rounded border border-amber-500/20">
                      via {skill.candidate_evidence.replace('Transferable experience: ', '')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* MISSING SECTION */}
        {(activeTab === 'all' || activeTab === 'missing') && missingSkills.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5" /> Critical Skill Gaps (0.0x Weight)
            </div>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, idx) => (
                <div
                  key={`g-${idx}`}
                  onClick={() => onSelectSkill && onSelectSkill(skill)}
                  className="group relative cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:bg-rose-900/50 hover:border-rose-400 transition-all shadow-sm"
                >
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span className="capitalize">{skill.name}</span>
                  <span className="text-[10px] text-rose-300/80 bg-rose-950/90 px-1.5 py-0.5 rounded border border-rose-500/20">
                    Needs Learning
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* BONUS SECTION */}
        {activeTab === 'all' && bonusSkills.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" /> Preferred / Bonus Qualifications
            </div>
            <div className="flex flex-wrap gap-2">
              {bonusSkills.map((skill, idx) => (
                <div
                  key={`b-${idx}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-950/40 text-purple-300 border border-purple-500/30 shadow-sm"
                >
                  <Star className="w-3.5 h-3.5 text-purple-400" />
                  <span className="capitalize">{skill.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalCount === 0 && (
          <div className="text-center py-8 text-slate-500 text-sm">
            No requirements detected yet. Upload a resume and job description to inspect skills.
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Click on any badge to focus learning roadmap modules</span>
        <span className="text-brand-400 font-mono">Formula: (M + 0.5P) / Total</span>
      </div>
    </div>
  );
}
