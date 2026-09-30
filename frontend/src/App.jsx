import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import WorkspaceScreen from './components/WorkspaceScreen';
import AnalysisOverlay from './components/AnalysisOverlay';
import GapDashboard from './components/GapDashboard';
import SkillMasterclass from './components/SkillMasterclass';
import PerformanceDashboard from './components/PerformanceDashboard';
import InterviewModule from './components/InterviewModule';
import TailoredResume from './components/TailoredResume';
import RoadmapView from './components/RoadmapView';
import AITutorSandbox from './components/AITutorSandbox';
import ResumeBuilder from './components/ResumeBuilder';
import LoginPage from './components/LoginPage';
import { UserProvider, useUser } from './context/UserContext';
import { MessageCircle } from 'lucide-react';
import RobotCharacter from './components/RobotCharacter';

const API_BASE = 'http://localhost:8000';

function AppInner() {
  const { user, login, continueAsGuest } = useUser();

  // Guard: show login if not authenticated
  if (!user.isAuthenticated) {
    return <LoginPage onLogin={login} onGuest={continueAsGuest} />;
  }

  return <AppCore />;
}

function AppCore() {
  const { user } = useUser();

  const [hasCompletedAnalysis, setHasCompletedAnalysis] = useState(() => {
    try { return localStorage.getItem('astria_has_completed_analysis') === 'true'; } catch { return false; }
  });

  const [activeView, setActiveView] = useState(() => {
    try {
      const completed = localStorage.getItem('astria_has_completed_analysis') === 'true';
      return completed ? 'dashboard' : 'workspace';
    } catch { return 'workspace'; }
  });

  const [targetRole, setTargetRole] = useState('Senior Software Engineer');

  // All inputs start blank — user provides their own data
  const [rawResumeText, setRawResumeText] = useState('');
  const [rawJobDescription, setRawJobDescription] = useState('');
  const [rawStrengths, setRawStrengths] = useState('');

  // Loading & Overlay state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingTailored, setIsGeneratingTailored] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  const [analysisResult, setAnalysisResult] = useState(() => {
    try {
      const cached = localStorage.getItem('astria_cached_analysis');
      return cached ? JSON.parse(cached) : null;
    } catch { return null; }
  });

  const [masterclassModal, setMasterclassModal] = useState({
    isOpen: false, skillName: '', skillType: 'missing'
  });

  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const closeAiAssistant = useCallback(() => setIsAiAssistantOpen(false), []);

  const [readinessScore, setReadinessScore] = useState(() => {
    try { const s = localStorage.getItem('astria_readiness_score'); return s ? Number(s) : 0; } catch { return 0; }
  });
  const [previousScore, setPreviousScore] = useState(0);

  const [interviewMetrics, setInterviewMetrics] = useState(() => {
    try {
      const saved = localStorage.getItem('astria_interview_metrics');
      return saved ? JSON.parse(saved) : {
        technicalAccuracy: 0, sessionsCount: 0, trend: []
      };
    } catch {
      return { technicalAccuracy: 0, sessionsCount: 0, trend: [] };
    }
  });

  const [tailoredData, setTailoredData] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);

  useEffect(() => {
    try { localStorage.setItem('astria_has_completed_analysis', hasCompletedAnalysis ? 'true' : 'false'); } catch {}
  }, [hasCompletedAnalysis]);

  useEffect(() => {
    if (analysisResult) {
      try { localStorage.setItem('astria_cached_analysis', JSON.stringify(analysisResult)); } catch {}
    }
  }, [analysisResult]);

  useEffect(() => {
    try { localStorage.setItem('astria_readiness_score', String(readinessScore)); } catch {}
  }, [readinessScore]);

  useEffect(() => {
    try { localStorage.setItem('astria_interview_metrics', JSON.stringify(interviewMetrics)); } catch {}
  }, [interviewMetrics]);

  const [analysisError, setAnalysisError] = useState('');

  // Show a clear offline prompt — never attempt naive word extraction,
  // which produces garbage like 'Construct', 'Services', 'Develop' as "skills".
  // The AI backend is the only source of truth for skill classification.
  const setBackendOfflineError = () => {
    setAnalysisError('backend_offline');
    setAnalysisResult(null);
    setIsAnalyzing(false);
    setHasCompletedAnalysis(false);
  };

  const handleExecuteAnalysis = async ({ resumeText, file, strengths, jobDescription }) => {
    setIsAnalyzing(true);
    setAnalysisError('');
    setRawJobDescription(jobDescription);
    setRawStrengths(strengths);
    if (resumeText) setRawResumeText(resumeText);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('resume_file', file);
      } else {
        formData.append('resume_text', resumeText || '');
      }
      formData.append('job_description', jobDescription);
      formData.append('target_role', targetRole);

      const response = await fetch(`${API_BASE}/api/analyze`, { method: 'POST', body: formData });
      if (response && response.ok) {
        const data = await response.json();
        setAnalysisError('');
        setAnalysisResult(data);
        setReadinessScore(Math.round(data?.match_result?.score_percentage || 0));
        setTimeout(() => {
          setIsAnalyzing(false);
          setHasCompletedAnalysis(true);
          setActiveView('analysis');
        }, 1400);
      } else {
        setBackendOfflineError();
      }
    } catch {
      setBackendOfflineError();
    }
  };


  const handleMarkSkillComplete = (skillName) => {
    if (!analysisResult?.match_result) return;
    const mr = { ...analysisResult.match_result };
    const partialIdx = mr.partial_skills?.findIndex(s => s.name === skillName) ?? -1;
    const missingIdx = mr.missing_skills?.findIndex(s => s.name === skillName) ?? -1;

    let elevated = null;
    if (partialIdx !== -1) {
      elevated = { ...mr.partial_skills[partialIdx], status: 'MATCHED', weight: 1.0 };
      mr.partial_skills = mr.partial_skills.filter((_, i) => i !== partialIdx);
    } else if (missingIdx !== -1) {
      elevated = { ...mr.missing_skills[missingIdx], status: 'MATCHED', weight: 1.0 };
      mr.missing_skills = mr.missing_skills.filter((_, i) => i !== missingIdx);
    } else {
      elevated = { name: skillName, status: 'MATCHED', weight: 1.0, reasoning: 'Verified through Astria Capstone.' };
    }
    mr.matched_skills = [...(mr.matched_skills || []), elevated];

    const total = (mr.matched_skills?.length || 0) + (mr.partial_skills?.length || 0) + (mr.missing_skills?.length || 0);
    const newScore = Math.min(100, Math.round((((mr.matched_skills?.length || 0) + 0.5 * (mr.partial_skills?.length || 0)) / (total || 1)) * 100));
    mr.score_percentage = newScore;
    if (mr.audit) { mr.audit.matched_count = mr.matched_skills.length; mr.audit.partial_count = mr.partial_skills.length; mr.audit.missing_count = mr.missing_skills.length; }

    setAnalysisResult({ ...analysisResult, match_result: mr });
    setPreviousScore(readinessScore);
    setReadinessScore(newScore);
    setTimeout(() => setMasterclassModal({ isOpen: false, skillName: '', skillType: 'missing' }), 1200);
  };

  const handleGenerateTailored = async () => {
    setIsGeneratingTailored(true);
    try {
      const response = await fetch(`${API_BASE}/api/tailor-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sanitized_resume_text: analysisResult?.sanitized_resume_text || rawResumeText,
          target_role: targetRole,
          partial_skills: analysisResult?.match_result?.partial_skills || [],
          matched_skills: (analysisResult?.match_result?.matched_skills || []).map(s => s.name)
        })
      });
      if (response.ok) { setTailoredData(await response.json()); }
      else { fallbackTailoredBullets(); }
    } catch { fallbackTailoredBullets(); }
    finally { setIsGeneratingTailored(false); }
  };

  const fallbackTailoredBullets = () => {
    const matched = analysisResult?.match_result?.matched_skills?.map(s => s.name) || ['your verified skills'];
    setTailoredData({
      target_role: targetRole,
      bullet_points: [
        { targeted_skill: matched[0] || 'Core Engineering', tailored_bullet: `Engineered scalable systems leveraging ${matched[0] || 'core technologies'}, handling high-throughput production workloads with measurable performance improvements.`, transferable_rationale: 'Demonstrates production-grade engineering ownership.' },
        { targeted_skill: 'Architecture', tailored_bullet: 'Architected distributed service meshes with automated health checks, circuit breakers, and structured observability dashboards.', transferable_rationale: 'Highlights system design and reliability engineering depth.' },
      ],
      optimization_advice: 'Each tailored bullet integrates active verbs, concrete tech stacks, and quantifiable outcomes.'
    });
  };

  const fallbackRoadmap = () => {
    const partials = analysisResult?.match_result?.partial_skills || [];
    const missings = analysisResult?.match_result?.missing_skills || [];
    const skillsToTeach = [...partials, ...missings].slice(0, 4);

    setRoadmapData({
      target_role: targetRole,
      pedagogical_summary: `Personalized ${skillsToTeach.length || 1}-week curriculum bridging your verified gaps for ${targetRole}.`,
      total_weeks: Math.max(2, skillsToTeach.length || 2),
      weekly_hours: 10,
      milestones: (skillsToTeach.length ? skillsToTeach : [{ name: 'Core delivery fundamentals' }]).map((skill, i) => ({
        week_number: i + 1,
        milestone_title: `${(skill?.name || 'Core delivery fundamentals')} — ${skill?.status === 'PARTIAL' ? 'Reinforcement' : 'Foundations'}`,
        goal_description: skill?.reasoning || `Build practical mastery of ${(skill?.name || 'core delivery fundamentals')} with hands-on deliverables.`,
        modules: [{
          id: `m${i + 1}`,
          focus_skill: skill?.name || 'Core delivery fundamentals',
          title: `${skill?.name || 'Core delivery fundamentals'} Core Architecture & Production Patterns`,
          difficulty: i < 1 ? 'Intermediate' : 'Advanced',
          estimated_hours: 5,
          core_concepts: [`${skill?.name || 'Core delivery fundamentals'} fundamentals`, 'Production best practices', 'Testing & validation'],
          practical_project: {
            project_title: `${skill?.name || 'Core delivery fundamentals'} End-to-End Capstone`,
            deliverable_description: `Build and deploy a production-grade ${(skill?.name || 'core delivery fundamentals')} implementation demonstrating mastery of the core concepts.`
          }
        }]
      }))
    });
  };

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    try {
      const response = await fetch(`${API_BASE}/api/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: targetRole,
          missing_skills: (analysisResult?.match_result?.missing_skills || []).map(skill => skill.name),
          partial_skills: analysisResult?.match_result?.partial_skills || [],
          matched_skills: (analysisResult?.match_result?.matched_skills || []).map(skill => skill.name),
          target_timeline_weeks: 4
        })
      });

      if (response.ok) {
        const data = await response.json();
        setRoadmapData(data);
        return;
      }

      throw new Error('Roadmap generation failed');
    } catch (error) {
      console.warn('Falling back to local roadmap generator:', error);
      fallbackRoadmap();
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleUpdateInterviewMetrics = ({ fillerRate, fillerCounts, technicalAccuracy }) => {
    setInterviewMetrics(prev => ({
      ...prev,
      technicalAccuracy,
      sessionsCount: prev.sessionsCount + 1,
      trend: [...(prev.trend || []).slice(-5), technicalAccuracy]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-50 font-sans flex flex-col transition-colors duration-200">
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        hasCompletedAnalysis={hasCompletedAnalysis}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-6">
        {/* Screen 1: Workspace */}
        {activeView === 'workspace' && (
          <WorkspaceScreen
            onExecuteAnalysis={handleExecuteAnalysis}
            isLoading={isAnalyzing}
            initialResumeText={rawResumeText}
            initialStrengths={rawStrengths}
            initialJobDescription={rawJobDescription}
            error={analysisError}
            onClearError={() => setAnalysisError('')}
          />
        )}

        {/* Screen 3: Gap Analysis Dashboard */}
        {activeView === 'analysis' && (
          <GapDashboard
            analysisData={analysisResult}
            onOpenMasterclass={(skillName, skillType) => setMasterclassModal({ isOpen: true, skillName, skillType })}
            onProceedToTailoring={() => { setActiveView('tailored'); if (!tailoredData) handleGenerateTailored(); }}
            onProceedToInterview={() => setActiveView('interview')}
            onResetWorkspace={() => setActiveView('workspace')}
          />
        )}

        {/* Screen 5: Performance Dashboard */}
        {activeView === 'dashboard' && (
          <PerformanceDashboard
            candidateName={user.fullName || (user.isGuest ? 'Guest' : '')}
            targetRole={targetRole}
            readinessScore={readinessScore}
            previousScore={previousScore}
            interviewMetrics={interviewMetrics}
            missingSkills={analysisResult?.match_result?.missing_skills || []}
            partialSkills={analysisResult?.match_result?.partial_skills || []}
            onStartAction={(skillName) => {
              const target = skillName || analysisResult?.match_result?.missing_skills?.[0]?.name;
              if (target) setMasterclassModal({ isOpen: true, skillName: target, skillType: 'missing' });
            }}
            onLaunchInterview={() => setActiveView('interview')}
            onDownloadResume={() => { setActiveView('tailored'); if (!tailoredData) handleGenerateTailored(); }}
            onOpenWorkspace={() => setActiveView('workspace')}
          />
        )}

        {/* Screen 6: AI Technical Interviewer */}
        {activeView === 'interview' && (
          <InterviewModule
            targetRole={targetRole}
            rawResumeText={rawResumeText}
            onBackToDashboard={() => setActiveView('dashboard')}
            onUpdateMetrics={handleUpdateInterviewMetrics}
          />
        )}

        {/* ATS Resume Builder */}
        {activeView === 'resume-builder' && (
          <ResumeBuilder
            candidateName={user.fullName || ''}
            rawResumeText={rawResumeText}
            targetRole={targetRole}
            initialJobDescription={rawJobDescription}
          />
        )}

        {/* ATS Resume Tailoring */}
        {activeView === 'tailored' && (
          <TailoredResume
            tailoredData={tailoredData}
            onGenerateTailored={handleGenerateTailored}
            isLoading={isGeneratingTailored}
            targetRole={targetRole}
            candidateName={user.fullName || ''}
          />
        )}

        {/* Pedagogical Roadmap */}
        {activeView === 'roadmap' && (
          <RoadmapView
            roadmap={roadmapData}
            onGenerateRoadmap={handleGenerateRoadmap}
            isLoading={isGeneratingRoadmap}
            targetRole={targetRole}
            missingSkillsCount={analysisResult?.match_result?.missing_skills?.length || 0}
            partialSkillsCount={analysisResult?.match_result?.partial_skills?.length || 0}
          />
        )}
      </main>

      {/* Screen 2: Analysis Loading Overlay */}
      <AnalysisOverlay isOpen={isAnalyzing} />

      {/* Screen 4: Skill Masterclass Modal */}
      <SkillMasterclass
        isOpen={masterclassModal.isOpen}
        skillName={masterclassModal.skillName}
        skillType={masterclassModal.skillType}
        onClose={() => setMasterclassModal({ isOpen: false, skillName: '', skillType: 'missing' })}
        onMarkComplete={handleMarkSkillComplete}
      />

      {/* AI Resume Assistant Modal */}
      <AITutorSandbox
        isOpen={isAiAssistantOpen}
        targetRole={targetRole}
        resumeText={rawResumeText}
        jobDescription={rawJobDescription}
        onClose={closeAiAssistant}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-6 mt-auto transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center text-xs text-slate-500 dark:text-slate-400">
          <div>
            <strong className="text-slate-700 dark:text-slate-300 font-semibold">Astria Career Co-Pilot</strong>
            {' '}— Deterministic Skill Gap Analysis & Zero-Trust Privacy Architecture
          </div>
        </div>
      </footer>

      {!isAiAssistantOpen && (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
          <div className="flex items-end justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="relative max-w-[230px] rounded-2xl rounded-br-md border border-slate-300 bg-white px-3.5 py-2.5 text-left text-xs leading-relaxed text-slate-800 shadow-lg transition-transform hover:-translate-y-0.5 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              aria-label="Hi, need help with your resume? Open AI tools"
              aria-haspopup="dialog"
            >
              <span className="block"><span className="font-bold">Hi!</span>{' '}Need a hand with your resume?</span>
              <span className="mt-1.5 inline-flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
                <MessageCircle className="h-3.5 w-3.5" /> Open AI Tools
              </span>
              <span aria-hidden="true" className="absolute -bottom-1 right-3 h-2.5 w-2.5 rotate-45 border-b border-r border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900" />
            </button>
            <div className="ai-tools-robot-frame" aria-label="AI tools robot waving hello">
              <RobotCharacter className="ai-tools-robot-character robot-guide--wave" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <UserProvider>
      <AppInner />
    </UserProvider>
  );
}
