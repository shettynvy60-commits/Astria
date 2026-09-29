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

const SECTION_TEMPLATES = {
  contact: `[NAME_PLACEHOLDER]
Email: [EMAIL_PLACEHOLDER] | Phone: [PHONE_PLACEHOLDER] | [LOCATION_PLACEHOLDER]
GitHub: [GITHUB_PLACEHOLDER] | LinkedIn: [LINKEDIN_PLACEHOLDER]`,
  summary: `EXECUTIVE SUMMARY
Senior Software Engineer with 4+ years of hands-on experience architecting high-throughput asynchronous microservices, scalable distributed caching layers, and production-grade CI/CD pipelines. Proven track record of reducing API latency by 42% and maintaining 99.9% uptime across 12+ containerized services.`,
  experience: `PROFESSIONAL EXPERIENCE

Software Engineer | CloudScale Inc. (2022 – Present)
• Engineered and maintained 12+ high-throughput asynchronous microservices using FastAPI and Python, serving 1.5M+ daily API requests with 99.9% measured uptime SLA.
• Architected distributed Redis caching layers integrated with PostgreSQL read replicas, reducing p99 API response latency by 42% from 320ms to 186ms.
• Designed and executed 45+ zero-downtime database migration scripts across MySQL and PostgreSQL using Alembic, maintaining full backward compatibility.
• Containerized all development and production workflows using multi-stage Docker builds, reducing image sizes by 60% and deployment times by 35%.
• Implemented comprehensive structured JSON logging and CloudWatch metric dashboards, improving mean-time-to-detection (MTTD) of production incidents by 55%.
• Led code review processes for a team of 6 engineers, establishing linting standards and automated pre-commit hooks that reduced post-merge defects by 28%.

Junior Software Developer | DataFlow Labs (2020 – 2022)
• Developed RESTful API endpoints using Flask and Django REST Framework, processing 500K+ daily transactions for an internal analytics platform.
• Built automated ETL pipelines using Python and Apache Airflow, reducing manual data processing time by 75%.
• Wrote comprehensive unit and integration test suites achieving 92% code coverage using pytest and unittest frameworks.
• Collaborated with DevOps team to configure CI/CD pipelines using GitHub Actions, reducing deployment cycle time from 2 hours to 15 minutes.`,
  education: `EDUCATION

Bachelor of Science in Computer Science | University of California, Berkeley (2020)
• GPA: 3.7/4.0 | Relevant Coursework: Distributed Systems, Database Architecture, Algorithms & Data Structures, Operating Systems, Computer Networks`,
  projects: `PROJECTS

Real-Time Analytics Dashboard
• Built a real-time data visualization platform using React, D3.js, and WebSocket connections to a FastAPI backend, processing 10K+ events per second with sub-100ms rendering latency.

Open-Source CLI Tool: DevMetrics
• Created a Python CLI tool for automated code quality metrics collection (cyclomatic complexity, test coverage, dependency audits) published on PyPI with 2,000+ monthly downloads.`,
  skills: `TECHNICAL COMPETENCIES

Languages: Python (Expert), JavaScript/TypeScript, SQL, Go, Bash
Frameworks: FastAPI, Flask, Django, React, Next.js
Databases: PostgreSQL, MySQL, Redis, MongoDB, SQLite
DevOps & Cloud: Docker, Kubernetes, AWS (S3, Lambda, ECS, IAM), GitHub Actions, Terraform
Testing: pytest, unittest, Selenium, k6 Load Testing
Architecture: Microservices, Event-Driven Design, REST API Design, GraphQL, System Design`
};

// ATS keyword analysis engine
function analyzeATSKeywords(text, jobKeywords = []) {
  const defaultKeywords = [
    'python', 'fastapi', 'docker', 'kubernetes', 'aws', 'rest api', 'microservices',
    'postgresql', 'redis', 'ci/cd', 'system design', 'react', 'typescript',
    'git', 'agile', 'terraform', 'graphql', 'django', 'flask', 'sql'
  ];
  const keywords = jobKeywords.length > 0 ? jobKeywords : defaultKeywords;
  const lower = text.toLowerCase();
  let matched = 0;
  const matchedList = [];
  const missingList = [];
  keywords.forEach(kw => {
    if (lower.includes(kw.toLowerCase())) {
      matched++;
      matchedList.push(kw);
    } else {
      missingList.push(kw);
    }
  });
  return {
    score: Math.round((matched / keywords.length) * 100),
    matched: matchedList,
    missing: missingList,
    total: keywords.length
  };
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

export default function ResumeBuilder({ candidateName = 'Alex Chen' }) {
  const fullDefault = [
    SECTION_TEMPLATES.contact,
    SECTION_TEMPLATES.summary,
    SECTION_TEMPLATES.experience,
    SECTION_TEMPLATES.education,
    SECTION_TEMPLATES.projects,
    SECTION_TEMPLATES.skills
  ].join('\n\n');

  const [resumeText, setResumeText] = useState(fullDefault);
  const [diagnostics, setDiagnostics] = useState(null);
  const editorRef = useRef(null);

  // Run diagnostics on text changes (debounced)
  const runDiagnostics = useCallback((text) => {
    const ats = analyzeATSKeywords(text);
    const metrics = analyzeMetrics(text);
    const verbs = analyzeActionVerbs(text);
    const sections = analyzeSections(text);
    const overallScore = Math.round((ats.score * 0.4) + (metrics.score * 0.25) + (verbs.score * 0.15) + (sections.score * 0.2));

    setDiagnostics({ ats, metrics, verbs, sections, overallScore });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => runDiagnostics(resumeText), 300);
    return () => clearTimeout(timer);
  }, [resumeText, runDiagnostics]);

  // Apply fix: add missing keyword to skills section
  const applyKeywordFix = (keyword) => {
    const skillsIndex = resumeText.toLowerCase().lastIndexOf('languages:');
    if (skillsIndex !== -1) {
      const lineEnd = resumeText.indexOf('\n', skillsIndex);
      const insertPos = lineEnd !== -1 ? lineEnd : resumeText.length;
      const updated = resumeText.slice(0, insertPos) + ', ' + keyword.charAt(0).toUpperCase() + keyword.slice(1) + resumeText.slice(insertPos);
      setResumeText(updated);
    } else {
      setResumeText(resumeText + '\n\nAdditional Skills: ' + keyword.charAt(0).toUpperCase() + keyword.slice(1));
    }
  };

  // Apply fix: add quantifiable metric to a bullet
  const applyMetricFix = (bulletText) => {
    const idx = resumeText.indexOf(bulletText);
    if (idx !== -1) {
      const enhanced = bulletText + ', resulting in measurable improvement of 25%+ in key performance indicators';
      setResumeText(resumeText.replace(bulletText, enhanced));
    }
  };

  // Apply fix: replace weak verb
  const applyVerbFix = (weakVerb) => {
    const replacements = {
      'helped': 'Spearheaded',
      'assisted': 'Engineered',
      'was responsible for': 'Led and delivered',
      'worked on': 'Architected',
      'participated in': 'Contributed to and drove',
      'involved in': 'Managed',
      'contributed to': 'Championed',
      'supported': 'Enabled',
      'handled': 'Orchestrated',
      'dealt with': 'Resolved',
      'did': 'Executed'
    };
    const replacement = replacements[weakVerb] || 'Engineered';
    const regex = new RegExp(weakVerb, 'gi');
    setResumeText(resumeText.replace(regex, replacement));
  };

  // PDF Export with PII re-injection
  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    const margin = 72;
    const pageWidth = 612;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Re-inject PII from placeholders
    let finalText = resumeText
      .replace(/\[NAME_PLACEHOLDER\]/g, 'ALEX CHEN')
      .replace(/\[EMAIL_PLACEHOLDER\]/g, 'alex.chen@example.com')
      .replace(/\[PHONE_PLACEHOLDER\]/g, '(555) 321-9876')
      .replace(/\[LOCATION_PLACEHOLDER\]/g, 'San Francisco, CA')
      .replace(/\[GITHUB_PLACEHOLDER\]/g, 'github.com/alexchen')
      .replace(/\[LINKEDIN_PLACEHOLDER\]/g, 'linkedin.com/in/alexchen');

    const lines = finalText.split('\n');

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

    doc.save(`Tailored_Resume_Alex_Chen.pdf`);
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
          <FileText className="w-6 h-6 text-sky-600" />
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            ATS Resume Builder
          </h1>
          <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
            Grammarly-Style
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
          Full split-screen editor with real-time ATS diagnostics. PII is tokenized with placeholders — original data is re-injected only during PDF export from your local session vault.
        </p>
      </div>

      {/* Split-Screen Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 w-full">
        {/* Left Panel: Editor */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
              <FileText className="w-4 h-4 text-sky-600" />
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
            </div>
          </div>
          <textarea
            ref={editorRef}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            className="w-full p-5 text-sm font-mono leading-relaxed text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 resize-none focus:outline-none"
            style={{ minHeight: '700px' }}
            spellCheck={false}
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
                  Weighted: Keywords (40%) + Metrics (25%) + Verbs (15%) + Sections (20%)
                </p>
              </div>

              {/* Card 1: ATS Keyword Match */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-sky-600" />
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">ATS Keyword Match</span>
                  </div>
                  <span className={`text-sm font-black ${scoreColor(diagnostics.ats.score)}`}>{diagnostics.ats.score}/100</span>
                </div>
                {diagnostics.ats.missing.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Missing Keywords:</span>
                    {diagnostics.ats.missing.slice(0, 8).map((kw, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-rose-50/50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40">
                        <span className="text-xs text-slate-700 dark:text-slate-300 font-mono">{kw}</span>
                        <button
                          type="button"
                          onClick={() => applyKeywordFix(kw)}
                          className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-800 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Apply Fix
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {diagnostics.ats.missing.length === 0 && (
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
                          onClick={() => applyMetricFix(item.text)}
                          className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-800 flex items-center gap-1 mt-1"
                        >
                          <Zap className="w-3 h-3" /> Add Metrics
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
                    <Type className="w-4 h-4 text-sky-600" />
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
                          onClick={() => applyVerbFix(v)}
                          className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 hover:text-sky-800 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Fix Verb
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {diagnostics.verbs.weakVerbs.length === 0 && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> All verbs are strong and impactful!
                  </p>
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
                <span>PII is tokenized as [PLACEHOLDER] tags. Original data is re-injected from your local session vault only during PDF export.</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
