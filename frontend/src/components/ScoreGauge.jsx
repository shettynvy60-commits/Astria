import React from 'react';
import { Award, Calculator, Info, ShieldCheck } from 'lucide-react';

export default function ScoreGauge({ score = 0, audit = null }) {
  const normalizedScore = Math.min(100, Math.max(0, Number(score) || 0));

  // Determine color theme based on score thresholds
  const getColorScheme = (val) => {
    if (val >= 75) {
      return {
        text: 'text-emerald-400',
        stroke: '#10B981',
        bgGlow: 'rgba(16, 185, 129, 0.15)',
        badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
        label: 'Strong Match'
      };
    } else if (val >= 50) {
      return {
        text: 'text-amber-400',
        stroke: '#F59E0B',
        bgGlow: 'rgba(245, 158, 11, 0.15)',
        badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
        label: 'Moderate Gap'
      };
    } else {
      return {
        text: 'text-rose-400',
        stroke: '#EF4444',
        bgGlow: 'rgba(239, 68, 68, 0.15)',
        badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
        label: 'High Skill Gap'
      };
    }
  };

  const scheme = getColorScheme(normalizedScore);

  // SVG Circular parameters
  const radius = 72;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="glass-panel p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
      {/* Glow backdrop */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none transition-all duration-700"
        style={{ backgroundColor: scheme.bgGlow }}
      />

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-400" />
            ATS Qualification Score
          </h3>
          <p className="text-xs text-slate-400">Strictly calculated via deterministic formula</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${scheme.badge}`}>
          {scheme.label}
        </span>
      </div>

      {/* Radial Gauge Centerpiece */}
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6 my-2">
        <div className="relative flex items-center justify-center">
          <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 180 180">
            {/* Background Track */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-800/80"
              fill="transparent"
            />
            {/* Animated Progress Arc */}
            <circle
              cx="90"
              cy="90"
              r={radius}
              stroke={scheme.stroke}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              style={{
                transition: 'stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
              }}
            />
          </svg>

          {/* Centered Score Number */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-extrabold tracking-tight ${scheme.text}`}>
              {normalizedScore.toFixed(1)}%
            </span>
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mt-0.5">
              Match Fit
            </span>
          </div>
        </div>

        {/* Breakdown Statistics */}
        {audit && (
          <div className="flex-1 w-full space-y-2.5">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Matched Skills (1.0x)
              </span>
              <span className="font-bold text-slate-200">{audit.matched_count}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" /> Partial / Transferable (0.5x)
              </span>
              <span className="font-bold text-slate-200">{audit.partial_count}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Missing Requirements (0.0x)
              </span>
              <span className="font-bold text-slate-200">{audit.missing_count}</span>
            </div>
          </div>
        )}
      </div>

      {/* Formula Audit Line */}
      {audit && (
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="flex items-center gap-1 text-slate-300 font-medium">
              <Calculator className="w-3.5 h-3.5 text-brand-400" /> Mathematical Expression:
            </span>
            <span className="font-mono text-brand-300 bg-brand-950/80 px-2 py-0.5 rounded border border-brand-500/20">
              (M + 0.5P) / Total
            </span>
          </div>
          <p className="font-mono text-xs text-slate-300 bg-slate-950/90 p-2.5 rounded-lg border border-slate-800/90 text-center">
            {audit.audit_expression || `(${audit.matched_count} + 0.5 * ${audit.partial_count}) / ${audit.total_required} = ${normalizedScore}%`}
          </p>
        </div>
      )}
    </div>
  );
}
