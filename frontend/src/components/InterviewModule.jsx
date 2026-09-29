import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, RotateCcw, CheckCircle2, AlertCircle, Volume2, 
  Send, Sparkles, ArrowLeft, ChevronRight, Shield
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

// Voice PII redaction filter - strips spoken personal identity details
function redactVoicePII(transcript) {
  let redacted = transcript;
  // Spoken name patterns (e.g. "my name is John Smith", "I'm Alex Chen")
  redacted = redacted.replace(/\b(?:my name is|i'm|i am|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, 
    (match, name) => match.replace(name, '[SPOKEN_NAME_REDACTED]'));
  // Phone numbers spoken
  redacted = redacted.replace(/\b(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[SPOKEN_PHONE_REDACTED]');
  // Email addresses spoken/typed
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[SPOKEN_EMAIL_REDACTED]');
  // Location patterns
  redacted = redacted.replace(/\b(?:i live in|i'm from|i'm based in|located in)\s+([A-Z][a-zA-Z\s,]+)/gi,
    (match, loc) => match.replace(loc, '[SPOKEN_LOCATION_REDACTED]'));
  return redacted;
}

export default function InterviewModule({ targetRole = 'Software Engineer', onBackToDashboard, onUpdateMetrics }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [candidateAnswer, setCandidateAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState(null);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [piiRedacted, setPiiRedacted] = useState(false);
  const recognitionRef = useRef(null);
  const question = INTERVIEW_QUESTIONS[currentQuestionIndex];

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.onresult = (event) => {
        let transcript = '';
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript + ' ';
        }
        // Apply voice PII redaction immediately before storing
        const raw = transcript.trim();
        const redacted = redactVoicePII(raw);
        if (redacted !== raw) setPiiRedacted(true);
        setCandidateAnswer(redacted);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    } else {
      setSpeechSupported(false);
    }
    return () => { try { recognitionRef.current?.abort(); } catch {} };
  }, []);

  const toggleListening = () => {
    if (!speechSupported) { alert('Web Speech API not supported. Type your answer below.'); return; }
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
    else { setEvaluationResult(null); setPiiRedacted(false); try { recognitionRef.current?.start(); setIsListening(true); } catch {} }
  };

  const handleEvaluate = () => {
    if (!candidateAnswer.trim()) return;
    if (isListening) { recognitionRef.current?.stop(); setIsListening(false); }
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
    setCandidateAnswer(''); setEvaluationResult(null); setPiiRedacted(false);
    setCurrentQuestionIndex(prev => (prev + 1) % INTERVIEW_QUESTIONS.length);
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
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">Astria Technical Voice Interviewer</h1>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Simulating live technical screening for <strong className="text-slate-700 dark:text-slate-300 font-semibold">{targetRole}</strong>. Voice PII redaction is active — spoken names, phones, and emails are stripped before evaluation.
          </p>
        </div>
        <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg shrink-0">
          Question {currentQuestionIndex + 1} of {INTERVIEW_QUESTIONS.length}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400">
          <Volume2 className="w-4 h-4 text-sky-600" />
          <span>Interviewer Prompt ({question.topic})</span>
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-snug">"{question.question}"</h2>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button type="button" onClick={toggleListening}
              className={`flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm ${isListening ? 'bg-rose-600 text-white animate-pulse' : 'bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-white'}`}>
              {isListening ? <><MicOff className="w-4 h-4" /><span>Stop Speaking</span></> : <><Mic className="w-4 h-4" /><span>Start Answer (Hold to Speak)</span></>}
            </button>
            {isListening && <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 animate-pulse">● Listening & Transcribing...</span>}
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500">
            {piiRedacted && (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                <Shield className="w-3.5 h-3.5" /> PII Redacted
              </span>
            )}
            <span>{speechSupported ? 'Web Speech API Active' : 'Type response below'}</span>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
            Response Transcript (Voice-PII-Redacted | Real-Time Streaming or Editable):
          </label>
          <textarea value={candidateAnswer} onChange={e => setCandidateAnswer(e.target.value)}
            placeholder="Click 'Start Answer' to speak or type your technical answer here..."
            className="w-full h-36 p-4 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-all resize-none astria-input" />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button type="button" onClick={() => { setCandidateAnswer(''); setPiiRedacted(false); }}
            className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 inline-flex items-center gap-1">
            <RotateCcw className="w-3.5 h-3.5" /><span>Clear Transcript</span>
          </button>
          <button type="button" onClick={handleEvaluate} disabled={!candidateAnswer.trim() || isEvaluating}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm ${!candidateAnswer.trim() || isEvaluating ? 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed' : 'bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-white'}`}>
            {isEvaluating ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /><span>Evaluating...</span></> : <><Sparkles className="w-4 h-4" /><span>Analyze Answer & Speech Metrics</span></>}
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
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-50">Performance Evaluation & Speech Feedback</h3>
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
