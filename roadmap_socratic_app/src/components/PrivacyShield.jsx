import React from 'react';
import { Shield, EyeOff, Lock } from 'lucide-react';

export default function PrivacyShield({ user = {}, resumeText = '' }) {
  // Derive what to show in each card — real values or placeholder
  const nameDisplay = user.fullName?.trim() || null;
  const emailDisplay = user.email?.trim() || null;
  const phoneDisplay = user.phone?.trim() || null;

  // Detect address/social from resume text (simple heuristic)
  const hasAddress = resumeText && /(\b\d{1,5}\b.{0,20}(street|st|avenue|ave|road|rd|blvd|drive|dr|lane|ln|way)\b|\b[A-Z][a-z]+,\s*[A-Z]{2}\b)/i.test(resumeText);
  const hasSocial = resumeText && /(linkedin\.com|github\.com|twitter\.com|x\.com)/i.test(resumeText);

  const redactedItems = [
    {
      label: 'Full Name',
      value: nameDisplay,
      placeholder: '[NAME_PLACEHOLDER]',
      icon: '👤',
    },
    {
      label: 'Email Address',
      value: emailDisplay,
      placeholder: '[EMAIL_PLACEHOLDER]',
      icon: '📧',
    },
    {
      label: 'Phone Number',
      value: phoneDisplay,
      placeholder: '[PHONE_PLACEHOLDER]',
      icon: '📱',
    },
    {
      label: 'Physical Address',
      value: hasAddress ? 'Detected in resume' : null,
      placeholder: '[ADDRESS_PLACEHOLDER]',
      icon: '📍',
    },
    {
      label: 'Social Profiles',
      value: hasSocial ? 'LinkedIn / GitHub detected' : null,
      placeholder: '[LINK_PLACEHOLDER]',
      icon: '🔗',
    },
  ];

  return (
    <section
      id="block-privacy-shield"
      className="w-full bg-slate-100/70 dark:bg-slate-900/80 p-5 rounded-xl border border-slate-200 dark:border-slate-800 my-6"
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 rounded-lg">
          <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-200">
          🛡️ Astria Data Shield — What Stays Strictly Private
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
        {redactedItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2.5 p-2.5 bg-white dark:bg-slate-950 rounded-lg border border-slate-200 dark:border-slate-800"
          >
            <span className="text-base">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-200">{item.label}</p>
              <p className="text-[11px] text-slate-400 dark:text-slate-400 truncate">
                {item.value ? (
                  <>
                    <span className="line-through text-slate-300 dark:text-slate-600">{item.value}</span>
                    {' → '}
                    <span className="text-rose-500 font-mono text-[10px]">🚫 Never sent to AI</span>
                  </>
                ) : (
                  <span className="text-slate-400 dark:text-slate-500 italic">Not provided</span>
                )}
              </p>
            </div>
            <Lock className="w-3.5 h-3.5 text-slate-300 dark:text-slate-600 shrink-0" />
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
        <EyeOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
        <em>Only anonymized skill statements and target job criteria are evaluated by our AI engine.</em>
      </p>
    </section>
  );
}
