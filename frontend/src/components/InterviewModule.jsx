import React, { useState } from 'react';
import { 
  RotateCcw, CheckCircle2, Send, Sparkles, ArrowLeft, ChevronRight, MessageSquare
} from 'lucide-react';

const INTERVIEW_QUESTIONS = [
  {
    id: 1,
    question: "Can you explain how you would design an asynchronous task processing pipeline in Python, and how you prevent task loss during unexpected server crashes?",
    topic: "Architecture & Backend",
    targetKeywords: ["message queue", "redis", "celery", "rabbitmq", "acknowledgement", "idempotent", "worker", "persistence", "dead letter"]
  },
  {
    id: 2,
    question: "How do you approach securing sensitive candidate data (PII) before passing unstructured resumes to external LLM providers or third-party APIs?",
    topic: "Security & Zero-Trust",
    targetKeywords: ["presidio", "redaction", "tokenization", "anonymization", "local vault", "regex", "hash", "zero-trust", "sanitization"]
  },
  {
    id: 3,
    question: "Describe your strategy for diagnosing and optimizing a slow database query in a relational schema like PostgreSQL or MySQL.",
    topic: "Databases & Performance",
    targetKeywords: ["explain analyze", "index", "b-tree", "n+1", "connection pool", "slow query log", "select fields", "composite index"]
  }
];

const FILLER_WORD_REGEX = /\b(um|uh|like|you know|basically|actually)\b/gi;

export default function InterviewModule({ targetRole = 'Software Engineer', onBackToDashboard, onUpdateMetrics }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const question = INTERVIEW_QUESTIONS[currentQuestionIndex];


  const handleEvaluate = () => {
    if (!candidateAnswer.trim()) return;
    setIsEvaluating(true);
    setTimeout(() => {
      const fillerMatches = candidateAnswer.match(FILLER_WORD_REGEX) || [];
      const fillerCount = fillerMatches.length;
      const words = candidateAnswer.trim().split(/\s+/).filter(Boolean);
      const totalWords = words.length || 1;
      const minutesEstimated = Math.max(0.5, totalWords / 130);
      const fillerRate = Number((fillerCount / minutesEstimated).toFixed(1));
      const fillerCounts = { um: 0, uh: 0, like: 0, 'you know': 0, basically: 0, actually: 0 };
      fillerMatches.forEach(m => { const l = m.toLowerCase(); if (fillerCounts[l] !== undefined) fillerCounts[l]++; });
      const lowerAnswer = candidateAnswer.toLowerCase();
      const matchedKeywordsCount = question.targetKeywords.filter(kw => lowerAnswer.includes(kw.toLowerCase())).length;
      const keywordRatio = matchedKeywordsCount / question.targetKeywords.length;
      let rawScore = Math.min(100, Math.round(keywordRatio * 70 + (totalWords > 25 ? 25 : totalWords) - Math.min(15, fillerCount * 2)));
      const accuracyScore = Math.max(45, Math.min(98, rawScore));
      const result = {
        accuracyScore, fillerCount, fillerRate, fillerMatches, fillerCounts,
        detectedKeywords: question.targetKeywords.filter(kw => lowerAnswer.includes(kw.toLowerCase())),
        rephrasing: `In a production environment, I would decouple ingress by queueing tasks in Redis/RabbitMQ with at-least-once delivery guarantees and worker-level message acknowledgement. To safeguard state across crashes, tasks are persisted with idempotency keys and retry dead-letter queues.`,
        constructiveFeedback: accuracyScore >= 75
          ? "Strong technical depth. You covered essential architectural primitives. Minimizing filler transitions will make your response sound authoritative."
          : "Good baseline intuition. To reach Senior benchmark levels, explicitly articulate persistence guarantees, worker heartbeats, and idempotency mechanisms."
      };
      setEvaluationResult(result);
      setIsEvaluating(false);
      if (onUpdateMetrics) onUpdateMetrics({ fillerRate, fillerCounts, technicalAccuracy: accuracyScore });
    }, 800);
  };

  const handleNextQuestion = () => {
    setCandidateAnswer(''); setEvaluationResult(null);
    setCurrentQuestionIndex(prev => (prev + 1) % INTERVIEW_QUESTIONS.length);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleEvaluate();
    }
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
            Simulating live technical screening for <strong className="text-slate-700 dark:text-slate-300 font-semibold">{targetRole}</strong>. Type your answer and submit for AI evaluation.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg shrink-0">
          Question {currentQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
          <MessageSquare className="w-4 h-4 text-sky-600" />
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
            className="w-full h-40 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none astria-input"
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
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Accuracy</div>
                <div className="text-2xl font-black text-slate-900 dark:text-slate-50">{evaluationResult.accuracyScore}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase">Filler Rate</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{evaluationResult.fillerRate} <span className="text-xs font-normal text-slate-500">wpm</span></div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-2">Detected Filler Words ({evaluationResult.fillerCount} instances)</h4>
            {evaluationResult.fillerCount === 0
              ? <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">🎯 Clean response! Zero filler words detected.</p>
              : <div className="flex flex-wrap gap-2">{evaluationResult.fillerMatches.map((word, i) => (
                  <span key={i} className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-300">"{word}"</span>
                ))}</div>}
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Constructive Technical Evaluation</h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{evaluationResult.constructiveFeedback}</p>
            </div>
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-sky-600" /><span>Exemplary Clean Rephrasing</span>
              </h4>
              <p className="text-sm text-slate-800 dark:text-slate-200 italic leading-relaxed">"{evaluationResult.rephrasing}"</p>
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
