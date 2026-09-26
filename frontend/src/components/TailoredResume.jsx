import React, { useState } from 'react';
import { Copy, Check, FileCheck, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function TailoredResume({
  tailoredData,
  onGenerateTailored,
  isLoading,
  targetRole
}) {
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedAll, setCopiedAll] = useState(false);

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

  if (!tailoredData) {
    return (
      <div className="glass-panel p-8 rounded-2xl text-center space-y-4">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <FileCheck className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-xl font-bold text-slate-100">ATS Resume Tailoring</h3>
          <p className="text-sm text-slate-400 mt-1">
            Frame your existing background and transferable proficiencies into quantifiable, ATS-aligned resume bullet points for <span className="text-indigo-300 font-semibold">{targetRole || 'the target role'}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={onGenerateTailored}
          disabled={isLoading}
          className="px-6 py-3 rounded-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg glow-brand transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
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
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold text-indigo-400 bg-indigo-950/80 px-2.5 py-1 rounded-full border border-indigo-500/30">
            ATS Bullet Optimizer
          </span>
          <h3 className="text-xl font-bold text-slate-100 mt-2">
            Tailored Bullet Points for {tailoredData.target_role || targetRole}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Truthful, impact-driven phrasing framing adjacent technical exposure into target qualifications.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyAll}
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
        >
          {copiedAll ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Copied All Bullets!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy All Bullets</span>
            </>
          )}
        </button>
      </div>

      {/* Bullet Points List */}
      <div className="space-y-4">
        {tailoredData.bullet_points?.map((item, idx) => (
          <div
            key={idx}
            className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 hover:border-indigo-500/30 transition-all"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-medium">Targeted Qualification:</span>
                <span className="px-2.5 py-0.5 rounded-full font-mono bg-brand-950 text-brand-300 border border-brand-500/30">
                  {item.targeted_skill}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleCopyBullet(item.tailored_bullet, idx)}
                className="text-slate-400 hover:text-white flex items-center gap-1 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 transition-colors"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            {/* The Markdown / Bullet text */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 font-mono text-xs sm:text-sm text-slate-200 leading-relaxed flex items-start gap-2">
              <span className="text-indigo-400 font-bold select-none">•</span>
              <span>{item.tailored_bullet}</span>
            </div>

            {/* Rationale explanation */}
            {item.transferable_rationale && (
              <div className="flex items-start gap-2 text-xs text-slate-400 pt-1">
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-slate-300">ATS Strategy:</strong> {item.transferable_rationale}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {tailoredData.optimization_advice && (
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-brand-400 shrink-0 mt-0.5" />
          <span>{tailoredData.optimization_advice}</span>
        </div>
      )}
    </div>
  );
}
