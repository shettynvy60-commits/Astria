import React, { useState } from 'react';
import RobotCharacter from './RobotCharacter';
import {
  ArrowRight,
  Check,
  CircleAlert,
  Copy,
  FileText,
  ListChecks,
  LoaderCircle,
  ScanSearch,
  ShieldCheck,
  Sparkles,
  WandSparkles,
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const tools = [
  {
    id: 'bullets', label: 'Bullet writer', category: 'Write',
    description: 'Turn a project note into focused, impact-led resume bullets.',
    endpoint: '/api/ai/bullets/generate',
    fields: [
      { name: 'raw_input', label: 'Project or experience notes', type: 'textarea', rows: 4, required: true },
      { name: 'role_or_title', label: 'Role or title', type: 'text' },
      { name: 'technologies', label: 'Technologies', type: 'list', placeholder: 'Python, FastAPI, PostgreSQL' },
      { name: 'num_bullets', label: 'Bullets', type: 'number', min: 2, max: 5 },
    ],
  },
  {
    id: 'summary', label: 'Summary writer', category: 'Write',
    description: 'Draft a professional summary, career objective, and short pitch.',
    endpoint: '/api/ai/summary/generate',
    fields: [
      { name: 'target_role', label: 'Target role', type: 'text', required: true },
      { name: 'experience_level', label: 'Experience level', type: 'select', options: ['student', 'entry-level', 'mid-level', 'experienced'] },
      { name: 'skills', label: 'Skills', type: 'list', placeholder: 'Python, FastAPI, SQL', required: true },
      { name: 'key_highlights', label: 'Highlights', type: 'textarea', rows: 3 },
    ],
  },
  {
    id: 'sections', label: 'Section planner', category: 'Write',
    description: 'Get project, skill, education, and certification ideas for your field.',
    endpoint: '/api/ai/sections/suggest',
    fields: [
      { name: 'field_or_branch', label: 'Field or discipline', type: 'text', required: true },
      { name: 'target_role', label: 'Target role', type: 'text', required: true },
    ],
  },
  {
    id: 'grammar', label: 'Grammar polish', category: 'Polish',
    description: 'Improve clarity, grammar, and professional tone.',
    endpoint: '/api/ai/grammar/fix',
    fields: [{ name: 'text', label: 'Text to polish', type: 'textarea', rows: 6, required: true }],
  },
  {
    id: 'verbs', label: 'Action verbs', category: 'Polish',
    description: 'Replace weak or passive phrasing with more specific action verbs.',
    endpoint: '/api/ai/verbs/enhance',
    fields: [{ name: 'text', label: 'Resume line', type: 'textarea', rows: 4, required: true }],
  },
  {
    id: 'ats', label: 'ATS score', category: 'Match',
    description: 'Review resume structure and keyword alignment for a target role.',
    endpoint: '/api/ai/ats/score',
    fields: [
      { name: 'resume_text', label: 'Resume text', type: 'textarea', rows: 7, required: true },
      { name: 'job_description', label: 'Job description', type: 'textarea', rows: 5 },
      { name: 'target_role', label: 'Target role', type: 'text' },
    ],
  },
  {
    id: 'job-match', label: 'Job match', category: 'Match',
    description: 'Compare your resume with a job description and get tailored suggestions.',
    endpoint: '/api/ai/job-match',
    fields: [
      { name: 'resume_text', label: 'Resume text', type: 'textarea', rows: 7, required: true },
      { name: 'job_description', label: 'Job description', type: 'textarea', rows: 5, required: true },
    ],
  },
  {
    id: 'skills', label: 'Skill gaps', category: 'Match',
    description: 'Identify priority skills to build for your target role.',
    endpoint: '/api/ai/skills/gap-analysis',
    fields: [
      { name: 'current_skills', label: 'Current skills', type: 'list', placeholder: 'Python, SQL, Git', required: true },
      { name: 'target_role', label: 'Target role', type: 'text', required: true },
      { name: 'job_description', label: 'Job description (optional)', type: 'textarea', rows: 4 },
    ],
  },
  {
    id: 'template', label: 'Template guide', category: 'Format',
    description: 'Get layout and typography guidance tailored to your field.',
    endpoint: '/api/ai/design/recommend-template',
    fields: [
      { name: 'branch_or_domain', label: 'Field or discipline', type: 'text', required: true },
      { name: 'target_role', label: 'Target role', type: 'text', required: true },
      { name: 'years_of_experience', label: 'Years of experience', type: 'number', min: 0, max: 60 },
    ],
  },
  {
    id: 'length', label: 'Length check', category: 'Format',
    description: 'Estimate resume length and get trimming and layout advice.',
    endpoint: '/api/ai/length/optimize',
    fields: [
      { name: 'resume_text', label: 'Resume text', type: 'textarea', rows: 8, required: true },
      { name: 'target_pages', label: 'Target pages', type: 'number', min: 1, max: 5 },
    ],
  },
];

function initialValues(tool, targetRole, resumeText, jobDescription) {
  const values = {};
  for (const field of tool.fields) values[field.name] = '';
  if ('target_role' in values) values.target_role = targetRole;
  if ('role_or_title' in values) values.role_or_title = targetRole;
  if ('resume_text' in values) values.resume_text = resumeText;
  if ('job_description' in values) values.job_description = jobDescription;
  if ('num_bullets' in values) values.num_bullets = '3';
  if ('target_pages' in values) values.target_pages = '1';
  if ('years_of_experience' in values) values.years_of_experience = '0';
  if ('experience_level' in values) values.experience_level = 'student';
  if ('field_or_branch' in values) values.field_or_branch = 'Computer Science';
  if ('branch_or_domain' in values) values.branch_or_domain = 'Computer Science';
  return values;
}

function titleCase(value) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function ResultValue({ value }) {
  if (Array.isArray(value)) {
    if (value.length === 0) return <p className="text-sm text-slate-500">None returned</p>;
    if (typeof value[0] === 'object' && value[0] !== null) {
      return <div className="space-y-3">{value.map((item, index) => (
        <div key={index} className="border-l-2 border-cyan-500/50 pl-3"><ResultValue value={item} /></div>
      ))}</div>;
    }
    return <ul className="space-y-2">{value.map((item, index) => (
      <li key={index} className="flex gap-2 text-sm text-slate-200"><span className="text-cyan-400">-</span><span>{String(item)}</span></li>
    ))}</ul>;
  }
  if (value && typeof value === 'object') {
    return <dl className="grid gap-3 sm:grid-cols-2">{Object.entries(value).map(([key, nested]) => (
      <div key={key} className="min-w-0">
        <dt className="mb-1 text-[11px] font-semibold uppercase text-slate-500">{titleCase(key)}</dt>
        <dd><ResultValue value={nested} /></dd>
      </div>
    ))}</dl>;
  }
  return <p className="whitespace-pre-wrap text-sm leading-6 text-slate-200">{String(value ?? '')}</p>;
}

async function scrubUserValue(value) {
  if (Array.isArray(value)) return Promise.all(value.map(scrubUserValue));
  if (typeof value !== 'string' || !value.trim()) return value;

  const response = await fetch(`${API_BASE}/api/pii/scrub`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: value, mode: 'pseudonymize' }),
  });
  if (!response.ok) throw new Error('Local privacy scan failed. The text was not sent to the AI tool.');
  const scrubbed = await response.json();
  return scrubbed.sanitized_text;
}

export default function AIResumeAssistant({ targetRole, resumeText, jobDescription, onGuideChange = () => {}, onRobotFly = () => {}, isRobotFlying = false }) {
  const [activeToolId, setActiveToolId] = useState('bullets');
  const [values, setValues] = useState(() => initialValues(tools[0], targetRole, resumeText, jobDescription));
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const activeTool = tools.find((tool) => tool.id === activeToolId) || tools[0];
  const categories = [...new Set(tools.map((tool) => tool.category))];

  const selectTool = (tool, optionElement) => {
    const currentMarker = document.querySelector('.robot-option-marker');
    const sourceRect = currentMarker?.getBoundingClientRect();
    const targetRect = optionElement?.getBoundingClientRect();
    setActiveToolId(tool.id);
    setValues(initialValues(tool, targetRole, resumeText, jobDescription));
    setResult(null);
    setError('');
    onGuideChange(`${tool.label} selected. ${tool.description}`);
    if (tool.id !== activeToolId && sourceRect && targetRect) onRobotFly(sourceRect, targetRect);
  };

  const makePayload = () => {
    const payload = { ...values };
    for (const field of activeTool.fields) {
      if (field.type === 'list') {
        payload[field.name] = payload[field.name].split(',').map((item) => item.trim()).filter(Boolean);
      } else if (field.type === 'number') {
        payload[field.name] = Number(payload[field.name]);
      }
    }
    return payload;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    onGuideChange(`Working on ${activeTool.label.toLowerCase()}. I’ll let you know when your result is ready.`);
    try {
      const payload = makePayload();
      for (const [key, value] of Object.entries(payload)) {
        payload[key] = await scrubUserValue(value);
      }
      const response = await fetch(`${API_BASE}${activeTool.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || `Request failed (${response.status})`);
      setResult(data);
      onGuideChange(data.source === 'gemini'
        ? 'Your result is ready. Review the suggestions and keep only what matches your experience.'
        : 'Your offline result is ready. Review it carefully and keep only details that are accurate.');
    } catch (requestError) {
      setError(requestError.message || 'Could not reach the AI service. Check the backend connection and try again.');
      onGuideChange('That request did not complete. Check the error in the result panel, then retry.');
    } finally {
      setLoading(false);
    }
  };

  const copyResult = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <section className="animate-fadeIn space-y-6">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase text-cyan-300"><WandSparkles className="h-4 w-4" /> AI Resume Assistant</div>
          <h1 className="text-2xl font-bold text-slate-100">Resume tools</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-400">Write, polish, and tailor resume content with Astria's AI services.</p>
        </div>
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-medium text-cyan-300 hover:text-cyan-200">
          API reference <ArrowRight className="h-3.5 w-3.5" />
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="space-y-5">
          {categories.map((category) => <div key={category}>
            <h2 className="mb-2 px-2 text-[11px] font-semibold uppercase text-slate-500">{category}</h2>
            <div className="space-y-1">{tools.filter((tool) => tool.category === category).map((tool) => (
              <button key={tool.id} type="button" disabled={isRobotFlying} onClick={(event) => selectTool(tool, event.currentTarget)} className={`flex min-h-[46px] w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-wait ${activeTool.id === tool.id ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-100' : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/70 hover:text-slate-100'}`}>
                <span className="min-w-0 flex-1">{tool.label}</span>
                {activeTool.id === tool.id && !isRobotFlying && (
                  <span key={tool.id} className="robot-option-marker" aria-hidden="true">
                    <RobotCharacter className="robot-guide--option robot-guide--wave" />
                  </span>
                )}
              </button>
            ))}</div>
          </div>)}
        </aside>

        <div className="grid min-w-0 gap-5 xl:grid-cols-2">
          <form onSubmit={handleSubmit} className="glass-panel rounded-xl p-5 sm:p-6">
            <div className="mb-5">
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-300"><Sparkles className="h-4 w-4" /> {activeTool.endpoint}</div>
              <h2 className="mt-2 text-lg font-semibold text-slate-100">{activeTool.label}</h2>
              <p className="mt-1 text-sm text-slate-400">{activeTool.description}</p>
            </div>
            <div className="space-y-4">
              {activeTool.fields.map((field) => <label key={field.name} className="block space-y-1.5">
                <span className="text-xs font-medium text-slate-300">{field.label}{field.required ? ' *' : ''}</span>
                {field.type === 'textarea' ? (
                  <textarea required={field.required} rows={field.rows} value={values[field.name]} onFocus={() => onGuideChange(`Add accurate details for ${field.label.toLowerCase()}. I can help with wording, but keep the facts yours.`)} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="glass-input w-full resize-y rounded-lg px-3 py-2.5 text-sm" />
                ) : field.type === 'select' ? (
                  <select value={values[field.name]} onFocus={() => onGuideChange(`Choose the option that best describes your current experience.`)} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="glass-input w-full rounded-lg px-3 py-2.5 text-sm">
                    {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                ) : (
                  <input required={field.required} type={field.type === 'number' ? 'number' : 'text'} min={field.min} max={field.max} placeholder={field.placeholder} value={values[field.name]} onFocus={() => onGuideChange(`Add accurate details for ${field.label.toLowerCase()}.`)} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="glass-input w-full rounded-lg px-3 py-2.5 text-sm" />
                )}
              </label>)}
            </div>
            <div className="mt-5 flex flex-col gap-3 border-t border-slate-800 pt-4">
              <p className="flex items-start gap-2 text-xs leading-5 text-emerald-300"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" /> Free-text inputs are scrubbed locally before the AI request.</p>
              <button type="submit" disabled={loading} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-cyan-700 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-wait disabled:opacity-60">
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ScanSearch className="h-4 w-4" />}
                {loading ? 'Working...' : 'Run tool'}
              </button>
            </div>
          </form>

          <section aria-live="polite" className="glass-panel min-h-72 rounded-xl p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-amber-300" /><h2 className="text-sm font-semibold text-slate-100">Result</h2></div>
              {result && <button type="button" onClick={copyResult} className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white" title="Copy result JSON">
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}{copied ? 'Copied' : 'Copy JSON'}
              </button>}
            </div>
            {error ? (
              <div className="flex gap-2 rounded-lg border border-rose-500/30 bg-rose-950/30 p-3 text-sm text-rose-200"><CircleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {error}</div>
            ) : result ? (
              <div className="space-y-4">
                {result.source && <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium ${result.source === 'gemini' ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-200' : 'border-amber-500/30 bg-amber-950/30 text-amber-200'}`}>
                  {result.source === 'gemini' ? 'Gemini' : 'Offline mock'}
                </span>}
                <ResultValue value={Object.fromEntries(Object.entries(result).filter(([key]) => key !== 'source'))} />
              </div>
            ) : (
              <div className="flex min-h-52 flex-col items-center justify-center text-center">
                <ListChecks className="mb-3 h-8 w-8 text-slate-600" />
                <p className="text-sm font-medium text-slate-300">Your result will appear here</p>
                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">Choose a tool, provide the details, and run it to see the generated output.</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}