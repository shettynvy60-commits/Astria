import React, { useState } from 'react';
import { Calendar, BookOpen, Terminal, HelpCircle, ExternalLink, ChevronDown, ChevronUp, Sparkles, CheckCircle2, Bot } from 'lucide-react';

export default function RoadmapView({
  roadmap,
  onGenerateRoadmap,
  isLoading,
  targetRole,
  missingSkillsCount = 0,
  partialSkillsCount = 0,
  onOpenTutor
}) {
  const [expandedModules, setExpandedModules] = useState({});
  const [activeInterviewToggles, setActiveInterviewToggles] = useState({});

  const toggleModule = (id) => {
    setExpandedModules(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const toggleAnswer = (key) => {
    setActiveInterviewToggles(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  if (!roadmap) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-950/80 border border-brand-500/30 flex items-center justify-center text-brand-400">
          <BookOpen className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-bold text-slate-100">AI Pedagogical Roadmap</h3>
          <p className="text-sm text-slate-400 mt-1">
            Turn your <span className="text-rose-400 font-semibold">{missingSkillsCount} skill gaps</span> and{' '}
            <span className="text-amber-400 font-semibold">{partialSkillsCount} transferable skills</span> into an interactive, week-by-week technical curriculum.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateRoadmap}
          disabled={isLoading}
          className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg glow-brand transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Synthesizing Pedagogical Curriculum...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Personalized Teaching Roadmap</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Summary */}
      <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-brand-400 bg-brand-950/80 px-2.5 py-1 rounded-full border border-brand-500/30">
            Tailored Curriculum
          </span>
          <h3 className="text-2xl font-bold text-slate-100 mt-2">
            Target Role: {roadmap.target_role || targetRole}
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            {roadmap.pedagogical_summary}
          </p>
        </div>
        <div className="flex gap-4">
          <div className="text-center px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="block text-2xl font-extrabold text-brand-400">{roadmap.total_weeks}</span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Weeks</span>
          </div>
          <div className="text-center px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800">
            <span className="block text-2xl font-extrabold text-indigo-400">{roadmap.weekly_hours}h</span>
            <span className="text-[11px] text-slate-400 uppercase font-semibold">Hrs / Week</span>
          </div>
        </div>
      </div>

      {/* Milestones & Modules Timeline */}
      <div className="space-y-6">
        {roadmap.milestones?.map((milestone) => (
          <div key={`m-${milestone.week_number}`} className="glass-panel p-6 rounded-2xl space-y-4">
            {/* Milestone Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-brand-950 border border-brand-500/40 flex items-center justify-center font-bold text-brand-400 text-sm">
                  W{milestone.week_number}
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-100">{milestone.milestone_title}</h4>
                  <p className="text-xs text-slate-400">{milestone.goal_description}</p>
                </div>
              </div>
              <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
                {milestone.modules?.length || 0} Modules
              </span>
            </div>

            {/* Modules List */}
            <div className="grid grid-cols-1 gap-4">
              {milestone.modules?.map((mod) => {
                const isExpanded = expandedModules[mod.id] !== false; // Default expanded
                return (
                  <div
                    key={mod.id}
                    className="p-5 rounded-xl bg-slate-900/70 border border-slate-800/90 hover:border-slate-700 transition-all space-y-4"
                  >
                    {/* Module Title Bar */}
                    <div
                      onClick={() => toggleModule(mod.id)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-500/30">
                          {mod.focus_skill}
                        </span>
                        <h5 className="text-base font-semibold text-slate-100 hover:text-brand-300 transition-colors">
                          {mod.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        {onOpenTutor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenTutor(mod.focus_skill, mod.title);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand-950 text-brand-300 hover:text-white hover:bg-brand-900 border border-brand-500/40 transition-colors shadow-sm"
                            title="Open Socratic AI Tutor Sandbox"
                          >
                            <Bot className="w-3.5 h-3.5 text-brand-400" />
                            <span className="hidden sm:inline">AI Tutor</span>
                          </button>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          {mod.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                          ~{mod.estimated_hours}h
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-4 pt-2 border-t border-slate-800/60 text-sm">
                        {/* Core Concepts */}
                        <div>
                          <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider block mb-2">
                            Key Architectural Concepts
                          </span>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {mod.core_concepts?.map((concept, cIdx) => (
                              <li key={cIdx} className="flex items-center gap-2 text-slate-300 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                                <span>{concept}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Hands-on Mini Project */}
                        {mod.practical_project && (
                          <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/20 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wide">
                                <Terminal className="w-4 h-4" /> Hands-on Mini Project
                              </span>
                              <span className="text-[11px] text-slate-400">Portfolio Deliverable</span>
                            </div>
                            <h6 className="font-semibold text-slate-100 text-sm">
                              {mod.practical_project.title}
                            </h6>
                            <p className="text-xs text-slate-300">
                              {mod.practical_project.description}
                            </p>
                            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <span className="text-slate-400">
                                <strong className="text-slate-300">Deliverable:</strong> {mod.practical_project.deliverable}
                              </span>
                              <div className="flex gap-1.5">
                                {mod.practical_project.key_technologies?.map((tech, tIdx) => (
                                  <span key={tIdx} className="px-2 py-0.5 text-[10px] rounded bg-indigo-950 text-indigo-300 border border-indigo-500/30">
                                    {tech}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interview Prep Questions */}
                        {mod.interview_prep && mod.interview_prep.length > 0 && (
                          <div className="space-y-2">
                            <span className="text-xs font-semibold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                              <HelpCircle className="w-3.5 h-3.5 text-amber-400" /> High-Yield Interview Questions
                            </span>
                            {mod.interview_prep.map((iq, qIdx) => {
                              const toggleKey = `${mod.id}-q-${qIdx}`;
                              const showAns = activeInterviewToggles[toggleKey];
                              return (
                                <div key={qIdx} className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs space-y-2">
                                  <div
                                    onClick={() => toggleAnswer(toggleKey)}
                                    className="flex items-center justify-between cursor-pointer font-medium text-slate-200 hover:text-amber-300 transition-colors"
                                  >
                                    <span>Q: {iq.question}</span>
                                    <span className="text-[11px] text-brand-400 underline ml-2 shrink-0">
                                      {showAns ? 'Hide Guide' : 'Show Answer Guide'}
                                    </span>
                                  </div>
                                  {showAns && (
                                    <div className="pt-2 border-t border-slate-800/80 text-slate-300 space-y-1.5">
                                      <p><strong className="text-emerald-400">Key Points:</strong> {iq.expected_answer_guide}</p>
                                      {iq.common_pitfalls && (
                                        <p className="text-rose-300/90"><strong className="text-rose-400">Trap to Avoid:</strong> {iq.common_pitfalls}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Curated Documentation Links */}
                        {mod.curated_resources && mod.curated_resources.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {mod.curated_resources.map((res, rIdx) => (
                              <a
                                key={rIdx}
                                href={res.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs bg-slate-800/90 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700"
                              >
                                <ExternalLink className="w-3 h-3 text-brand-400" />
                                <span>{res.title}</span>
                              </a>
                            ))}
                          </div>
                        )}

                        {/* Interactive Practice Banner */}
                        {onOpenTutor && (
                          <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-950/80 border border-brand-500/30 text-xs">
                            <div className="flex items-center gap-2.5 text-slate-300">
                              <Bot className="w-4 h-4 text-brand-400 shrink-0" />
                              <span>Stuck on <strong>{mod.focus_skill}</strong>? Practice live Socratic Q&A and diagnostic quizzes.</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => onOpenTutor(mod.focus_skill, mod.title)}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-sm glow-brand transition-all flex items-center gap-1.5 shrink-0"
                            >
                              <Bot className="w-3.5 h-3.5" />
                              <span>Launch AI Tutor Sandbox</span>
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
