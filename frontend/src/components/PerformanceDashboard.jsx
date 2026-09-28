import React from 'react';
import { 
  TrendingUp, 
  Award, 
  Mic, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BarChart2, 
  Activity,
  Layers,
  Download
} from 'lucide-react';

export default function PerformanceDashboard({
  candidateName = 'Alex Chen',
  targetRole = 'Senior Software Engineer',
  readinessScore = 78,
  previousScore = 64,
  interviewMetrics = {
    fillerRate: 2.1,
    fillerReductionPercent: 34,
    fillerCounts: {
      um: 3,
      uh: 2,
      like: 4,
      'you know': 1,
      basically: 2,
      actually: 1,
    },
    technicalAccuracy: 86,
    sessionsCount: 4,
    trend: [62, 68, 74, 86]
  },
  onStartAction,
  onLaunchInterview,
  onDownloadResume,
  onOpenWorkspace
}) {
  const scoreDelta = readinessScore - previousScore;

  // Breakdown subcategories
  const categories = [
    { name: 'Core Strengths & Taxonomy', score: 88, weight: '40%' },
    { name: 'Target ATS Keyword Coverage', score: 76, weight: '30%' },
    { name: 'Interview Technical Fluency', score: 82, weight: '30%' },
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Welcome Banner & Overall Readiness Jump */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Readiness Score increased from {previousScore}% to {readinessScore}% (+{scoreDelta}%)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome Back, <span className="text-sky-700">{candidateName}</span>
          </h1>
          <p className="text-sm text-slate-600 max-w-2xl mt-1 leading-relaxed">
            Active Track: <strong className="text-slate-800 font-semibold">{targetRole}</strong>. Your ongoing technical mastery, interview practice, and resume optimizations are actively tracked below.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold transition-all shadow-sm"
          >
            Update Role / Workspace
          </button>
          <button
            type="button"
            onClick={onLaunchInterview}
            className="px-4 py-2.5 rounded-lg bg-zinc-900 text-white hover:bg-zinc-800 text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Mic className="w-4 h-4" />
            <span>Practice Interview</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Block 1 — Skill Progression Chart */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-sky-600" />
                <h2 className="text-lg font-bold text-slate-900">Skill Progression & Readiness</h2>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
                {readinessScore}% Total Readiness
              </span>
            </div>

            <p className="text-xs text-slate-500 mb-6">
              Weighted composite of verified core strengths, ATS keyword alignment, and mock interview scores.
            </p>

            {/* Sub-category breakdown bars */}
            <div className="space-y-4 mb-6">
              {categories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>{cat.name} ({cat.weight})</span>
                    <span className="text-slate-900">{cat.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-zinc-900 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Readiness Trend Visual (SVG sparkline) */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700">Historical Readiness Delta</span>
              <span className="text-xs font-bold text-emerald-600">+14% over last 4 sessions</span>
            </div>
            <div className="h-16 w-full flex items-end gap-3 pt-2">
              {[54, 62, 68, 74, 78].map((val, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-sky-600 rounded-t transition-all hover:bg-sky-500"
                    style={{ height: `${(val / 100) * 48}px` }}
                  />
                  <span className="text-[10px] text-slate-400 font-mono">W{i + 1}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Block 2 — AI Voice Interview & Filler Word Analytics */}
        <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900">Voice Interview Fluency & Speech</h2>
              </div>
              <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-full">
                {interviewMetrics.sessionsCount} Sessions Analyzed
              </span>
            </div>

            {/* Horizontal Visual Meter */}
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 mb-6">
              <div className="text-xs font-semibold text-amber-900 uppercase tracking-wider mb-1">
                Filler Word Usage Rate
              </div>
              <div className="text-xl font-extrabold text-slate-900">
                {interviewMetrics.fillerRate} words per minute
              </div>
              <div className="text-xs text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                <span>↓ Down {interviewMetrics.fillerReductionPercent}% from initial baseline</span>
              </div>
            </div>

            {/* Regex Filler Word Parser Breakdown */}
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Regex Filler Word Breakdown
              </div>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(interviewMetrics.fillerCounts).map(([word, count]) => (
                  <div
                    key={word}
                    className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-center"
                  >
                    <div className="text-xs text-slate-500 font-mono">"{word}"</div>
                    <div className="text-base font-bold text-slate-900 mt-0.5">{count}x</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Fluency Improvement Trend */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>Average Technical Accuracy: <strong className="text-slate-900">{interviewMetrics.technicalAccuracy}%</strong></span>
            <button
              type="button"
              onClick={onLaunchInterview}
              className="text-sky-600 hover:text-sky-800 font-semibold inline-flex items-center gap-1"
            >
              Start Drill →
            </button>
          </div>
        </section>
      </div>

      {/* Block 3 — "Next Best Step" Action Card */}
      <section className="w-full bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900">Recommended Next Best Action</h2>
        </div>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed mb-6">
          Based on your latest gap audit for <span className="font-semibold text-slate-800">{targetRole}</span>, completing the <strong>AWS & Cloud Infrastructure Capstone</strong> will generate the largest immediate jump in hiring score (+8% ATS match).
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Button A */}
          <button
            type="button"
            onClick={onStartAction}
            className="p-4 rounded-xl border-2 border-zinc-900 bg-zinc-900 text-white hover:bg-zinc-800 transition-all text-left shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-zinc-300 uppercase tracking-wider mb-1">
                Highest Impact
              </div>
              <div className="text-base font-bold">Start Recommended Action</div>
              <p className="text-xs text-zinc-300 mt-1">
                AWS Cloud Capstone & S3 Microservice Mini-Course
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-zinc-200">
              <span>Open Masterclass</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Button B */}
          <button
            type="button"
            onClick={onLaunchInterview}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Oral Fluency
              </div>
              <div className="text-base font-bold text-slate-900">Launch AI Technical Interview</div>
              <p className="text-xs text-slate-600 mt-1">
                Simulate 5-minute technical screen & filler word drill
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-sky-700">
              <span>Start Speech Drill</span>
              <Mic className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Button C */}
          <button
            type="button"
            onClick={onDownloadResume}
            className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-all text-left flex flex-col justify-between"
          >
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Export Ready
              </div>
              <div className="text-base font-bold text-slate-900">Download Latest ATS Resume</div>
              <p className="text-xs text-slate-600 mt-1">
                Single-column ATS PDF format with re-injected PII
              </p>
            </div>
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-slate-700">
              <span>Download PDF</span>
              <Download className="w-3.5 h-3.5" />
            </div>
          </button>
        </div>
      </section>
    </div>
  );
}
