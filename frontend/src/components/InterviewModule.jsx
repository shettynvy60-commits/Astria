import React, { useState, useMemo } from 'react';
import { 
  RotateCcw, CheckCircle2, Send, Sparkles, ArrowLeft, ChevronRight, MessageSquare, Terminal
} from 'lucide-react';
import { useUser } from '../context/UserContext';

// Skill-specific question banks
const QUESTION_BANKS = {
  python: [
    { id: 1, question: "Can you explain how you would design an asynchronous task processing pipeline in Python, and how you prevent task loss during unexpected server crashes?", topic: "Python & Backend Architecture", targetKeywords: ["message queue", "redis", "celery", "rabbitmq", "acknowledgement", "idempotent", "worker", "persistence", "dead letter"] },
    { id: 2, question: "Explain Python's GIL — when is it a bottleneck, and how do you work around it for CPU-bound vs I/O-bound workloads?", topic: "Python Concurrency", targetKeywords: ["gil", "multiprocessing", "asyncio", "threading", "cpu-bound", "i/o-bound", "event loop", "coroutine"] },
  ],
  java: [
    { id: 1, question: "Describe how you design thread-safe services in Java 17+ using virtual threads, and how you'd prevent deadlocks in a concurrent banking transaction system.", topic: "Java & Backend Architecture", targetKeywords: ["virtual threads", "synchronized", "reentrantlock", "deadlock", "executorservice", "completablefuture", "atomic", "monitor"] },
    { id: 2, question: "Explain Spring Boot's dependency injection container — how does @Transactional propagation work, and what pitfalls exist with self-invocation?", topic: "Java & Spring Boot", targetKeywords: ["dependency injection", "ioc", "transactional", "propagation", "proxy", "aop", "self-invocation", "bean scope"] },
  ],
  javascript: [
    { id: 1, question: "Explain the JavaScript event loop, microtask queue, and macrotask queue — how do Promises and setTimeout interact in the execution order?", topic: "JavaScript & Runtime", targetKeywords: ["event loop", "microtask", "macrotask", "call stack", "promise", "settimeout", "async/await", "then", "callback"] },
    { id: 2, question: "Describe how you would architect a real-time collaborative editing feature using WebSockets, handling conflict resolution across concurrent users.", topic: "JavaScript & Real-Time", targetKeywords: ["websocket", "operational transform", "crdt", "conflict", "broadcast", "socket.io", "reconnect", "heartbeat"] },
  ],
  typescript: [
    { id: 1, question: "How do you model complex discriminated union types in TypeScript to ensure exhaustive type checking across all cases without runtime errors?", topic: "TypeScript & Type Safety", targetKeywords: ["discriminated union", "exhaustive", "never", "typeof", "instanceof", "type guard", "conditional type", "infer"] },
    { id: 2, question: "Describe how you share type definitions between a FastAPI backend and a React TypeScript frontend, and how you automate schema generation.", topic: "TypeScript & Full-Stack", targetKeywords: ["openapi", "zod", "schema", "type generation", "shared types", "pydantic", "codegen", "strict"] },
  ],
  react: [
    { id: 1, question: "Explain how React's reconciliation algorithm works, and when would you use useMemo, useCallback, and React.memo to prevent unnecessary re-renders?", topic: "React & Performance", targetKeywords: ["reconciliation", "virtual dom", "fiber", "usememo", "usecallback", "react.memo", "re-render", "key prop"] },
    { id: 2, question: "Design a scalable global state architecture for a large React app — compare Context API, Zustand, Redux Toolkit, and Jotai for your use case.", topic: "React & State Management", targetKeywords: ["context", "zustand", "redux", "jotai", "recoil", "atom", "selector", "slice", "immutable"] },
  ],
  sql: [
    { id: 1, question: "Explain the difference between clustered and non-clustered indexes in PostgreSQL, and describe when a composite index is preferable to multiple single indexes.", topic: "SQL & Database Performance", targetKeywords: ["clustered", "btree", "composite", "covering index", "explain analyze", "sequential scan", "index scan", "vacuum"] },
    { id: 2, question: "Describe your approach to designing a sharding strategy for a high-traffic multi-tenant SaaS database — what are the trade-offs between row-level tenancy vs schema-per-tenant?", topic: "SQL & Scalability", targetKeywords: ["sharding", "tenant", "partition", "row-level", "schema", "connection pooling", "pgbouncer", "replication"] },
  ],
  security: [
    { id: 1, question: "How do you approach securing sensitive candidate data (PII) before passing unstructured resumes to external LLM providers or third-party APIs?", topic: "Security & Zero-Trust", targetKeywords: ["presidio", "redaction", "tokenization", "anonymization", "local vault", "regex", "hash", "zero-trust", "sanitization"] },
    { id: 2, question: "Explain the OAuth 2.0 PKCE flow and how it prevents authorization code interception attacks in single-page apps.", topic: "Security & Auth", targetKeywords: ["pkce", "code verifier", "code challenge", "authorization code", "access token", "refresh token", "cors", "csrf"] },
  ],
  default: [
    { id: 1, question: "Describe how you would design a highly available distributed system that handles 1M+ requests per day, including your strategy for failure detection and recovery.", topic: "System Design & Architecture", targetKeywords: ["load balancer", "replication", "failover", "circuit breaker", "health check", "caching", "cdn", "sharding"] },
    { id: 2, question: "How do you approach diagnosing a p99 latency regression that appears only under production load — describe your instrumentation, tracing, and resolution strategy.", topic: "Performance & Observability", targetKeywords: ["tracing", "opentelemetry", "profiler", "flame graph", "slow query", "connection pool", "bottleneck", "metrics"] },
    { id: 3, question: "Explain the CAP theorem and how it applies to your choice between a strongly consistent SQL database vs an eventually consistent NoSQL store for a specific real-world use case.", topic: "Databases & Trade-offs", targetKeywords: ["cap theorem", "consistency", "availability", "partition tolerance", "eventual consistency", "acid", "nosql", "dynamo"] },
  ],
};

function detectSkillCategory(resumeText = '', targetRole = '') {
  const combined = (resumeText + ' ' + targetRole).toLowerCase();
  if (/\bjava\b/.test(combined) && !/javascript/.test(combined)) return 'java';
  if (/\btypescript\b/.test(combined)) return 'typescript';
  if (/\bjavascript\b|\bnode\.js\b|\bnext\.js\b/.test(combined)) return 'javascript';
  if (/\breact\b/.test(combined)) return 'react';
  if (/\bsql\b|\bpostgresql\b|\bmysql\b|\bpostgres\b/.test(combined)) return 'sql';
  if (/\bpython\b/.test(combined)) return 'python';
  if (/\bsecurity\b|\bzero.trust\b|\bpii\b/.test(combined)) return 'security';
  return 'default';
}

const FILLER_WORD_REGEX = /\b(um|uh|like|you know|basically|actually)\b/gi;

export default function InterviewModule({ targetRole = 'Software Engineer', onBackToDashboard, onUpdateMetrics, rawResumeText = '' }) {
  const { user } = useUser();

  const skillCategory = useMemo(() => detectSkillCategory(rawResumeText, targetRole), [rawResumeText, targetRole]);
  const questions = QUESTION_BANKS[skillCategory] || QUESTION_BANKS.default;
  const topicLabel = questions[0]?.topic?.split('&')[0]?.trim()?.toUpperCase() || 'SYSTEM DESIGN';

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const question = questions[currentQuestionIndex % questions.length];

  const displayName = user.fullName || (user.isGuest ? 'Candidate' : 'Candidate');

  const handleEvaluate = () => {
    if (!candidateAnswer.trim()) return;
    setIsEvaluating(true);
    setTimeout(() => {
      const fillerMatches = candidateAnswer.match(FILLER_WORD_REGEX) || [];
      const fillerCount = fillerMatches.length;
      const words = candidateAnswer.trim().split(/\s+/).filter(Boolean);
      const totalWords = words.length || 1;
      const lowerAnswer = candidateAnswer.toLowerCase();
      const matchedKeywordsCount = question.targetKeywords.filter(kw => lowerAnswer.includes(kw.toLowerCase())).length;
      const keywordRatio = matchedKeywordsCount / question.targetKeywords.length;
      const rawScore = Math.min(100, Math.round(keywordRatio * 70 + (totalWords > 25 ? 25 : totalWords) - Math.min(15, fillerCount * 2)));
      const accuracyScore = Math.max(0, Math.min(98, rawScore));
      const result = {
        accuracyScore,
        fillerCount,
        fillerMatches,
        detectedKeywords: question.targetKeywords.filter(kw => lowerAnswer.includes(kw.toLowerCase())),
        constructiveFeedback: accuracyScore >= 75
          ? `Strong technical depth. You covered ${matchedKeywordsCount} of ${question.targetKeywords.length} key concepts. Focus on quantifiable outcomes to reach a Senior benchmark score.`
          : `Good baseline. To reach Senior-level benchmarks, explicitly address: ${question.targetKeywords.slice(0, 3).join(', ')}. Depth and precision matter more than breadth.`,
      };
      setEvaluationResult(result);
      setIsEvaluating(false);
      if (onUpdateMetrics) {
        const fillerCounts = { um: 0, uh: 0, like: 0, 'you know': 0, basically: 0, actually: 0 };
        fillerMatches.forEach(m => { const l = m.toLowerCase(); if (fillerCounts[l] !== undefined) fillerCounts[l]++; });
        onUpdateMetrics({ fillerRate: +(fillerCount / Math.max(0.5, totalWords / 130)).toFixed(1), fillerCounts, technicalAccuracy: accuracyScore });
      }
    }, 800);
  };

  const handleNextQuestion = () => {
    setCandidateAnswer('');
    setEvaluationResult(null);
    setCurrentQuestionIndex(prev => (prev + 1) % questions.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleEvaluate();
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <button type="button" onClick={onBackToDashboard} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 mb-2 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /><span>Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Astria Technical Interviewer</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Technical screening for <strong className="text-slate-700 dark:text-slate-300">{displayName}</strong> — <strong className="text-slate-700 dark:text-slate-300">{targetRole}</strong>. Type your answer and submit for AI evaluation.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg shrink-0">
          Question {(currentQuestionIndex % questions.length) + 1} of {questions.length}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
          <Terminal className="w-4 h-4 text-sky-600" />
          <span>Interviewer Prompt ({question.topic})</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-snug">"{question.question}"</h2>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Your Answer <span className="font-normal text-slate-400 dark:text-slate-500">(Ctrl+Enter to submit)</span>
          </label>
          <textarea
            value={candidateAnswer}
            onChange={e => setCandidateAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your technical answer here..."
            className="w-full h-40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => setCandidateAnswer('')}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /><span>Clear</span>
          </button>
          <button type="button" onClick={handleEvaluate} disabled={!candidateAnswer.trim() || isEvaluating}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${!candidateAnswer.trim() || isEvaluating ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-white'}`}>
            {isEvaluating
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Evaluating...</span></>
              : <><Send className="w-4 h-4" /><span>Submit & Analyze Answer</span></>}
          </button>
        </div>
      </div>

      {evaluationResult && (
        <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
                <CheckCircle2 className="w-3.5 h-3.5" /><span>Evaluation Complete</span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Performance Evaluation & Feedback</h3>
            </div>
            <div className="text-center">
              <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Accuracy</div>
              <div className={`text-3xl font-black ${evaluationResult.accuracyScore >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                {evaluationResult.accuracyScore}%
              </div>
            </div>
          </div>

          {/* Detected keywords */}
          {evaluationResult.detectedKeywords.length > 0 && (
            <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300 mb-2">✓ Key Concepts Covered ({evaluationResult.detectedKeywords.length})</h4>
              <div className="flex flex-wrap gap-2">
                {evaluationResult.detectedKeywords.map((kw, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300">
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Constructive Technical Evaluation</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{evaluationResult.constructiveFeedback}</p>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button type="button" onClick={handleNextQuestion}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-white text-sm font-semibold transition-all shadow-sm">
              <span>Next Technical Question</span><ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
