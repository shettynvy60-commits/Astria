import React from 'react';

const ROLE_PRESETS = [
  { id: 'swe', label: 'Software Engineering', icon: '💻' },
  { id: 'sound', label: 'Sound Engineering', icon: '🎧' },
  { id: 'data', label: 'Data Engineering', icon: '📊' },
  { id: 'pm', label: 'Product Management', icon: '📋' },
];

/**
 * QuickRolePresets — visual highlight bar only.
 * Clicking a preset toggles its active/inactive state.
 * It does NOT auto-populate any input fields.
 * The parent receives (presetId) via onSelect.
 */
export default function QuickRolePresets({ activePreset, onSelect }) {
  return (
    <nav aria-label="Role Preset Selection" className="w-full py-4 border-y border-slate-200 dark:border-slate-800 my-6">
      <div className="flex flex-row items-center gap-3 overflow-x-auto scrollbar-none">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Target Role Preset:</span>
        {ROLE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => onSelect(preset.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
              activePreset === preset.id
                ? 'bg-zinc-900 dark:bg-slate-200 text-white dark:text-slate-900 shadow-sm'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <span>{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
      {activePreset && (
        <p className="text-[11px] text-slate-500 dark:text-slate-500 mt-2 pl-1">
          ✓ <strong>{ROLE_PRESETS.find(p => p.id === activePreset)?.label}</strong> selected — paste your specific job description in Block 3 to run the analysis.
        </p>
      )}
    </nav>
  );
}

export { ROLE_PRESETS };
