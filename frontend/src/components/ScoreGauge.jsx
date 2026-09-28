import React from 'react';
import { Award, Calculator, Info } from 'lucide-react';

export default function ScoreGauge({ score = 0, audit = null }) {
  const normalizedScore = Math.min(100, Math.max(0, Number(score) || 0));

  const getColorScheme = (val) => {
    if (val >= 75) {
      return {
        text: 'text-emerald-700',
        stroke: '#10B981',
        badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        label: 'Strong Match'
      };
    } else if (val >= 50) {
      return {
        text: 'text-amber-700',
        stroke: '#F59E0B',
        badge: 'bg-amber-50 text-amber-800 border-amber-200',
        label: 'Moderate Gap'
      };
    } else {
      return {
        text: 'text-rose-700',
        stroke: '#F43F5E',
        badge: 'bg-rose-50 text-rose-800 border-rose-200',
        label: 'High Skill Gap'
      };
    }
  };

  const scheme = getColorScheme(normalizedScore);

  const radius = 68;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-600" />
            Deterministic Match Score
          </h3>
          <p className="text-xs text-slate-500">Calculated via mathematical fit formula</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${scheme.badge}`}>
          {scheme.label}
        </span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-4">
        {/* SVG Circular Progress Gauge */}
        <div className="relative flex items-center justify-center">
          <svg className="w-40 h-40 transform -rotate-90">
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100"
              fill="transparent"
            />
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke={scheme.stroke}
              strokeWidth={strokeWidth}
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`text-4xl font-extrabold tracking-tight ${scheme.text}`}>
              {normalizedScore}%
            </span>
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Calculated Fit
            </span>
          </div>
        </div>

        {/* Audit Line-Item Breakdown */}
        {audit ? (
          <div className="space-y-2 text-xs text-slate-600 w-full max-w-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Mastered (1.0x)
              </span>
              <span className="font-mono font-bold text-slate-800">{audit.matched_count}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Partial (0.5x)
              </span>
              <span className="font-mono font-bold text-slate-800">{audit.partial_count}</span>
            </div>

            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Missing (0.0x)
              </span>
              <span className="font-mono font-bold text-slate-800">{audit.missing_count}</span>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-400 italic text-center sm:text-left">
            Upload resume and job description to calculate score.
          </div>
        )}
      </div>

      {audit?.formula && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500">
          <Calculator className="w-3.5 h-3.5 text-slate-400" />
          <span>Formula: <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">{audit.formula}</code></span>
        </div>
      )}
    </div>
  );
}
