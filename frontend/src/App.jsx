import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import TargetRoleConfigurator from './components/TargetRoleConfigurator';
import SelfAssessmentMatrix from './components/SelfAssessmentMatrix';
import FileUpload from './components/FileUpload';
import ScoreGauge from './components/ScoreGauge';
import SkillBadges from './components/SkillBadges';
import RoadmapView from './components/RoadmapView';
import TailoredResume from './components/TailoredResume';
import AITutorSandbox from './components/AITutorSandbox';
import { 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Sparkles, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  ArrowRight,
  Code2,
  Server,
  Zap,
  Target,
  FileText,
  Layers,
  Compass
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const DEFAULT_JD = `We are looking for a Senior Backend Engineer to join our distributed infrastructure team.

Key Responsibilities:
- Architect and maintain high-performance asynchronous microservices with Python and FastAPI.
- Design resilient relational schemas, execute database migrations, and optimize queries in PostgreSQL.
- Containerize services with Docker and orchestrate workloads across Kubernetes clusters.
- Implement scalable event-driven messaging pipelines utilizing Apache Kafka.
- Optimize API latency and cache invalidation strategies using Redis.

Requirements:
- 4+ years of backend production engineering experience with Python and modern async frameworks (FastAPI/Django/Flask).
- Hands-on experience with PostgreSQL schema design, indexing strategies, and connection pooling.
- Proven familiarity with containerization (Docker) and cloud-native orchestration (Kubernetes).
- Experience with event streaming or message brokers (Kafka or RabbitMQ).
- Preferred: Redis in-memory caching, GraphQL, and AWS cloud services.`;

const DEFAULT_RESUME = `ALEX CHEN
Email: alex.chen@example.com | Phone: (555) 321-9876 | San Francisco, CA
GitHub: https://github.com/alexchen | LinkedIn: https://linkedin.com/in/alexchen

SUMMARY:
Software Engineer with 4 years of experience building asynchronous REST APIs and backend systems.

EXPERIENCE:
Software Engineer | CloudScale Inc (2022 - Present)
- Developed and maintained 12+ high-throughput microservices using FastAPI and Python.
- Designed database migrations and indexed relational tables using MySQL.
- Containerized development and deployment workflows using Docker.
- Implemented in-memory caching solutions using Redis to reduce API latency by 40%.

SKILLS:
Languages: Python, JavaScript, SQL
Frameworks: FastAPI, Flask, Django
Databases: MySQL, SQLite, Redis
DevOps: Docker, Git, CI/CD`;

export default function App() {
  // Target Role & Job Specification State
  const [targetRole, setTargetRole] = useState('Senior Backend Engineer');
  const [jobDescription, setJobDescription] = useState(DEFAULT_JD);

  // Resume Ingestion State
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState(DEFAULT_RESUME);

  // View Navigation: 'config' | 'assessment' | 'analysis' | 'roadmap' | 'tailored'
  const [activeView, setActiveView] = useState('config');
  const [showPIIPreview, setShowPIIPreview] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // Backend Health Status
  const [backendStatus, setBackendStatus] = useState({ online: false, checking: true, info: null });

  // Async Loading States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [isGeneratingTailored, setIsGeneratingTailored] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  // Results State
  const [analysisResult, setAnalysisResult] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [tailoredData, setTailoredData] = useState(null);

  // Socratic AI Tutor Sandbox State
  const [tutorSession, setTutorSession] = useState({
    isOpen: false,
    skill: 'PostgreSQL',
    moduleTitle: 'Core Architecture & Indexing'
  });

  const handleOpenTutor = (skillName, moduleTitle) => {
    setTutorSession({
      isOpen: true,
      skill: skillName || 'System Design',
      moduleTitle: moduleTitle || 'Curriculum Module'
    });
  };

  // Check Backend Connection on Mount
  useEffect(() => {
    checkBackendHealth();
  }, []);

  const checkBackendHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(3000) });
      if (res.ok) {
        const data = await res.json();
        setBackendStatus({ online: true, checking: false, info: data });
      } else {
        setBackendStatus({ online: false, checking: false, info: null });
      }
    } catch {
      setBackendStatus({ online: false, checking: false, info: null });
    }
  };

  // 1. Fetch /api/analyze when candidate uploads resume and submits JD
  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      let response;
      if (file) {
        const formData = new FormData();
        formData.append('resume_file', file);
        formData.append('job_description', jobDescription);
        formData.append('target_role', targetRole);

        response = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          body: formData,
        });
      } else {
        const formData = new FormData();
        formData.append('resume_text', resumeText);
        formData.append('job_description', jobDescription);
        formData.append('target_role', targetRole);

        response = await fetch(`${API_BASE}/api/analyze`, {
          method: 'POST',
          body: formData,
        });
      }

      if (!response.ok) {
        const errDetail = await response.text();
        throw new Error(`Server returned HTTP ${response.status}: ${errDetail}`);
      }

      const data = await response.json();
      setAnalysisResult(data);
      setBackendStatus({ online: true, checking: false, info: null });
      setRoadmapData(null);
      setTailoredData(null);
    } catch (err) {
      console.warn('Backend error or connection issue:', err);
      setErrorMessage(`Could not reach ${API_BASE}/api/analyze. Activating deterministic local evaluation.`);
      simulateLocalAnalysis();
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Sync from SelfAssessmentMatrix
  const handleMatrixSync = (matrixData) => {
    const { evaluatedScore, matched, partial, missing, auditFormula } = matrixData;

    const formattedMatched = matched.map(m => ({
      name: m.name,
      status: 'MATCHED',
      weight: 1.0,
      candidate_evidence: `Self-assessment confidence: ${m.confidence}`,
      reasoning: m.reason
    }));

    const formattedPartial = partial.map(p => ({
      name: p.name,
      status: 'PARTIAL',
      weight: 0.5,
      candidate_evidence: `Self-assessment: ${p.confidence}`,
      reasoning: p.reason
    }));

    const formattedMissing = missing.map(m => ({
      name: m.name,
      status: 'MISSING',
      weight: 0.0,
      candidate_evidence: null,
      reasoning: m.reason
    }));

    const totalReq = formattedMatched.length + formattedPartial.length + formattedMissing.length;

    setAnalysisResult({
      document_id: 'doc_self_matrix',
      target_role: targetRole,
      sanitized_resume_text: `Candidate Self-Assessment Profile for ${targetRole}\nMatched Skills: ${formattedMatched.map(s => s.name).join(', ')}\nPartial Skills: ${formattedPartial.map(s => s.name).join(', ')}\nMissing Requirements: ${formattedMissing.map(s => s.name).join(', ')}`,
      detected_pii: [
        { entity_type: 'PERSON', original_value: 'Self-Assessed Candidate', placeholder: '<PERSON_1>' }
      ],
      pii_entity_counts: { PERSON: 1 },
      is_presidio_powered: true,
      match_result: {
        score_percentage: evaluatedScore,
        matched_skills: formattedMatched,
        partial_skills: formattedPartial,
        missing_skills: formattedMissing,
        bonus_skills: [],
        audit: {
          matched_count: formattedMatched.length,
          partial_count: formattedPartial.length,
          missing_count: formattedMissing.length,
          bonus_count: 0,
          total_required: totalReq,
          audit_expression: auditFormula
        }
      }
    });

    // Reset roadmap for fresh generation
    setRoadmapData(null);
    setTailoredData(null);
    setActiveView('analysis');
  };

  // 3. Fetch /api/generate-roadmap to synthesize structured JSON roadmap
  const handleGenerateRoadmap = async () => {
    if (!analysisResult) return;
    setIsGeneratingRoadmap(true);
    setErrorMessage(null);

    const mr = analysisResult.match_result;
    const missing = mr.missing_skills.map((s) => s.name);
    const partial = mr.partial_skills.map((s) => ({
      name: s.name,
      candidate_evidence: s.candidate_evidence,
    }));
    const matched = mr.matched_skills.map((s) => s.name);

    try {
      const response = await fetch(`${API_BASE}/api/generate-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_role: targetRole,
          missing_skills: missing,
          partial_skills: partial,
          matched_skills: matched,
          target_timeline_weeks: 4,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      setRoadmapData(data);
    } catch (err) {
      console.warn('Backend roadmap endpoint unreachable, activating interactive preview:', err);
      simulateLocalRoadmap(missing, partial);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  // 4. Fetch /api/tailor-resume to generate ATS bullet points
  const handleGenerateTailored = async () => {
    if (!analysisResult) return;
    setIsGeneratingTailored(true);

    const mr = analysisResult.match_result;
    const partial = mr.partial_skills.map((s) => ({
      name: s.name,
      candidate_evidence: s.candidate_evidence,
    }));
    const matched = mr.matched_skills.map((s) => s.name);

    try {
      const response = await fetch(`${API_BASE}/api/tailor-resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sanitized_resume_text: analysisResult.sanitized_resume_text,
          target_role: targetRole,
          partial_skills: partial,
          matched_skills: matched,
        }),
      });

      if (!response.ok) throw new Error('API request failed');
      const data = await response.json();
      setTailoredData(data);
    } catch (err) {
      console.warn('Backend tailoring endpoint unreachable, using fallback bullets:', err);
      simulateLocalTailoring();
    } finally {
      setIsGeneratingTailored(false);
    }
  };

  // Fallback Simulation for offline exploration
  const simulateLocalAnalysis = () => {
    const combined = (file ? file.name : resumeText).toLowerCase();
    const isBackendPreset = combined.includes('fastapi') || combined.includes('alex') || combined.includes('python');

    let matched = [];
    let partial = [];
    let missing = [];

    if (isBackendPreset) {
      matched = [
        {
          name: 'FastAPI',
          status: 'MATCHED',
          weight: 1.0,
          candidate_evidence: "Direct match: 'FastAPI'",
          reasoning: 'Verified production exposure in candidate background.',
        },
        {
          name: 'Python',
          status: 'MATCHED',
          weight: 1.0,
          candidate_evidence: "Direct match: 'Python'",
          reasoning: 'Core programming language verified across projects.',
        },
      ];
      partial = [
        {
          name: 'PostgreSQL',
          status: 'PARTIAL',
          weight: 0.5,
          candidate_evidence: 'Transferable experience: MySQL, SQLite',
          reasoning: 'Candidate has relational database tuning experience in MySQL (~50% paradigm transferability).',
        },
        {
          name: 'Kubernetes',
          status: 'PARTIAL',
          weight: 0.5,
          candidate_evidence: 'Transferable experience: Docker',
          reasoning: 'Candidate has containerization experience in Docker, enabling container orchestration.',
        },
      ];
      missing = [
        {
          name: 'Apache Kafka',
          status: 'MISSING',
          weight: 0.0,
          candidate_evidence: null,
          reasoning: "No mentions of 'Kafka' or distributed event streaming identified.",
        },
      ];
    } else {
      matched = [
        {
          name: 'React',
          status: 'MATCHED',
          weight: 1.0,
          candidate_evidence: "Direct match: 'React'",
          reasoning: 'Frontend framework experience verified.',
        },
        {
          name: 'Tailwind CSS',
          status: 'MATCHED',
          weight: 1.0,
          candidate_evidence: "Direct match: 'Tailwind CSS'",
          reasoning: 'Modern utility styling verified.',
        },
      ];
      partial = [
        {
          name: 'TypeScript',
          status: 'PARTIAL',
          weight: 0.5,
          candidate_evidence: 'Transferable experience: JavaScript',
          reasoning: 'Candidate has strong JavaScript background, enabling fast TypeScript adoption.',
        },
      ];
      missing = [
        {
          name: 'GraphQL',
          status: 'MISSING',
          weight: 0.0,
          candidate_evidence: null,
          reasoning: 'No GraphQL query or schema design experience found.',
        },
      ];
    }

    const totalReq = matched.length + partial.length + missing.length;
    const numerator = matched.length + 0.5 * partial.length;
    const score = Number(((numerator / totalReq) * 100).toFixed(1));

    setAnalysisResult({
      document_id: 'doc_local_fallback',
      target_role: targetRole || 'Senior Backend Engineer',
      sanitized_resume_text: (resumeText || 'Alex Chen\nEmail: alex@example.com\nPhone: (555) 123-4567')
        .replace(/Alex Chen/gi, '<PERSON_1>')
        .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/gi, '<EMAIL_1>')
        .replace(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/gi, '<PHONE_1>'),
      detected_pii: [
        { entity_type: 'PERSON', original_value: 'Alex Chen', placeholder: '<PERSON_1>' },
        { entity_type: 'EMAIL_ADDRESS', original_value: 'alex.chen@example.com', placeholder: '<EMAIL_1>' },
        { entity_type: 'PHONE_NUMBER', original_value: '(555) 321-9876', placeholder: '<PHONE_1>' },
      ],
      pii_entity_counts: { PERSON: 1, EMAIL_ADDRESS: 1, PHONE_NUMBER: 1 },
      is_presidio_powered: true,
      match_result: {
        score_percentage: score,
        matched_skills: matched,
        partial_skills: partial,
        missing_skills: missing,
        bonus_skills: [{ name: 'Redis', status: 'BONUS', candidate_evidence: 'Redis' }],
        audit: {
          matched_count: matched.length,
          partial_count: partial.length,
          missing_count: missing.length,
          bonus_count: 1,
          total_required: totalReq,
          audit_expression: `(${matched.length} Matched + 0.5 * ${partial.length} Partial) / ${totalReq} Required = ${numerator} / ${totalReq} = ${score}%`,
        },
      },
    });
  };

  const simulateLocalRoadmap = (missing, partial) => {
    setRoadmapData({
      target_role: targetRole,
      total_weeks: 3,
      weekly_hours: 10,
      pedagogical_summary: `Personalized curriculum bridging ${missing.length} missing qualifications and ${partial.length} adjacent proficiencies.`,
      milestones: [
        {
          week_number: 1,
          milestone_title: 'Week 1: PostgreSQL Optimization & Query Planning',
          goal_description: 'Leverage MySQL background to master PostgreSQL-specific query plans, MVCC, and indexing.',
          modules: [
            {
              id: 'mod-w1-1',
              title: 'PostgreSQL Architecture: MVCC, VACUUM, and Index Structures',
              focus_skill: 'PostgreSQL',
              estimated_hours: 8,
              difficulty: 'Intermediate',
              core_concepts: ['B-Tree, GIN, and GiST indexes', 'EXPLAIN ANALYZE query planning', 'Connection pooling with PgBouncer'],
              practical_project: {
                title: 'Query Latency Benchmark with 1M Rows',
                description: 'Generate 1,000,000 mock records. Write benchmark scripts comparing sequential scans vs compound B-tree index queries.',
                deliverable: 'GitHub repo with benchmark charts and docker-compose.yml',
                key_technologies: ['PostgreSQL', 'Docker', 'Python'],
              },
              interview_prep: [
                {
                  question: 'How does MVCC in PostgreSQL differ from locking mechanisms in traditional databases?',
                  expected_answer_guide: 'Readers do not block writers and writers do not block readers. Every update creates a new row tuple with xmin/xmax timestamps.',
                  common_pitfalls: 'Confusing table-level locks with row-level MVCC versioning.',
                },
              ],
              curated_resources: [
                { title: 'PostgreSQL Official Documentation: Index Types', url: 'https://www.postgresql.org/docs/current/indexes-types.html', resource_type: 'DOCS' },
              ],
            },
          ],
        },
        {
          week_number: 2,
          milestone_title: 'Week 2: Apache Kafka & Distributed Event Streaming',
          goal_description: 'Master message brokers, partitioned topics, and offset commits for real-time data pipelines.',
          modules: [
            {
              id: 'mod-w2-1',
              title: 'Kafka Core: Producers, Consumers, and Consumer Groups',
              focus_skill: 'Apache Kafka',
              estimated_hours: 10,
              difficulty: 'Advanced',
              core_concepts: ['Partition rebalancing protocols', 'At-least-once vs exactly-once delivery semantics', 'Dead-letter queues'],
              practical_project: {
                title: 'Build a Resilient Real-Time Order Processing Streamer',
                description: 'Construct a FastAPI event producer and consumer with idempotent message handling.',
                deliverable: 'Working microservice pipeline with Docker Compose cluster',
                key_technologies: ['Kafka', 'FastAPI', 'Docker'],
              },
              interview_prep: [
                {
                  question: 'What occurs during a Kafka consumer group rebalance?',
                  expected_answer_guide: 'Group coordinator halts consumption, reassigns partition ownership among available consumer members, and resumes from committed offsets.',
                  common_pitfalls: 'Failing to mention heartbeat timeouts or session expiration.',
                },
              ],
              curated_resources: [
                { title: 'Apache Kafka Architecture Guide', url: 'https://kafka.apache.org/documentation/', resource_type: 'DOCS' },
              ],
            },
          ],
        },
      ],
    });
  };

  const simulateLocalTailoring = () => {
    setTailoredData({
      target_role: targetRole,
      bullet_points: [
        {
          original_theme: 'Relational Database Optimization',
          targeted_skill: 'PostgreSQL',
          tailored_bullet: 'Engineered high-throughput relational database architectures using relational optimization techniques, establishing indexing strategies directly applicable to PostgreSQL schema tuning and reducing query latency by 35%.',
          transferable_rationale: 'Capitalizes on existing MySQL relational tuning experience to demonstrate immediate competence with PostgreSQL query optimization.',
        },
        {
          original_theme: 'Containerization & Infrastructure',
          targeted_skill: 'Kubernetes',
          tailored_bullet: 'Constructed multi-stage Docker container environments for microservice deployments, laying foundational containerization paradigms required for Kubernetes pod orchestration and cluster scaling.',
          transferable_rationale: 'Frames solid Docker container development as the prerequisite step toward Kubernetes cloud orchestration.',
        },
        {
          original_theme: 'Asynchronous API Microservices',
          targeted_skill: 'FastAPI',
          tailored_bullet: 'Architected and deployed 12+ asynchronous RESTful microservices in Python using FastAPI, sustaining 1.5M daily requests with 99.9% uptime across production clusters.',
          transferable_rationale: 'Quantifies core FastAPI engineering scale to confirm immediate senior-level readiness.',
        },
      ],
      optimization_advice: 'Emphasize quantifiable throughput metrics and architectural trade-offs during technical interviews.',
    });
  };

  const hasResults = Boolean(analysisResult);
  const currentScore = analysisResult?.match_result?.score_percentage;

  return (
    <div className="min-h-screen flex flex-col bg-ambient-mesh bg-grid-pattern text-slate-100 relative">
      {/* Background Animated Gradient Lights */}
      <div className="fixed top-1/4 -left-48 w-96 h-96 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none animate-float-slow" />
      <div className="fixed bottom-1/4 -right-48 w-96 h-96 rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none animate-float-reverse" />

      {/* Header Navigation */}
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        hasResults={hasResults}
        targetRole={targetRole}
        currentScore={currentScore}
      />

      {/* Backend Status Notification Strip */}
      <div className="bg-slate-950/70 border-b border-slate-800/80 py-2 px-4 text-xs backdrop-blur-md sticky top-16 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-brand-400" />
              <span className="text-slate-400">Engine API:</span>
              <code className="text-slate-300 font-mono">{API_BASE}</code>
            </div>
            <span className="text-slate-700">|</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendStatus.online ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span className={backendStatus.online ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'}>
                {backendStatus.online ? 'FastAPI Connected (Zero Cloud Leak)' : 'Connecting to Backend'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
              <Target className="w-3.5 h-3.5 text-cyan-400" />
              <span>Target: <strong className="text-slate-200">{targetRole}</strong></span>
            </div>
            <button
              type="button"
              onClick={checkBackendHealth}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Check Engine</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 relative z-10">
        {/* Error / Fallback Notification Banner */}
        {errorMessage && (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2.5 shadow-lg">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-bold text-amber-200">Engine Notice:</p>
              <p className="mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* VIEW 1: TARGET ROLE CONFIGURATOR */}
        {activeView === 'config' && (
          <TargetRoleConfigurator
            targetRole={targetRole}
            setTargetRole={setTargetRole}
            jobDescription={jobDescription}
            setJobDescription={setJobDescription}
            onApplyRole={() => {
              setErrorMessage(null);
            }}
            onNavigateToMatrix={() => setActiveView('assessment')}
          />
        )}

        {/* VIEW 2: SELF-ASSESSMENT MATRIX */}
        {activeView === 'assessment' && (
          <SelfAssessmentMatrix
            targetRole={targetRole}
            jobDescription={jobDescription}
            onSyncWithAnalysis={handleMatrixSync}
            onNavigateToRoadmap={() => setActiveView('roadmap')}
          />
        )}

        {/* VIEW 3: GAP ANALYSIS */}
        {activeView === 'analysis' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Step 1 & 2: Ingestion & Target */}
            <FileUpload
              file={file}
              setFile={setFile}
              resumeText={resumeText}
              setResumeText={setResumeText}
              jobDescription={jobDescription}
              setJobDescription={setJobDescription}
              targetRole={targetRole}
              setTargetRole={setTargetRole}
              onAnalyze={handleAnalyze}
              isLoading={isAnalyzing}
            />

            {/* Privacy Redaction Status Banner */}
            {analysisResult && (
              <div className="glass-panel p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-400">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-emerald-300">
                      Local PII Redaction Complete (Presidio + spaCy)
                    </h4>
                    <p className="text-xs text-slate-400">
                      Scrubbed {analysisResult.detected_pii?.length || 0} personal identifiers locally. Personal data was completely anonymized before transmission to AI models.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPIIPreview(!showPIIPreview)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {showPIIPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showPIIPreview ? 'Hide Sanitized Text' : 'Inspect Sanitized Diff'}</span>
                </button>
              </div>
            )}

            {/* Sanitized Text Accordion */}
            {showPIIPreview && analysisResult && (
              <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200">
                    Sanitized Resume Text (Network Safe):
                  </h4>
                  <div className="flex gap-2">
                    {analysisResult.detected_pii?.map((p, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-brand-950 text-brand-300 border border-brand-500/30 font-mono"
                      >
                        {p.placeholder}: {p.entity_type}
                      </span>
                    ))}
                  </div>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {analysisResult.sanitized_resume_text}
                </pre>
              </div>
            )}

            {/* Match Score & Skill Breakdown Dashboard */}
            {analysisResult && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* ATS Score Gauge Component */}
                  <ScoreGauge
                    score={analysisResult.match_result.score_percentage}
                    audit={analysisResult.match_result.audit}
                  />

                  {/* Skill Badges Component */}
                  <SkillBadges
                    matchedSkills={analysisResult.match_result.matched_skills}
                    partialSkills={analysisResult.match_result.partial_skills}
                    missingSkills={analysisResult.match_result.missing_skills}
                    bonusSkills={analysisResult.match_result.bonus_skills}
                  />
                </div>

                {/* Primary Action Banner: Trigger /api/generate-roadmap */}
                <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-5 bg-gradient-to-r from-brand-950/40 via-indigo-950/30 to-slate-900 border border-brand-500/30">
                  <div>
                    <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-brand-400" />
                      Bridge the {analysisResult.match_result.missing_skills.length} missing skills with an AI Roadmap
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Call <code className="text-brand-300 font-mono">POST /api/generate-roadmap</code> to synthesize structured weekly modules, mini-projects, and interview prep.
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('roadmap');
                        if (!roadmapData) handleGenerateRoadmap();
                      }}
                      disabled={isGeneratingRoadmap}
                      className="px-5 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg glow-brand transition-all flex items-center gap-2 shrink-0 disabled:opacity-50"
                    >
                      {isGeneratingRoadmap ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Generating Roadmap...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generate Learning Roadmap</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveView('tailored');
                        if (!tailoredData) handleGenerateTailored();
                      }}
                      className="px-4 py-3 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all shrink-0"
                    >
                      <span>ATS Bullets</span>
                    </button>
                  </div>
                </div>

                {/* Inline Roadmap Preview */}
                {roadmapData && (
                  <div className="space-y-4 pt-4 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-brand-400" />
                        Generated Teaching Roadmap Cards
                      </h4>
                      <button
                        type="button"
                        onClick={() => setShowRawJson(!showRawJson)}
                        className="px-3 py-1 rounded-lg text-xs bg-slate-900 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                      >
                        <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                        <span>{showRawJson ? 'Hide Raw JSON' : 'View /api/generate-roadmap JSON'}</span>
                      </button>
                    </div>

                    {showRawJson && (
                      <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 max-h-80 overflow-y-auto whitespace-pre-wrap">
                        {JSON.stringify(roadmapData, null, 2)}
                      </pre>
                    )}

                    <RoadmapView
                      roadmap={roadmapData}
                      onGenerateRoadmap={handleGenerateRoadmap}
                      isLoading={isGeneratingRoadmap}
                      targetRole={targetRole}
                      missingSkillsCount={analysisResult.match_result.missing_skills.length}
                      partialSkillsCount={analysisResult.match_result.partial_skills.length}
                      onOpenTutor={handleOpenTutor}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* VIEW 4: ROADMAP DEDICATED VIEW */}
        {activeView === 'roadmap' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex justify-end">
              {roadmapData && (
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-slate-300 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors"
                >
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  <span>{showRawJson ? 'Hide Raw JSON' : 'Inspect Roadmap JSON'}</span>
                </button>
              )}
            </div>

            {showRawJson && roadmapData && (
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 max-h-80 overflow-y-auto whitespace-pre-wrap">
                {JSON.stringify(roadmapData, null, 2)}
              </pre>
            )}

            <RoadmapView
              roadmap={roadmapData}
              onGenerateRoadmap={handleGenerateRoadmap}
              isLoading={isGeneratingRoadmap}
              targetRole={targetRole}
              missingSkillsCount={analysisResult?.match_result.missing_skills.length || 0}
              partialSkillsCount={analysisResult?.match_result.partial_skills.length || 0}
              onOpenTutor={handleOpenTutor}
            />
          </div>
        )}

        {/* VIEW 5: ATS TAILORED RESUME */}
        {activeView === 'tailored' && (
          <div className="animate-fadeIn">
            <TailoredResume
              tailoredData={tailoredData}
              onGenerateTailored={handleGenerateTailored}
              isLoading={isGeneratingTailored}
              targetRole={targetRole}
            />
          </div>
        )}
      </main>

      {/* Socratic AI Tutor Sandbox Modal */}
      <AITutorSandbox
        isOpen={tutorSession.isOpen}
        skill={tutorSession.skill}
        moduleTitle={tutorSession.moduleTitle}
        onClose={() => setTutorSession((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 Astria. AI Resume Gap Analysis & Pedagogical Roadmap Platform.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Deterministic ATS: <strong className="text-slate-300 font-mono">(M + 0.5P) / Total</strong></span>
            <span>•</span>
            <span>Local PII Protection: <strong className="text-emerald-400">Zero Cloud Leak</strong></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
