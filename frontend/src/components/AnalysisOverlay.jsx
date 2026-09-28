import React, { useEffect, useState } from 'react';
import { ShieldCheck, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

const STEPS = [
  { id: 1, label: 'Vaulting personal identifiers (PII Shield active)...' },
  { id: 2, label: 'Extracting technical competencies & core strengths...' },
  { id: 3, label: 'Analyzing target role requirements & semantic weights...' },
  { id: 4, label: 'Computing match formula & categorizing skill gaps...' },
];

export default function AnalysisOverlay({ isOpen, stepIndex = 0 }) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setActiveStep(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < STEPS.length - 1 ? prev + 1 : prev));
    }, 700);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const currentStep = Math.max(activeStep, stepIndex);
  const progressPercent = Math.min(100, Math.round(((currentStep + 1) / STEPS.length) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full mx-4 p-8 text-center">
        {/* Animated Icon */}
        <div className="w-16 h-16 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center mx-auto mb-5">
          <Loader2 className="w-8 h-8 text-sky-600 animate-spin" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Analyzing Skill Match & Vaulting Personal Data...
        </h3>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          Astria is evaluating your profile against the target job requirements while keeping your private data safe.
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-2 mb-6 overflow-hidden">
          <div
            className="bg-zinc-900 h-2 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Step Breakdown */}
        <div className="space-y-3 text-left">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStep;
            const isCurrent = idx === currentStep;
            return (
              <div
                key={step.id}
                className={`flex items-center gap-3 text-xs sm:text-sm transition-colors ${
                  isDone
                    ? 'text-emerald-700 font-medium'
                    : isCurrent
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-400'
                }`}
              >
                {isDone ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : isCurrent ? (
                  <div className="w-4 h-4 rounded-full border-2 border-sky-500 border-t-transparent animate-spin shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                )}
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        {/* Footer reassurance */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Zero-trust privacy: PII remains local and unexposed</span>
        </div>
      </div>
    </div>
  );
}
