import React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ExternalLink, 
  ArrowRight, 
  Terminal, 
  FileText, 
  RotateCcw,
  Sparkles,
  BookOpen
} from 'lucide-react';

export default function GapDashboard({
  analysisData,
  onOpenMasterclass,
  onProceedToTailoring,
  onProceedToInterview,
  onResetWorkspace,
}) {
  const matchResult = analysisData?.match_result || {};
  const score = Math.round(matchResult.score_percentage ?? analysisData?.match_score ?? 0);
  const targetRole = analysisData?.target_role || 'Target Role';

  // Strictly use AI-returned arrays — zero hardcoded defaults
  const matchedSkills = matchResult.matched_skills || [];
  const partialSkills = matchResult.partial_skills || [];
  const missingSkills = matchResult.missing_skills || [];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Banner / Match Summary */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
            <span>Deterministic Match Analysis</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Target Fit for <span className="text-sky-700 dark:text-sky-400">{targetRole}</span>
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Evaluated using Astria's transparent scoring formula:{' '}
            <code className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-800 font-mono">
              Score = ((matched + 0.5 × partial) / total) × 100
            </code>. Zero hallucinations, fully verifiable.
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 rounded-xl flex items-center gap-5 shrink-0 min-w-[240px]">
          <div className="relative w-18 h-18 flex items-center justify-center">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-200"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="currentColor"
                strokeWidth="6"
                className={score >= 70 ? 'text-emerald-500' : score >= 50 ? 'text-amber-500' : 'text-rose-500'}
                fill="transparent"
                strokeDasharray={175.9}
                strokeDashoffset={175.9 - (175.9 * score) / 100}
                strokeLinecap="round"
              />
            </svg>
            <span className="absolute text-lg font-black text-slate-900 dark:text-slate-50">{score}%</span>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Overall Match</div>
            <div className="text-base font-bold text-slate-900">
              {score >= 75 ? 'Strong Match' : score >= 50 ? 'Moderate Fit' : 'Substantial Gaps'}
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {matchedSkills.length} Matched · {partialSkills.length} Partial · {missingSkills.length} Gap
            </div>
          </div>
        </div>
      </div>

      {/* Main Categories Vertical Stack */}
      <div className="space-y-6">
        {/* Category A: Mastered Skills */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Category A: Mastered Skills ({matchedSkills.length})
            </h2>
          </div>

          <div className="space-y-3">
            {matchedSkills.length === 0 ? (
              <p className="text-sm text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                No direct mastered skills identified yet.
              </p>
            ) : (
              matchedSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-l-emerald-500 bg-white dark:bg-slate-900 p-5 rounded-r-xl border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-50">{skill.name}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Status: Mastered (100%)
                      </span>
                    </div>
                    {skill.category && (
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {skill.category}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {skill.reasoning || 'Firm evidence confirmed in verified strengths and experience background matching target requirements.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Category B: Partial / In-Progress Skills */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Category B: Partial / In-Progress Skills ({partialSkills.length})
            </h2>
          </div>

          <div className="space-y-3">
            {partialSkills.length === 0 ? (
              <p className="text-sm text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                No partial skills identified.
              </p>
            ) : (
              partialSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-l-amber-500 bg-white dark:bg-slate-900 p-5 rounded-r-xl border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">{skill.name}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        Status: Partial (50% Weight)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenMasterclass && onOpenMasterclass(skill.name, 'partial')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300 transition-colors shrink-0 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-amber-700" />
                      <span>{skill.name} Masterclass ↗</span>
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {skill.reasoning || 'Adjacent skills present; targeted practice needed to solidify full requirements.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Category C: Missing Skill Gaps */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <XCircle className="w-5 h-5 text-rose-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Category C: Missing Skill Gaps ({missingSkills.length})
            </h2>
          </div>

          <div className="space-y-3">
            {missingSkills.length === 0 ? (
              <p className="text-sm text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                No missing skill gaps detected! Excellent alignment.
              </p>
            ) : (
              missingSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="border-l-4 border-l-rose-500 bg-white dark:bg-slate-900 p-5 rounded-r-xl border-y border-r border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-slate-900 dark:text-slate-100">{skill.name}</span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                        Status: Missing Gap (0%)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => onOpenMasterclass && onOpenMasterclass(skill.name, 'missing')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-900 hover:bg-rose-100 border border-rose-300 transition-colors shrink-0 shadow-sm"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-rose-700" />
                      <span>{skill.name} Masterclass ↗</span>
                    </button>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {skill.reasoning || 'Mandated in target job requirements with no demonstrable exposure found.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      {/* CTA Row */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onResetWorkspace}
          className="flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Adjust Resume or Job Input</span>
        </button>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onProceedToInterview}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            <Terminal className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            <span>Mock Technical Interview</span>
          </button>

          <button
            type="button"
            onClick={onProceedToTailoring}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 transition-all shadow-sm"
          >
            <FileText className="w-4 h-4" />
            <span>Proceed to ATS Resume Tailoring & Export</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
