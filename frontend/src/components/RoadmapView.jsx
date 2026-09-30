import React, { useState } from 'react';
import { 
  Calendar, 
  BookOpen, 
  Terminal, 
  HelpCircle, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  CheckCircle2,
  Bot
} from 'lucide-react';
import AITutorSandbox from './AITutorSandbox';

export default function RoadmapView({
  roadmap,
  onGenerateRoadmap,
  isLoading,
  targetRole,
  missingSkillsCount = 0,
  partialSkillsCount = 0,
  resumeText = '',
  jobDescription = ''
}) {
  const [expandedModules, setExpandedModules] = useState({});
  const [activeInterviewToggles, setActiveInterviewToggles] = useState({});
  const [socraticModal, setSocraticModal] = useState({
    isOpen: false,
    skill: ''
  });

  const handleOpenSocraticBot = (skillName) => {
    setSocraticModal({
      isOpen: true,
      skill: skillName || targetRole || 'System Design & Architecture'
    });
  };

  const handleCloseSocraticBot = () => {
    setSocraticModal(prev => ({ ...prev, isOpen: false }));
  };

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
      <div className="space-y-6 max-w-2xl mx-auto animate-fade-in pb-12">
        <div className="bg-white dark:bg-slate-900 p-8 sm:p-12 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <BookOpen className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">AI Pedagogical Roadmap</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
              Turn your <span className="text-rose-600 dark:text-rose-400 font-semibold">{missingSkillsCount} skill gaps</span> and{' '}
              <span className="text-amber-600 dark:text-amber-400 font-semibold">{partialSkillsCount} transferable skills</span> into an interactive, week-by-week technical curriculum.
            </p>
          </div>
          <button
            type="button"
            onClick={onGenerateRoadmap}
            disabled={isLoading}
            className="btn-primary px-7 py-3 rounded-lg font-semibold text-white shadow-sm inline-flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
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

        {/* Instant Socratic AI Mentor Bot Option */}
        <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 p-6 rounded-2xl border border-sky-800/40 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0">
              <Bot className="w-6 h-6 text-sky-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/30">
                  Instant Mentor
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Socratic Bot Ready
                </span>
              </div>
              <h4 className="text-base font-bold text-white mt-1">
                Socratic AI Tutor & Architectural Drills
              </h4>
              <p className="text-xs text-sky-100/80 mt-0.5">
                Practice deep Socratic challenges, design trade-offs, and adaptive diagnostic quizzes for <strong>{targetRole}</strong>.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenSocraticBot(targetRole)}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-md transition-all hover:scale-105 inline-flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Bot className="w-4 h-4 text-slate-950" />
            <span>Launch Socratic Bot</span>
          </button>
        </div>

        {/* Socratic AI Mentor Drawer */}
        <AITutorSandbox
          isOpen={socraticModal.isOpen}
          onClose={handleCloseSocraticBot}
          skill={socraticModal.skill}
          targetRole={targetRole}
          resumeText={resumeText}
          jobDescription={jobDescription}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header Summary */}
      <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200">
            Tailored Curriculum
          </span>
          <h3 className="text-2xl font-extrabold text-slate-900 mt-2">
            Target Role: {roadmap.target_role || targetRole}
          </h3>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
            {roadmap.pedagogical_summary}
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="text-center px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-2xl font-black text-slate-900">{roadmap.total_weeks}</span>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Weeks</span>
          </div>
          <div className="text-center px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="block text-2xl font-black text-sky-700">{roadmap.weekly_hours}h</span>
            <span className="text-[11px] text-slate-500 uppercase font-semibold">Hrs / Week</span>
          </div>
        </div>
      </div>

      {/* Socratic AI Bot Dedicated Roadmap Area */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-indigo-950 p-6 rounded-2xl border border-sky-800/40 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-5 animate-fade-in">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center shrink-0 mt-0.5">
            <Bot className="w-7 h-7 text-sky-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-200 border border-sky-400/30">
                Socratic AI Mentor
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Dialogue Active
              </span>
            </div>
            <h4 className="text-lg font-bold text-white tracking-tight">
              AI Socratic Bot — Roadmap Skill Drills
            </h4>
            <p className="text-xs text-sky-100/80 max-w-2xl leading-relaxed mt-0.5">
              Practice architectural trade-offs, answer deep diagnostic challenges, and run Socratic drills customized for each milestone in your <strong>{roadmap.target_role || targetRole}</strong> roadmap.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => handleOpenSocraticBot(roadmap.milestones?.[0]?.modules?.[0]?.focus_skill || targetRole)}
          className="px-5 py-2.5 bg-gradient-to-r from-sky-500 to-sky-400 hover:from-sky-400 hover:to-sky-300 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all hover:scale-105 inline-flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <Bot className="w-4 h-4 text-slate-950" />
          <span>Launch Socratic AI Bot</span>
        </button>
      </div>

      {/* Milestones & Modules Timeline */}
      <div className="space-y-6">
        {roadmap.milestones?.map((milestone) => (
          <div key={`m-${milestone.week_number}`} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            {/* Milestone Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-bold text-sm">
                  W{milestone.week_number}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">{milestone.milestone_title}</h4>
                  <p className="text-xs text-slate-500">{milestone.goal_description}</p>
                </div>
              </div>
              <span className="text-xs text-slate-600 bg-slate-100 px-3 py-1 rounded-full border border-slate-200 font-medium">
                {milestone.modules?.length || 0} Modules
              </span>
            </div>

            {/* Modules List */}
            <div className="grid grid-cols-1 gap-4">
              {milestone.modules?.map((mod) => {
                const isExpanded = expandedModules[mod.id] !== false;
                const practicalProject = mod.practical_project || {};
                const projectTitle = practicalProject.project_title || practicalProject.title || `${mod.focus_skill || 'Skill'} Capstone`;
                const projectDescription = practicalProject.deliverable_description || practicalProject.description || practicalProject.deliverable || 'Build and validate a production-grade implementation of this skill.';

                return (
                  <div
                    key={mod.id}
                    className="p-5 rounded-xl bg-slate-50/70 border border-slate-200 hover:border-slate-300 transition-all space-y-4"
                  >
                    {/* Module Title Bar */}
                    <div
                      onClick={() => toggleModule(mod.id)}
                      className="flex items-center justify-between cursor-pointer select-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs uppercase font-mono px-2.5 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-semibold">
                          {mod.focus_skill}
                        </span>
                        <h5 className="text-sm sm:text-base font-bold text-slate-900 hover:text-sky-700 transition-colors">
                          {mod.title}
                        </h5>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          {mod.difficulty}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-700">
                          ~{mod.estimated_hours}h
                        </span>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-4 pt-2 border-t border-slate-200 text-sm">
                        {/* Core Concepts */}
                        <div>
                          <span className="text-xs font-semibold uppercase text-slate-500 tracking-wider block mb-2">
                            Key Architectural Concepts
                          </span>
                          <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                            {mod.core_concepts?.map((concept, cIdx) => (
                              <li key={cIdx} className="flex items-center gap-2 text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{concept}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Hands-on Mini Project */}
                        {mod.practical_project && (
                          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-sky-800 flex items-center gap-1.5 uppercase tracking-wide">
                                <Terminal className="w-3.5 h-3.5 text-sky-600" />
                                Capstone: {projectTitle}
                              </span>
                              <span className="text-[10px] text-slate-500">Deliverable Verification</span>
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed">
                              {projectDescription}
                            </p>
                          </div>
                        )}

                        {/* Socratic Bot Module Action */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-sky-50/70 border border-sky-200/80">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center shrink-0">
                              <Bot className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-sky-950">
                                Socratic AI Tutor on {mod.focus_skill}
                              </div>
                              <div className="text-[11px] text-sky-700">
                                Practice real-time trade-offs and diagnostic challenges
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenSocraticBot(mod.focus_skill || mod.title)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold shadow-sm transition-all shrink-0 hover:scale-[1.02]"
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>Ask Socratic Bot</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Socratic AI Mentor Drawer */}
      <AITutorSandbox
        isOpen={socraticModal.isOpen}
        onClose={handleCloseSocraticBot}
        skill={socraticModal.skill}
        targetRole={roadmap.target_role || targetRole}
        resumeText={resumeText}
        jobDescription={jobDescription}
      />
    </div>
  );
}
