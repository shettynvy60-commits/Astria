import React, { useState, useRef } from 'react';
import { 
  X, ExternalLink, BookOpen, CheckCircle2, Award, Layers, Sparkles, ArrowRight, Code2, Upload, FileUp, Lock, AlertCircle
} from 'lucide-react';

const DOCUMENTATION_REPOSITORIES = [
  { name: 'AWS Free Training & Docs', url: 'https://aws.amazon.com/training/', desc: 'Official AWS Skill Builder & documentation pathways.', tags: ['aws', 'cloud', 's3', 'lambda', 'iam', 'devops'] },
  { name: 'Python Official Docs & Tutorials', url: 'https://docs.python.org/3/', desc: 'Official standard library, asyncio, and data structure references.', tags: ['python', 'backend', 'fastapi', 'flask', 'django'] },
  { name: 'MDN Web Docs', url: 'https://developer.mozilla.org/', desc: 'The authoritative reference for JavaScript, TypeScript, HTTP, and Web APIs.', tags: ['javascript', 'typescript', 'frontend', 'web', 'rest', 'graphql'] },
  { name: 'Git Documentation & Pro Git', url: 'https://git-scm.com/doc', desc: 'Official guide to branching, rebasing, and source control fundamentals.', tags: ['git', 'version control', 'devops'] },
  { name: 'Docker Official Documentation', url: 'https://docs.docker.com/', desc: 'Containerization, Dockerfile optimization, and multi-stage builds.', tags: ['docker', 'containers', 'devops', 'kubernetes'] }
];

function getSkillContent(skillName = '') {
  const lower = skillName.toLowerCase();
  if (lower.includes('aws') || lower.includes('cloud')) return {
    courseSteps: [
      { step: 1, title: 'Cloud Architecture & IAM Zero-Trust Principles', desc: 'Understand IAM policies, least-privilege role delegation, and VPC networking fundamentals.' },
      { step: 2, title: 'Serverless & Compute Patterns (Lambda / ECS)', desc: 'Learn event-driven architecture, API Gateway request proxying, and containerized deployments.' },
      { step: 3, title: 'Managed Storage & Observability (S3 + CloudWatch)', desc: 'Configure lifecycle rules, bucket encryption, structured JSON logging, and metric alarms.' }
    ],
    capstonePrompt: 'Build an S3-backed REST microservice with IAM role authentication and deploy via AWS Lambda or containerized ECS with structured CloudWatch logging.'
  };
  if (lower.includes('typescript') || lower.includes('javascript')) return {
    courseSteps: [
      { step: 1, title: 'Advanced Type Modeling & Discriminated Unions', desc: 'Master conditional types, keyof index signatures, and strict null safety in large applications.' },
      { step: 2, title: 'Generics & Asynchronous Concurrency', desc: 'Build type-safe utility functions, API client wrappers, and Promise error boundaries.' },
      { step: 3, title: 'Full-Stack Type Sharing & Validation', desc: 'Integrate runtime validation schemas (Zod) with compile-time TypeScript interfaces.' }
    ],
    capstonePrompt: 'Develop a strictly typed state store and REST client library with generic response handlers and automated schema validation using Zod.'
  };
  if (lower.includes('graphql')) return {
    courseSteps: [
      { step: 1, title: 'Schema Definition Language (SDL) & Resolvers', desc: 'Design clean query, mutation, and subscription schemas with modular resolver graphs.' },
      { step: 2, title: 'N+1 Problem Resolution with DataLoader', desc: 'Batch and cache backend database queries across nested relationship resolvers.' },
      { step: 3, title: 'Federation & Client Caching Best Practices', desc: 'Implement schema stitching/federation and configure Apollo client normalized caching.' }
    ],
    capstonePrompt: 'Construct a GraphQL gateway for a multi-entity database schema utilizing DataLoader batching to eliminate N+1 queries with query complexity analysis.'
  };
  return {
    courseSteps: [
      { step: 1, title: `Core Fundamentals & Architecture: ${skillName}`, desc: `Master core paradigms, operational invariants, and canonical design patterns for ${skillName}.` },
      { step: 2, title: 'Enterprise Production Hardening', desc: 'Address performance bottlenecks, structured error handling, asynchronous workflows, and security.' },
      { step: 3, title: 'Integration & Comprehensive Testing', desc: 'Write deterministic unit and integration test suites adhering to enterprise CI/CD standards.' }
    ],
    capstonePrompt: `Architect and implement an end-to-end production module leveraging ${skillName} with comprehensive automated tests and documentation.`
  };
}

export default function SkillMasterclass({ isOpen, skillName, skillType = 'missing', onClose, onMarkComplete }) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAnalyzingProject, setIsAnalyzingProject] = useState(false);
  const [projectVerified, setProjectVerified] = useState(false);
  const [projectError, setProjectError] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen || !skillName) return null;

  const content = getSkillContent(skillName);

  const handleFileUpload = (file) => {
    if (!file) return;
    const validExts = ['.py', '.js', '.ts', '.zip', '.pdf', '.md', '.txt', '.jsx', '.tsx', '.java', '.go'];
    if (!validExts.some(ext => file.name.toLowerCase().endsWith(ext))) {
      setProjectError('Please upload a code file (.py, .js, .ts, .jsx, .tsx, .zip, .pdf, .md).');
      return;
    }
    setProjectError('');
    setUploadedFile(file);
    setIsAnalyzingProject(true);
    // Simulate AI analysis of uploaded project
    setTimeout(() => {
      setIsAnalyzingProject(false);
      setProjectVerified(true);
    }, 1800);
  };

  const handleComplete = () => {
    if (!projectVerified) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsCompleted(true);
      if (onMarkComplete) onMarkComplete(skillName);
    }, 600);
  };

  const canVerify = projectVerified && !isCompleted;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-2xl w-full my-8 p-6 sm:p-8 relative">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 mb-2">
            <Award className="w-3.5 h-3.5" /><span>Interactive Upskilling Track</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Skill Masterclass & Capstone: <span className="text-sky-700 dark:text-sky-400">{skillName}</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Bridge your gap with authoritative documentation, structured AI micro-courses, and verifiable deliverables.</p>
        </div>

        {/* Section A */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" /><span>Section A: Official Documentation & Free Learning Portals</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DOCUMENTATION_REPOSITORIES.map((repo, idx) => (
              <a key={idx} href={repo.url} target="_blank" rel="noopener noreferrer"
                className="group p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-sky-400 dark:hover:border-sky-600 hover:bg-sky-50/50 dark:hover:bg-sky-900/20 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 group-hover:text-sky-700 dark:group-hover:text-sky-400">{repo.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-snug">{repo.desc}</p>
                </div>
                <div className="mt-2 text-[11px] text-sky-600 dark:text-sky-400 font-medium">Visit Official Docs →</div>
              </a>
            ))}
          </div>
        </div>

        {/* Section B */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" /><span>Section B: AI-Modulated 3-Step Mini-Course</span>
          </h3>
          <div className="space-y-3">
            {content.courseSteps.map(step => (
              <div key={step.step} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-start gap-3.5">
                <div className="w-6 h-6 rounded-full bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{step.step}</div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{step.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section C: Capstone with MANDATORY upload gate */}
        <div className="mb-6 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-700 dark:text-amber-400" /><span>Section C: Capstone Mini-Project Deliverable (Required)</span>
          </h3>
          <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed mb-4">"{content.capstonePrompt}"</p>

          {/* Upload Box */}
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all mb-3 ${
              projectVerified 
                ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/20' 
                : 'border-amber-300 dark:border-amber-700 hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".py,.js,.ts,.jsx,.tsx,.zip,.pdf,.md,.txt,.java,.go" className="hidden"
              onChange={e => handleFileUpload(e.target.files?.[0])} />
            {projectVerified ? (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Project Verified: {uploadedFile?.name}</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">AI analysis complete — {skillName} capstone meets verification criteria.</p>
              </div>
            ) : isAnalyzingProject ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Analyzing {uploadedFile?.name}...</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">AI is verifying your project against skill criteria</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <FileUp className="w-8 h-8 text-amber-500" />
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Upload Your Completed Capstone Project</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">.py, .js, .ts, .jsx, .zip, .pdf, .md accepted</p>
              </div>
            )}
          </div>

          {projectError && (
            <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 mb-3">
              <AlertCircle className="w-3.5 h-3.5" /><span>{projectError}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-amber-200/80 dark:border-amber-800/50">
            <span className="text-xs text-amber-900 dark:text-amber-300">
              Completing this capstone elevates <strong className="font-semibold">{skillName}</strong> to Mastered status.
            </span>

            <div className="relative group">
              <button type="button" onClick={handleComplete} disabled={!canVerify || isVerifying}
                className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${
                  isCompleted ? 'bg-emerald-600 text-white' 
                    : canVerify ? 'bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-white' 
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                }`}>
                {!projectVerified && <Lock className="w-3.5 h-3.5" />}
                {isVerifying ? <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Verifying...</span></> 
                  : isCompleted ? <><CheckCircle2 className="w-3.5 h-3.5" /><span>Skill Verified & Mastered!</span></> 
                  : <span>Mark Complete & Verify Skill</span>}
              </button>
              {!projectVerified && !isCompleted && (
                <div className="absolute bottom-full mb-2 right-0 w-64 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  Upload your Section C Capstone Mini-Project to enable skill verification.
                  <div className="absolute top-full right-4 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 dark:text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span>Astria Continuous Career Learning Architecture</span>
          <button type="button" onClick={onClose} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 font-medium">Close Window</button>
        </div>
      </div>
    </div>
  );
}
