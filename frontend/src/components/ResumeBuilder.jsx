import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Zap,
  Download,
  BarChart2,
  Hash,
  Sparkles,
  ArrowRight,
  Type,
  ListChecks,
  Target,
  Shield
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { API_BASE } from '../config';

const createStarterResume = (candidateName = '') => `${candidateName.trim() || 'YOUR NAME'}
Email | Phone | City, State | LinkedIn | Portfolio

PROFESSIONAL SUMMARY
[Write 2-3 concise sentences about your experience, strengths, and target role.]

PROFESSIONAL EXPERIENCE
[Job Title] | [Company] | [Month Year - Month Year]
• [Action you took] + [scope/tools] + [measurable result, if known]

EDUCATION
[Degree or program] | [Institution] | [Graduation year]

PROJECTS
[Project name] | [Technologies]
• [What you built, your contribution, and the outcome]

SKILLS
[Skills you can support with real experience]`;

// ATS keyword analysis engine
function analyzeATSKeywords(text, jobKeywords = []) {
  const keywords = [...new Set(jobKeywords.map(keyword => keyword.toLowerCase()))];
  const lower = text.toLowerCase();
  const matchedList = [];
  const missingList = [];
  keywords.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) {
      matchedList.push(kw);
    } else {
      missingList.push(kw);
    }
  });
  return {
    score: keywords.length ? Math.round((matchedList.length / keywords.length) * 100) : 0,
    matched: matchedList,
    missing: missingList,
    total: keywords.length
  };
}

function extractJobKeywords(text) {
  const stopWords = new Set(['and', 'the', 'for', 'with', 'you', 'our', 'are', 'will', 'from', 'that', 'this', 'have', 'has', 'your', 'their', 'which', 'when', 'into', 'than', 'also', 'can', 'but', 'use', 'any', 'new', 'one', 'two', 'how', 'role', 'work', 'years', 'year', 'ability', 'strong', 'including', 'experience', 'knowledge', 'skills', 'preferred', 'required']);
  return [...new Set((text.match(/[a-z][a-z0-9+#./-]{2,}/gi) || [])
    .map(keyword => keyword.toLowerCase())
    .filter(keyword => !stopWords.has(keyword)))];
}

async function scrubText(text) {
  const response = await fetch(`${API_BASE}/api/pii/scrub`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, mode: 'pseudonymize' })
  });
  if (!response.ok) throw new Error('Could not run the local privacy scan. No text was sent for AI processing.');
  return response.json();
}

function restoreLocalPII(text, mapping = {}) {
  return Object.entries(mapping)
    .sort(([first], [second]) => second.length - first.length)
    .reduce((result, [placeholder, original]) => result.split(placeholder).join(original), text);
}

// Analyze bullet points for quantifiable metrics
function analyzeMetrics(text) {
  const lines = text.split('\n').filter(l => l.trim().startsWith('•') || l.trim().startsWith('-'));
  const withMetrics = [];
  const withoutMetrics = [];
  const metricPattern = /\d+[%+kKmM]|\d+\.\d+|\$[\d,.]+|\d+x|\d+\+/;

  lines.forEach((line, idx) => {
    const clean = line.replace(/^[•\-]\s*/, '').trim();
    if (!clean) return;
    if (metricPattern.test(clean)) {
      withMetrics.push({ text: clean, lineIndex: idx });
    } else {
      withoutMetrics.push({ text: clean, lineIndex: idx });
    }
  });

  return {
    totalBullets: withMetrics.length + withoutMetrics.length,
    withMetrics,
    withoutMetrics,
    score: withMetrics.length + withoutMetrics.length > 0
      ? Math.round((withMetrics.length / (withMetrics.length + withoutMetrics.length)) * 100)
      : 0
  };
}

// Analyze action verb strength
function analyzeActionVerbs(text) {
  const strongVerbs = [
    'engineered', 'architected', 'designed', 'implemented', 'optimized', 'led',
    'developed', 'built', 'deployed', 'automated', 'established', 'reduced',
    'increased', 'managed', 'orchestrated', 'spearheaded', 'delivered', 'created',
    'configured', 'integrated', 'executed', 'launched', 'scaled', 'streamlined'
  ];
  const weakVerbs = [
    'helped', 'assisted', 'was responsible for', 'worked on', 'participated in',
    'involved in', 'contributed to', 'supported', 'handled', 'dealt with', 'did'
  ];

  const lower = text.toLowerCase();
  const foundStrong = strongVerbs.filter(v => lower.includes(v));
  const foundWeak = weakVerbs.filter(v => lower.includes(v));

  return {
    strongCount: foundStrong.length,
    weakCount: foundWeak.length,
    strongVerbs: foundStrong,
    weakVerbs: foundWeak,
    score: Math.min(100, Math.round((foundStrong.length / Math.max(1, foundStrong.length + foundWeak.length)) * 100))
  };
}

// Analyze section completeness
function analyzeSections(text) {
  const requiredSections = [
    { name: 'Contact Information', patterns: ['email', 'phone', 'linkedin', 'github'] },
    { name: 'Executive Summary', patterns: ['summary', 'objective', 'profile'] },
    { name: 'Work Experience', patterns: ['experience', 'employment', 'work history'] },
    { name: 'Education', patterns: ['education', 'degree', 'university', 'bachelor', 'master'] },
    { name: 'Technical Skills', patterns: ['skills', 'competencies', 'technologies', 'languages:'] },
    { name: 'Projects', patterns: ['projects', 'portfolio', 'open-source'] }
  ];

  const lower = text.toLowerCase();
  const present = [];
  const missing = [];

  requiredSections.forEach(section => {
    const found = section.patterns.some(p => lower.includes(p));
    if (found) present.push(section.name);
    else missing.push(section.name);
  });

  return {
    present,
    missing,
    score: Math.round((present.length / requiredSections.length) * 100)
  };
}

export default function ResumeBuilder({ candidateName = '', rawResumeText = '', targetRole = '', initialJobDescription = '' }) {
  const [resumeText, setResumeText] = useState(() => rawResumeText.trim() || createStarterResume(candidateName));
  const [role, setRole] = useState(targetRole);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [diagnostics, setDiagnostics] = useState(null);
  const [atsReview, setAtsReview] = useState(null);
  const [grammarLoading, setGrammarLoading] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const editorRef = useRef(null);

  // Run diagnostics on text changes (debounced)
  const runDiagnostics = useCallback((text, jd) => {
    const ats = analyzeATSKeywords(text, extractJobKeywords(jd));
    const metrics = analyzeMetrics(text);
    const verbs = analyzeActionVerbs(text);
    const sections = analyzeSections(text);
    const overallScore = Math.round((ats.score * 0.4) + (metrics.score * 0.25) + (verbs.score * 0.15) + (sections.score * 0.2));

    setDiagnostics({ ats, metrics, verbs, sections, overallScore });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runDiagnostics(resumeText, jobDescription), 300);
    return () => clearTimeout(timer);
  }, [resumeText, jobDescription, runDiagnostics]);

  // Add a target keyword only after the user confirms it accurately describes their skills.
  const applyKeywordFix = (keyword) => {
    if (!window.confirm(`Only add "${keyword}" if you have real experience with it. Add it to your resume?`)) return;
    const skillsHeading = /^\s*(?:technical\s+)?skills\s*$/im.exec(resumeText);
    if (skillsHeading) {
      const lineEnd = resumeText.indexOf('\n', skillsHeading.index + skillsHeading[0].length);
      const headingEnd = lineEnd === -1 ? resumeText.length : lineEnd;
      const contentStart = lineEnd === -1 ? resumeText.length : lineEnd + 1;
      const hasSectionContent = resumeText.slice(contentStart).trim().length > 0;
      const updated = hasSectionContent
        ? `${resumeText.slice(0, contentStart)}${keyword}\n${resumeText.slice(contentStart)}`
        : `${resumeText.slice(0, headingEnd)}\n${keyword}${resumeText.slice(resumeText.length)}`;
      setResumeText(updated);
      return;
    }
    setResumeText(`${resumeText.trimEnd()}\n\nSKILLS\n${keyword}`);
  };

  const focusText = (text) => {
    const index = resumeText.toLowerCase().indexOf(text.toLowerCase());
    if (index < 0 || !editorRef.current) return;
    editorRef.current.focus();
    editorRef.current.setSelectionRange(index, index + text.length);
  };

  const polishResume = async () => {
    if (!resumeText.trim()) return;
    setGrammarLoading(true);
    setActionError('');
    setActionMessage('');
    try {
      const scrubbed = await scrubText(resumeText);
      const response = await fetch(`${API_BASE}/api/ai/grammar/fix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: scrubbed.sanitized_text })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Grammar check failed (${response.status})`);
      setResumeText(restoreLocalPII(data.improved_text, scrubbed.mapping));
      setAtsReview(null);
      setActionMessage(`Grammar and clarity polish complete${data.source ? ` (${data.source})` : ''}. Review the edits before exporting.`);
    } catch (error) {
      setActionError(error.message || 'Could not polish the resume. Check that the backend is running.');
    } finally {
      setGrammarLoading(false);
    }
  };

  const reviewATS = async () => {
    if (!resumeText.trim()) return;
    setAtsLoading(true);
    setActionError('');
    setActionMessage('');
    try {
      const [scrubbedResume, scrubbedJob] = await Promise.all([
        scrubText(resumeText),
        jobDescription.trim() ? scrubText(jobDescription) : Promise.resolve({ sanitized_text: '' })
      ]);
      const response = await fetch(`${API_BASE}/api/ai/ats/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: scrubbedResume.sanitized_text,
          job_description: scrubbedJob.sanitized_text || undefined,
          target_role: role || undefined
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `ATS review failed (${response.status})`);
      setAtsReview(data);
      setActionMessage(`ATS review complete${data.source ? ` (${data.source})` : ''}.`);
    } catch (error) {
      setActionError(error.message || 'Could not review ATS compatibility. Check that the backend is running.');
    } finally {
      setAtsLoading(false);
    }
  };

  // PDF Export with PII re-injection
  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 72;
    const pageWidth = 612;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const lines = resumeText.split('\n');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) { y += 8; return; }

      // Section headers (ALL CAPS)
      if (trimmed === trimmed.toUpperCase() && trimmed.length > 3 && !trimmed.startsWith('•') && !trimmed.startsWith('-')) {
        y += 6;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(15, 23, 42);
        doc.text(trimmed, margin, y);
        y += 4;
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(margin, y, margin + contentWidth, y);
        y += 14;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(51, 65, 85);
      } else {
        const split = doc.splitTextToSize(trimmed, contentWidth - (trimmed.startsWith('•') ? 14 : 0));
        if (y + split.length * 13 > 720) {
          doc.addPage();
          y = margin;
        }
        doc.text(split, trimmed.startsWith('•') ? margin + 14 : margin, y);
        y += split.length * 13;
      }
    });

    const filename = (candidateName || 'My_Resume').trim().replace(/[^a-z0-9_-]+/gi, '_');
    doc.save(`${filename}_Resume.pdf`);
  };

  const exportText = () => {
    const file = new Blob([resumeText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(candidateName || 'My_Resume').trim().replace(/[^a-z0-9_-]+/gi, '_')}_Resume.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const scoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (score >= 60) return 'text-amber-600 dark:text-amber-400';
    return 'text-rose-600 dark:text-rose-400';
  };

  const scoreBg = (score) => {
    if (score >= 80) return 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800';
    if (score >= 60) return 'bg-amber-50 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800';
    return 'bg-rose-50 dark:bg-rose-900/30 border-rose-200 dark:border-rose-800';
  };

  return (
    <div className="animate-fade-in pb-12">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <FileText className="w-6 h-6 text-slate-800 dark:text-slate-100" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            ATS Resume Builder
          </h1>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
            Grammarly-Style
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          Build from your own experience, polish grammar, check a target job, and export. Detected personal details are tokenized before AI checks and restored only in this browser.
        </p>
      </div>

      <div className="grid gap-4 mb-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Target role
          <input
            value={role}
            onChange={(event) => setRole(event.target.value)}
            placeholder="e.g. Product Designer"
            className="mt-1.5 w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-normal text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </label>
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 sm:row-span-2">
          Target job description
          <textarea
            value={jobDescription}
            onChange={(event) => { setJobDescription(event.target.value); setAtsReview(null); }}
            placeholder="Paste the job description to check relevant keywords and fit."
            rows={4}
            className="mt-1.5 w-full resize-y rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm font-normal text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
          />
        </label>
        <div className="flex flex-wrap items-start gap-2">
          <button
            type="button"
            onClick={polishResume}
            disabled={!resumeText.trim() || grammarLoading || atsLoading}
            className="inline-flex items-center gap-2 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:bg-zinc-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {grammarLoading ? 'Polishing...' : 'Fix grammar & clarity'}
          </button>
          <button
            type="button"
            onClick={reviewATS}
            disabled={!resumeText.trim() || grammarLoading || atsLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Target className="h-4 w-4" />
            {atsLoading ? 'Reviewing...' : 'Review resume'}
          </button>
        </div>
        {(actionError || actionMessage) && (
          <p className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-200 sm:col-span-2" role={actionError ? 'alert' : 'status'}>
            {actionError ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            {actionError || actionMessage}
          </p>
        )}
      </div>

      {/* Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
        {/* Left Panel: Editor */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              <span>Interactive Resume Canvas</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">{resumeText.split('\n').length} lines</span>
              <button
                type="button"
                onClick={exportPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 hover:bg-zinc-800 dark:hover:bg-white transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export ATS PDF</span>
              </button>
              <button
                type="button"
                onClick={exportText}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                title="Download editable plain-text resume"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Export TXT</span>
              </button>
            </div>
          </div>
          <textarea
            ref={editorRef}
            value={resumeText}
            onChange={(e) => { setResumeText(e.target.value); setAtsReview(null); }}
            className="w-full p-5 text-sm font-mono leading-relaxed text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 resize-none focus:outline-none"
            style={{ minHeight: '700px' }}
            spellCheck
          />
        </div>

        {/* Right Panel: Diagnostic Sidebar */}
        <div className="lg:col-span-2 space-y-4">
          {/* Overall Score */}
          {diagnostics && (
            <>
              <div className={`p-4 rounded-xl border ${scoreBg(diagnostics.overallScore)}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Overall ATS Score</span>
                  <span className={`text-2xl font-black ${scoreColor(diagnostics.overallScore)}`}>{diagnostics.overallScore}/100</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${diagnostics.overallScore >= 80 ? 'bg-emerald-500' : diagnostics.overallScore >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                    style={{ width: `${diagnostics.overallScore}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Snapshot: target keywords (40%) + measurable detail (25%) + action verbs (15%) + sections (20%)
                </p>
              </div>

              {atsReview && (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">ATS Review</span>
                    <span className="text-lg font-black text-slate-900 dark:text-slate-100">{atsReview.overall_score}/100</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{atsReview.grade}</p>
                  {atsReview.missing_critical_keywords?.length > 0 && (
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold uppercase text-slate-700 dark:text-slate-300">Review these missing terms</p>
                      <p className="mt-1 text-xs text-slate-700 dark:text-slate-300">{atsReview.missing_critical_keywords.join(', ')}</p>
                    </div>
                  )}
                  {atsReview.actionable_recommendations?.length > 0 && (
                    <ul className="mt-3 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                      {atsReview.actionable_recommendations.map((recommendation, index) => <li key={index}>• {recommendation}</li>)}
                    </ul>
                  )}
                  <p className="mt-3 text-[10px] text-slate-500">Confirm every suggestion is accurate before adding it.</p>
                </div>
              )}

              {/* Card 1: ATS Keyword Match */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">ATS Keyword Match</span>
                  </div>
                  <span className={`text-sm font-black ${scoreColor(diagnostics.ats.score)}`}>{diagnostics.ats.score}/100</span>
                </div>
                {diagnostics.ats.total === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add a target job description to compare keywords.</p>
                )}
                {diagnostics.ats.missing.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Missing Keywords:</span>
                    {diagnostics.ats.missing.slice(0, 8).map((kw, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">{kw}</span>
                        <button
                          type="button"
                          onClick={() => applyKeywordFix(kw)}
                          className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Add if accurate
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {diagnostics.ats.total > 0 && diagnostics.ats.missing.length === 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All target keywords present!
                  </p>
                )}
              </div>

              {/* Card 2: Impact & Quantifiable Metrics */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Hash className="w-4 h-4 text-amber-600" />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Impact & Metrics</span>
                  </div>
                  <span className={`text-sm font-black ${scoreColor(diagnostics.metrics.score)}`}>{diagnostics.metrics.score}/100</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                  {diagnostics.metrics.withMetrics.length}/{diagnostics.metrics.totalBullets} bullets have concrete numbers
                </div>
                {diagnostics.metrics.withoutMetrics.length > 0 && (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {diagnostics.metrics.withoutMetrics.slice(0, 4).map((item, i) => (
                      <div key={i} className="p-2 rounded-lg bg-amber-50/50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/40">
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2">{item.text.substring(0, 80)}...</p>
                        <button
                          type="button"
                          onClick={() => focusText(item.text)}
                          className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-1 mt-1"
                        >
                          <Zap className="w-3 h-3" /> Add a real result if known
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Card 3: Action Verb Strength */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Action Verb Strength</span>
                  </div>
                  <span className={`text-sm font-black ${scoreColor(diagnostics.verbs.score)}`}>{diagnostics.verbs.score}/100</span>
                </div>
                <div className="flex gap-2 mb-2">
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">{diagnostics.verbs.strongCount} strong</span>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{diagnostics.verbs.weakCount} weak</span>
                </div>
                {diagnostics.verbs.weakVerbs.length > 0 && (
                  <div className="space-y-1.5">
                    {diagnostics.verbs.weakVerbs.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono line-through">"{v}"</span>
                        <button
                          type="button"
                          onClick={() => focusText(v)}
                          className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Review in editor
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {diagnostics.verbs.strongCount > 0 && diagnostics.verbs.weakVerbs.length === 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All verbs are strong and impactful!
                  </p>
                )}
                {diagnostics.metrics.totalBullets === 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">Add resume bullets to review action verbs.</p>
                )}
              </div>

              {/* Card 4: Section Completeness */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ListChecks className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">Section Completeness</span>
                  </div>
                  <span className={`text-sm font-black ${scoreColor(diagnostics.sections.score)}`}>{diagnostics.sections.score}/100</span>
                </div>
                <div className="space-y-1.5">
                  {diagnostics.sections.present.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{s}</span>
                    </div>
                  ))}
                  {diagnostics.sections.missing.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{s} — Missing</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PII Notice */}
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Detected personal details are tokenized by the local backend before AI checks. Your original text is restored in this browser; exports use only the resume text shown in the editor.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
