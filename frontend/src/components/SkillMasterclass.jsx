import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  BookOpen, 
  CheckCircle2, 
  Award, 
  Layers, 
  Sparkles,
  ArrowRight,
  Code2
} from 'lucide-react';

const DOCUMENTATION_REPOSITORIES = [
  {
    name: 'AWS Free Training & Docs',
    url: 'https://aws.amazon.com/training/',
    desc: 'Official AWS Skill Builder & documentation pathways.',
    tags: ['aws', 'cloud', 's3', 'lambda', 'iam', 'devops']
  },
  {
    name: 'Python Official Docs & Tutorials',
    url: 'https://docs.python.org/3/',
    desc: 'Official standard library, asyncio, and data structure references.',
    tags: ['python', 'backend', 'fastapi', 'flask', 'django']
  },
  {
    name: 'MDN Web Docs',
    url: 'https://developer.mozilla.org/',
    desc: 'The authoritative reference for JavaScript, TypeScript, HTTP, and Web APIs.',
    tags: ['javascript', 'typescript', 'frontend', 'web', 'rest', 'graphql']
  },
  {
    name: 'Git Documentation & Pro Git',
    url: 'https://git-scm.com/doc',
    desc: 'Official guide to branching, rebasing, and source control fundamentals.',
    tags: ['git', 'version control', 'devops']
  },
  {
    name: 'Docker Official Documentation',
    url: 'https://docs.docker.com/',
    desc: 'Containerization, Dockerfile optimization, and multi-stage builds.',
    tags: ['docker', 'containers', 'devops', 'kubernetes']
  }
];

// Helper to provide realistic mini-courses & capstones tailored to common skills
function getSkillContent(skillName = '') {
  const lower = skillName.toLowerCase();

  if (lower.includes('aws') || lower.includes('cloud')) {
    return {
      courseSteps: [
        {
          step: 1,
          title: 'Cloud Architecture & IAM Zero-Trust Principles',
          desc: 'Understand IAM policies, least-privilege role delegation, and VPC networking fundamentals.'
        },
        {
          step: 2,
          title: 'Serverless & Compute Patterns (Lambda / ECS)',
          desc: 'Learn event-driven architecture, API Gateway request proxying, and containerized deployments.'
        },
        {
          step: 3,
          title: 'Managed Storage & Observability (S3 + CloudWatch)',
          desc: 'Configure lifecycle rules, bucket encryption, structured JSON logging, and metric alarms.'
        }
      ],
      capstonePrompt: 'Build an S3-backed REST microservice with IAM role authentication and deploy via AWS Lambda or containerized ECS with structured CloudWatch logging.'
    };
  }

  if (lower.includes('typescript') || lower.includes('javascript')) {
    return {
      courseSteps: [
        {
          step: 1,
          title: 'Advanced Type Modeling & Discriminated Unions',
          desc: 'Master conditional types, keyof index signatures, and strict null safety in large applications.'
        },
        {
          step: 2,
          title: 'Generics & Asynchronous Concurrency',
          desc: 'Build type-safe utility functions, API client wrappers, and Promise error boundaries.'
        },
        {
          step: 3,
          title: 'Full-Stack Type Sharing & Validation',
          desc: 'Integrate runtime validation schemas (Zod) with compile-time TypeScript interfaces.'
        }
      ],
      capstonePrompt: 'Develop a strictly typed state store and REST client library with generic response handlers and automated schema validation using Zod.'
    };
  }

  if (lower.includes('graphql')) {
    return {
      courseSteps: [
        {
          step: 1,
          title: 'Schema Definition Language (SDL) & Resolvers',
          desc: 'Design clean query, mutation, and subscription schemas with modular resolver graphs.'
        },
        {
          step: 2,
          title: 'N+1 Problem Resolution with DataLoader',
          desc: 'Batch and cache backend database queries across nested relationship resolvers.'
        },
        {
          step: 3,
          title: 'Federation & Client Caching Best Practices',
          desc: 'Implement schema stitching/federation and configure Apollo client normalized caching.'
        }
      ],
      capstonePrompt: 'Construct a GraphQL gateway for a multi-entity database schema utilizing DataLoader batching to eliminate N+1 queries with query complexity analysis.'
    };
  }

  // Default fallback for any tech skill
  return {
    courseSteps: [
      {
        step: 1,
        title: `Core Fundamentals & Architecture: ${skillName}`,
        desc: `Master core paradigms, operational invariants, and canonical design patterns for ${skillName}.`
      },
      {
        step: 2,
        title: `Enterprise Production Hardening`,
        desc: `Address performance bottlenecks, structured error handling, asynchronous workflows, and security.`
      },
      {
        step: 3,
        title: `Integration & Comprehensive Testing`,
        desc: `Write deterministic unit and integration test suites adhering to enterprise CI/CD standards.`
      }
    ],
    capstonePrompt: `Architect and implement an end-to-end production module leveraging ${skillName} with comprehensive automated tests and documentation.`
  };
}

export default function SkillMasterclass({
  isOpen,
  skillName,
  skillType = 'missing',
  onClose,
  onMarkComplete
}) {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  if (!isOpen || !skillName) return null;

  const content = getSkillContent(skillName);

  const handleComplete = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setIsCompleted(true);
      if (onMarkComplete) {
        onMarkComplete(skillName);
      }
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full my-8 p-6 sm:p-8 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200 mb-2">
            <Award className="w-3.5 h-3.5" />
            <span>Interactive Upskilling Track</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Skill Masterclass & Capstone: <span className="text-sky-700">{skillName}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Bridge your gap with authoritative documentation, structured AI micro-courses, and verifiable deliverables.
          </p>
        </div>

        {/* Section A: Official Documentation & Free Learning Portals */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-slate-400" />
            <span>Section A: Official Documentation & Free Learning Portals</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DOCUMENTATION_REPOSITORIES.map((repo, idx) => (
              <a
                key={idx}
                href={repo.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-3.5 rounded-xl border border-slate-200 hover:border-sky-400 hover:bg-sky-50/50 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-900 group-hover:text-sky-700">
                      {repo.name}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">
                    {repo.desc}
                  </p>
                </div>
                <div className="mt-2 text-[11px] text-sky-600 font-medium">
                  Visit Official Docs →
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* Section B: AI-Modulated 3-Step Mini-Course */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <span>Section B: AI-Modulated 3-Step Mini-Course</span>
          </h3>

          <div className="space-y-3">
            {content.courseSteps.map((step) => (
              <div
                key={step.step}
                className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3.5"
              >
                <div className="w-6 h-6 rounded-full bg-zinc-900 text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {step.step}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">{step.title}</h4>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section C: Capstone Mini-Project Deliverable */}
        <div className="mb-6 p-4 rounded-xl bg-amber-50/60 border border-amber-200">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 mb-2 flex items-center gap-2">
            <Code2 className="w-4 h-4 text-amber-700" />
            <span>Section C: Capstone Mini-Project Deliverable</span>
          </h3>
          <p className="text-sm text-slate-800 font-medium leading-relaxed mb-4">
            "{content.capstonePrompt}"
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-amber-200/80">
            <span className="text-xs text-amber-900">
              Completing this capstone elevates <strong className="font-semibold">{skillName}</strong> to Mastered status.
            </span>

            <button
              type="button"
              onClick={handleComplete}
              disabled={isVerifying || isCompleted}
              className={`w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-2 shrink-0 ${
                isCompleted
                  ? 'bg-emerald-600 text-white'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}
            >
              {isVerifying ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Deliverable...</span>
                </>
              ) : isCompleted ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Skill Verified & Mastered!</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Mark Complete & Verify Skill</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
          <span>Astria Continuous Career Learning Architecture</span>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-600 hover:text-slate-900 font-medium"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
