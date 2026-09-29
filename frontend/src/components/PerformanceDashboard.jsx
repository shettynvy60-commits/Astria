import React from 'react';
import { 
  TrendingUp, 
  Award, 
  Terminal, 
  FileText, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  BarChart2, 
  Activity,
  Layers,
  Download,
  BookOpen,
  Code2,
  GitBranch,
  Flame,
  Info
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

export default function PerformanceDashboard({
  candidateName = '',
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

  // Recharts data for smooth curved area chart
  const progressionData = [
    { day: 'Day 1', score: 58 },
    { day: 'Day 2', score: 60 },
    { day: 'Day 3', score: 61 },
    { day: 'Day 4', score: 63 },
    { day: 'Day 5', score: 64 },
    { day: 'Day 7', score: 68 },
    { day: 'Day 10', score: 72 },
    { day: 'Day 14', score: readinessScore },
  ];

  // Breakdown subcategories matching the formula
  const categories = [
    { name: 'Verified Skills', score: 88, weight: '35%', color: 'bg-emerald-500' },
    { name: 'ATS Keyword Alignment', score: 76, weight: '40%', color: 'bg-sky-500' },
    { name: 'Interview Fluency', score: 82, weight: '25%', color: 'bg-amber-500' },
  ];

  // Skill-focused next actions (NOT resume edits)
  const skillActions = [
    {
      title: 'Complete REST API Capstone Mini-Project',
      desc: 'Build a production-grade REST API with OpenAPI spec, rate limiting, and authentication',
      impact: '+8% ATS Match',
      icon: Code2,
      priority: 'highest'
    },
    {
      title: 'Practice 5 DSA Questions (Arrays & Trees)',
      desc: 'LeetCode-style problems on binary search trees, two-pointer arrays, and hash maps',
      impact: '+3% Skills',
      icon: BookOpen,
      priority: 'high'
    },
    {
      title: 'Master Git Rebase Workflow',
      desc: 'Interactive rebase, squashing commits, cherry-pick, and conflict resolution patterns',
      impact: '+2% Skills',
      icon: GitBranch,
      priority: 'medium'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* 1. Welcome Banner & Overall Readiness Jump */}
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Readiness Score increased from {previousScore}% to {readinessScore}% (+{scoreDelta}%)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Welcome Back, <span className="text-sky-700 dark:text-sky-400">{candidateName}</span>
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Active Track: <strong className="text-slate-800 dark:text-slate-200 font-semibold">{targetRole}</strong>. Your ongoing technical mastery, interview practice, and resume optimizations are actively tracked below.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onOpenWorkspace}
            className="px-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-semibold transition-all shadow-sm"
          >
            Update Role
          </button>
          <button
            type="button"
            onClick={onLaunchInterview}
            className="px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-white text-sm font-semibold transition-all shadow-sm flex items-center gap-2"
          >
            <Terminal className="w-4 h-4" />
            <span>Practice Interview</span>
          </button>
        </div>
      </div>

      {/* Grid Layout: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
        {/* Block 1 — Skill Progression Chart (Recharts) */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-sky-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Skill Progression & Readiness</h2>
              </div>
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                {readinessScore}% Total
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Weighted composite of verified core strengths, ATS keyword alignment, and mock interview scores.
            </p>

            {/* Sub-category breakdown bars */}
            <div className="space-y-3 mb-6">
              {categories.map((cat, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <span>{cat.name} ({cat.weight})</span>
                    <span className="text-slate-900 dark:text-slate-100">{cat.score}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`${cat.color} h-2.5 rounded-full transition-all duration-500`}
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recharts Smooth Area Chart */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Readiness Score Progression</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">+{readinessScore - 58}% over 14 days</span>
            </div>
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={progressionData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284C7" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#0284C7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={{ stroke: '#E2E8F0' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[50, 100]}
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                  }}
                  formatter={(value) => [`${value}%`, 'Readiness Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#0284C7"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                  dot={{ r: 3, fill: '#0284C7', strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: '#0284C7', stroke: '#FFFFFF', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Block 2 — Technical Interview Fluency (replaces Voice Filler Word panel) */}
        <section className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-amber-600" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Technical Interview Fluency</h2>
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
                {interviewMetrics.sessionsCount} Sessions
              </span>
            </div>

            {/* Technical Accuracy Score */}
            <div className="p-4 rounded-xl bg-sky-50/70 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 mb-4">
              <div className="text-xs font-semibold text-sky-900 dark:text-sky-300 uppercase tracking-wider mb-1">
                Average Technical Accuracy
              </div>
              <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
                {interviewMetrics.technicalAccuracy}%
              </div>
              <div className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold mt-1">
                Based on {interviewMetrics.sessionsCount} completed interview session{interviewMetrics.sessionsCount !== 1 ? 's' : ''}
              </div>
            </div>

            {/* Score trend */}
            <div className="mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Session Accuracy Trend
              </div>
              <div className="flex items-end gap-2 h-12">
                {interviewMetrics.trend.map((score, i) => (
                  <div key={i} className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="w-full bg-sky-500 dark:bg-sky-400 rounded-t-md transition-all"
                      style={{ height: `${(score / 100) * 48}px` }}
                    />
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">{score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
            <span>Code correctness & architecture depth score</span>
            <button
              type="button"
              onClick={onLaunchInterview}
              className="text-sky-600 dark:text-sky-400 hover:text-sky-800 font-semibold inline-flex items-center gap-1"
            >
              Start Drill →
            </button>
          </div>
        </section>
      </div>

      {/* Block 3 — Skill-Focused "Next Best Action" Engine */}
      <section className="w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Skill Development — Next Best Actions</h2>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mb-6">
          Based on your gap audit for <span className="font-semibold text-slate-800 dark:text-slate-200">{targetRole}</span>, these skill development tasks will generate the highest readiness score improvements.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {skillActions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={idx === 0 ? onStartAction : idx === 1 ? onStartAction : onStartAction}
              className={`p-4 rounded-xl border-2 transition-all text-left shadow-sm flex flex-col justify-between hover:shadow-md ${
                idx === 0
                  ? 'border-zinc-900 dark:border-slate-200 bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-white'
                  : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <div>
                <div className={`text-xs font-semibold uppercase tracking-wider mb-1 ${
                  idx === 0 ? 'text-zinc-300 dark:text-slate-500' : 'text-slate-500 dark:text-slate-400'
                }`}>
                  {idx === 0 ? 'Highest Impact' : idx === 1 ? 'Practice' : 'Skill Gap'}
                </div>
                <div className={`text-sm font-bold ${idx === 0 ? '' : 'text-slate-900 dark:text-slate-100'}`}>{action.title}</div>
                <p className={`text-xs mt-1 ${idx === 0 ? 'text-zinc-300 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'}`}>
                  {action.desc}
                </p>
              </div>
              <div className={`mt-4 flex items-center justify-between text-xs font-semibold ${
                idx === 0 ? 'text-zinc-200 dark:text-slate-600' : 'text-sky-700 dark:text-sky-400'
              }`}>
                <span className="flex items-center gap-1">
                  <action.icon className="w-3.5 h-3.5" />
                  <span>Start</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-white/10 dark:bg-slate-900/20 text-[10px]">{action.impact}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Block 4 — Transparent Formula Explanation Card */}
      <section className="w-full bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 text-sky-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">Transparent Scoring Formula</h2>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mb-4">
          <code className="text-sm font-mono text-slate-800 dark:text-slate-200 leading-relaxed block">
            Readiness Score = (Verified Skills × 35%) + (ATS Keyword Alignment × 40%) + (Interview Fluency × 25%)
          </code>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-3 rounded-lg bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-1">Verified Skills (35%)</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">88%</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Contribution: {(88 * 0.35).toFixed(1)} pts</div>
          </div>
          <div className="p-3 rounded-lg bg-sky-50/60 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800">
            <div className="text-xs font-bold text-sky-800 dark:text-sky-300 uppercase mb-1">ATS Keywords (40%)</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">76%</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Contribution: {(76 * 0.40).toFixed(1)} pts</div>
          </div>
          <div className="p-3 rounded-lg bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <div className="text-xs font-bold text-amber-800 dark:text-amber-300 uppercase mb-1">Interview Fluency (25%)</div>
            <div className="text-xl font-black text-slate-900 dark:text-slate-100">82%</div>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-1">Contribution: {(82 * 0.25).toFixed(1)} pts</div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-slate-100/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
          <strong className="text-slate-800 dark:text-slate-200">Delta Breakdown:</strong> Completing the REST API Capstone Mini-Project adds +8% to ATS Keyword Alignment (76% → 84%), boosting overall readiness from {readinessScore}% to ~{Math.min(100, readinessScore + 6)}% (+6% net gain).
        </div>
      </section>
    </div>
  );
}
