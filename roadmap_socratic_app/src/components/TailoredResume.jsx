import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  FileCheck, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Download,
  FileText
} from 'lucide-react';
import { jsPDF } from 'jspdf';

export default function TailoredResume({
  tailoredData,
  onGenerateTailored,
  isLoading,
  targetRole,
  candidateName = 'Alex Chen',
  candidateEmail = 'alex.chen@example.com',
  candidatePhone = '(555) 321-9876',
  candidateLocation = 'San Francisco, CA'
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleCopyBullet = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyAll = () => {
    if (!tailoredData?.bullet_points) return;
    const allText = tailoredData.bullet_points.map(b => `• ${b.tailored_bullet}`).join('\n');
    navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  // Section 7: ATS Single-Column Clean PDF Export
  const exportAtsPdf = () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF({
        unit: 'pt',
        format: 'letter' // 612 x 792 pt
      });

      // 1-inch margin = 72 pt
      const margin = 72;
      const pageWidth = 612;
      const contentWidth = pageWidth - margin * 2;
      let y = margin;

      // Header: Candidate Name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text(candidateName.toUpperCase(), margin, y);
      y += 20;

      // Contact info line
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105); // slate-600
      const contactLine = `${candidateEmail} | ${candidatePhone} | ${candidateLocation}`;
      doc.text(contactLine, margin, y);
      y += 24;

      // Divider
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(1);
      doc.line(margin, y, margin + contentWidth, y);
      y += 20;

      // Section: Professional Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('PROFESSIONAL SUMMARY', margin, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const summaryText = `High-impact ${targetRole || 'Software Engineer'} with deep expertise in scalable architecture, asynchronous system design, and production microservices. Rigorously optimized for key qualifications with proven execution velocity.`;
      const splitSummary = doc.splitTextToSize(summaryText, contentWidth);
      doc.text(splitSummary, margin, y);
      y += splitSummary.length * 14 + 14;

      // Section: ATS-Optimized Experience & Impact Bullets
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('QUANTIFIABLE EXPERIENCE & TECHNICAL HIGHLIGHTS', margin, y);
      y += 16;

      const bullets = tailoredData?.bullet_points || [
        {
          targeted_skill: 'FastAPI & Microservices',
          tailored_bullet: 'Engineered high-throughput asynchronous REST microservices in FastAPI and Python, handling 1.5M daily requests with 99.9% uptime.'
        },
        {
          targeted_skill: 'System Architecture',
          tailored_bullet: 'Architected distributed caching layers with Redis and PostgreSQL, reducing p99 API response latencies by 42%.'
        },
        {
          targeted_skill: 'Zero-Trust Security',
          tailored_bullet: 'Implemented automated ingestion-time PII anonymization and zero-trust sanitization pipelines, safeguarding sensitive data compliance.'
        }
      ];

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);

      bullets.forEach((b) => {
        // Bullet symbol
        doc.text('•', margin, y);
        // Bullet text
        const bulletText = b.tailored_bullet;
        const splitBullet = doc.splitTextToSize(bulletText, contentWidth - 14);
        doc.text(splitBullet, margin + 14, y);
        y += splitBullet.length * 14 + 8;
      });

      // Section: Core Competencies
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42);
      doc.text('TECHNICAL COMPETENCIES', margin, y);
      y += 16;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      const skillsLine = 'Languages & Frameworks: Python, FastAPI, TypeScript, REST APIs, GraphQL, Docker, AWS, Git';
      doc.text(skillsLine, margin, y);

      const safeName = candidateName.replace(/\s+/g, '_');
      doc.save(`Tailored_Resume_${safeName}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Could not export PDF. Please check browser permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!tailoredData) {
    return (
      <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-200 shadow-sm text-center space-y-5 animate-fade-in max-w-2xl mx-auto">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
          <FileCheck className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">
            ATS Resume Tailoring & Export
          </h3>
          <p className="text-sm text-slate-600 mt-2 leading-relaxed">
            Reframe your background into high-impact, quantifiable bullet points aligned to{' '}
            <strong className="text-slate-900">{targetRole || 'the target job description'}</strong>.
            All personal identifiers remain safely protected in your local session.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateTailored}
          disabled={isLoading}
          className="btn-primary px-7 py-3.5 rounded-lg text-white font-semibold shadow-sm inline-flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Optimizing Resume Bullets for ATS...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate ATS-Optimized Bullet Points</span>
            </>
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Header bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-50 text-sky-800 border border-sky-200">
            <span>ATS Bullet Optimizer</span>
          </div>
          <h3 className="text-xl font-extrabold text-slate-900 mt-2">
            Tailored Bullet Points for {tailoredData.target_role || targetRole}
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Truthful, metric-driven phrasing mapping candidate competencies directly to recruiter requirements.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleCopyAll}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition-colors"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>Copied All!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy All</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={exportAtsPdf}
            disabled={isExporting}
            className="btn-primary px-4 py-2 rounded-lg text-xs font-semibold text-white flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? 'Generating PDF...' : 'Export ATS PDF'}</span>
          </button>
        </div>
      </div>

      {/* Bullet Points List */}
      <div className="space-y-4">
        {tailoredData.bullet_points?.map((item, idx) => (
          <div
            key={idx}
            className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-medium">Targeted Requirement:</span>
                <span className="px-2.5 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                  {item.targeted_skill}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyBullet(item.tailored_bullet, idx)}
                className="text-slate-500 hover:text-slate-900 flex items-center gap-1 px-2 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* The Bullet text */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 leading-relaxed flex items-start gap-2.5">
              <span className="text-sky-600 font-bold select-none">•</span>
              <span>{item.tailored_bullet}</span>
            </div>

            {/* Rationale explanation */}
            {item.transferable_rationale && (
              <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                <ArrowRight className="w-3.5 h-3.5 text-sky-600 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-700">ATS Strategy:</strong> {item.transferable_rationale}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {tailoredData.optimization_advice && (
        <div className="p-4 rounded-xl bg-sky-50/60 border border-sky-200 text-xs text-slate-600 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <span>{tailoredData.optimization_advice}</span>
        </div>
      )}
    </div>
  );
}
