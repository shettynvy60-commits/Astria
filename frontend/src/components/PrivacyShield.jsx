import React from 'react';
import { Shield, EyeOff, Lock } from 'lucide-react';

export default function PrivacyShield() {
  const redactedItems = [
    { label: 'Full Name', example: 'Alex', placeholder: '[NAME_PLACEHOLDER]', icon: '👤' },
    { label: 'Email Address', example: 'alex@email.com', placeholder: '[EMAIL_PLACEHOLDER]', icon: '📧' },
    { label: 'Phone Number', example: '(555) 321-9876', placeholder: '[PHONE_PLACEHOLDER]', icon: '📱' },
    { label: 'Physical Address', example: 'San Francisco, CA', placeholder: '[ADDRESS_PLACEHOLDER]', icon: '📍' },
    { label: 'Social Profiles', example: 'LinkedIn, GitHub', placeholder: '[LINK_PLACEHOLDER]', icon: '🔗' },
  ];

  return (
    <section id="block-privacy-shield" className="w-full bg-slate-100/70 p-5 rounded-xl border border-slate-200 my-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 bg-emerald-100 rounded-lg">
          <Shield className="w-4 h-4 text-emerald-600" />
        </div>
        <h3 className="text-base font-semibold text-slate-900">
          🛡️ Astria Data Shield — What Stays Strictly Private
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-3">
        {redactedItems.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2.5 p-2.5 bg-white rounded-lg border border-slate-200"
          >
            <span className="text-base">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700">{item.label}</p>
              <p className="text-[11px] text-slate-400 truncate">
                <span className="line-through text-slate-300">{item.example}</span>
                {' → '}
                <span className="text-rose-500 font-mono text-[10px]">🚫 Never sent to AI</span>
              </p>
            </div>
            <Lock className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <EyeOff className="w-3.5 h-3.5 text-slate-400" />
        <em>Only anonymized skill statements and target job criteria are evaluated by our AI engine.</em>
      </p>
    </section>
  );
}
