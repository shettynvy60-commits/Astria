import React, { useState, useMemo } from 'react';
import { 
  Target, 
  Sparkles, 
  Briefcase, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Layers, 
  RefreshCw,
  Cpu,
  Cloud,
  Code2,
  Database,
  Terminal,
  Compass
} from 'lucide-react';

const PRESET_ROLES = [
  {
    id: 'backend',
    title: 'Senior Backend Engineer',
    icon: Terminal,
    color: 'from-brand-600 to-indigo-600',
    border: 'border-brand-500/40',
    accentText: 'text-brand-400',
    glow: 'glow-brand',
    description: 'High-throughput async APIs, distributed event streaming, and relational query tuning.',
    skills: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Kubernetes', 'Apache Kafka', 'Redis'],
    jd: `We are looking for a Senior Backend Engineer to join our distributed infrastructure team.

Key Responsibilities:
- Architect and maintain high-performance asynchronous microservices with Python and FastAPI.
- Design resilient relational schemas, execute database migrations, and optimize queries in PostgreSQL.
- Containerize services with Docker and orchestrate workloads across Kubernetes clusters.
- Implement scalable event-driven messaging pipelines utilizing Apache Kafka.
- Optimize API latency and cache invalidation strategies using Redis.

Requirements:
- 4+ years of backend production engineering experience with Python and modern async frameworks (FastAPI/Django/Flask).
- Hands-on experience with PostgreSQL schema design, indexing strategies, and connection pooling.
- Proven familiarity with containerization (Docker) and cloud-native orchestration (Kubernetes).
- Experience with event streaming or message brokers (Kafka or RabbitMQ).
- Preferred: Redis in-memory caching, GraphQL, and AWS cloud services.`
  },
  {
    id: 'fullstack',
    title: 'Full Stack Architect',
    icon: Code2,
    color: 'from-cyan-600 to-blue-600',
    border: 'border-cyan-500/40',
    accentText: 'text-cyan-400',
    glow: 'glow-cyan',
    description: 'Modern reactive component architectures, type-safe full stack systems, and scalable APIs.',
    skills: ['React', 'TypeScript', 'Tailwind CSS', 'Node.js', 'PostgreSQL', 'Next.js', 'Docker'],
    jd: `Seeking a Full Stack Engineer to lead user-facing web applications and core platform services.

Responsibilities:
- Build state-of-the-art web applications using React, modern TypeScript, and Tailwind CSS.
- Develop and integrate robust REST and GraphQL APIs with Node.js and PostgreSQL.
- Deploy and monitor production web services with Docker and continuous integration pipelines.
- Ensure end-to-end performance, accessibility, and intuitive user experiences.

Requirements:
- Strong production proficiency in modern React (hooks, context, performance optimization) and TypeScript.
- Fluent with utility-first responsive design using Tailwind CSS.
- Solid server-side programming experience with Node.js or Express.
- Relational database experience with PostgreSQL or MySQL.
- Nice to have: Next.js SSR, GraphQL schema design, and Docker containerization.`
  },
  {
    id: 'devops',
    title: 'Cloud & DevOps Platform Engineer',
    icon: Cloud,
    color: 'from-emerald-600 to-teal-600',
    border: 'border-emerald-500/40',
    accentText: 'text-emerald-400',
    glow: 'glow-emerald',
    description: 'Infrastructure as code, Kubernetes mesh networks, and automated CI/CD deployment pipelines.',
    skills: ['Kubernetes', 'Docker', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Prometheus'],
    jd: `We are seeking a Cloud & DevOps Platform Engineer to elevate our cloud infrastructure reliability and velocity.

Responsibilities:
- Manage multi-region Kubernetes clusters and streamline microservice container deployments.
- Author Infrastructure-as-Code modules using Terraform across AWS environments.
- Maintain automated CI/CD pipelines ensuring zero-downtime blue/green rollouts.
- Establish observability dashboards with Prometheus, Grafana, and distributed tracing.

Requirements:
- Strong hands-on experience orchestrating production workloads on Kubernetes and Docker.
- Proven track record with AWS cloud infrastructure (EKS, VPC, IAM, RDS, S3).
- Proficiency writing declarative Terraform configurations.
- Linux systems administration and shell automation scripting.
- Bonus: Service mesh (Istio), ArgoCD GitOps, and Python/Go tooling.`
  },
  {
    id: 'ai_ml',
    title: 'AI / LLM Systems Engineer',
    icon: Cpu,
    color: 'from-purple-600 to-pink-600',
    border: 'border-purple-500/40',
    accentText: 'text-purple-400',
    glow: 'glow-brand',
    description: 'RAG pipelines, vector embedding databases, LLM orchestration, and production inference.',
    skills: ['Python', 'PyTorch', 'FastAPI', 'LangChain', 'Vector DBs', 'Docker', 'OpenAI API'],
    jd: `Seeking an AI / LLM Systems Engineer to engineer production-grade generative AI workflows.

Responsibilities:
- Build low-latency RAG (Retrieval-Augmented Generation) pipelines and hybrid vector search systems.
- Fine-tune, evaluate, and deploy open-weight and proprietary language models.
- Serve AI inference endpoints with FastAPI, Docker, and asynchronous worker queues.
- Implement robust hallucination detection, prompt evaluation frameworks, and token caching.

Requirements:
- Deep fluency in Python and deep learning frameworks (PyTorch or TensorFlow).
- Hands-on experience integrating LLM APIs (Gemini, OpenAI, Anthropic) or local models via Ollama/vLLM.
- Practical knowledge of Vector Databases (Qdrant, Pinecone, Chroma, or Milvus).
- Production API deployment using FastAPI and Docker.
- Bonus: Agentic workflows (LangGraph/CrewAI) and synthetic data generation.`
  }
];

// Common tech keywords to extract dynamically from JD text
const KNOWN_KEYWORDS = [
  'python', 'fastapi', 'postgresql', 'postgres', 'docker', 'kubernetes', 'k8s',
  'kafka', 'apache kafka', 'redis', 'react', 'typescript', 'javascript',
  'tailwind', 'tailwind css', 'node.js', 'nodejs', 'next.js', 'nextjs',
  'aws', 'terraform', 'ci/cd', 'linux', 'prometheus', 'grafana', 'mysql',
  'sqlite', 'graphql', 'rest', 'git', 'pytorch', 'tensorflow', 'langchain',
  'vector dbs', 'mongodb', 'elasticsearch', 'django', 'flask', 'go', 'golang',
  'rust', 'java', 'spring', 'c++', 'c#', '.net', 'rabbitmq'
];

export default function TargetRoleConfigurator({
  targetRole,
  setTargetRole,
  jobDescription,
  setJobDescription,
  onApplyRole,
  onNavigateToMatrix
}) {
  const [selectedPreset, setSelectedPreset] = useState('backend');
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Dynamic Keyword Extraction from current JD
  const extractedKeywords = useMemo(() => {
    if (!jobDescription) return [];
    const textLower = jobDescription.toLowerCase();
    const found = [];
    for (const kw of KNOWN_KEYWORDS) {
      try {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match word boundaries or non-word characters for terms like c++ or .net
        const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
        if (regex.test(textLower)) {
          // Normalize display name
          const displayName = kw === 'k8s' ? 'Kubernetes' 
            : kw === 'postgres' ? 'PostgreSQL' 
            : kw === 'c++' ? 'C++'
            : kw === 'c#' ? 'C#'
            : kw === '.net' ? '.NET'
            : kw.charAt(0).toUpperCase() + kw.slice(1);
          if (!found.includes(displayName)) {
            found.push(displayName);
          }
        }
      } catch (err) {
        // Fallback to simple includes
        if (textLower.includes(kw.toLowerCase())) {
          found.push(kw.toUpperCase());
        }
      }
    }
    return found;
  }, [jobDescription]);

  const handleSelectPreset = (preset) => {
    setSelectedPreset(preset.id);
    setTargetRole(preset.title);
    setJobDescription(preset.jd);
  };

  const handleSaveAndSync = () => {
    if (onApplyRole) onApplyRole();
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero Banner */}
      <div className="glass-panel-elevated p-8 rounded-3xl relative overflow-hidden">
        {/* Glow orb */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/40 text-brand-300 text-xs font-semibold tracking-wide">
              <Compass className="w-3.5 h-3.5 text-brand-400" />
              <span>Target Role Configurator</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Configure Your <span className="text-gradient-brand">Target Job Role</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Define the exact job title and requirements you want to conquer. Astria’s deterministic match engine extracts the technical requirements directly from this spec to calculate your gap score with zero LLM guesswork.
            </p>
          </div>

          {/* Quick Stat Pill Box */}
          <div className="flex flex-wrap sm:flex-nowrap gap-3 shrink-0">
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 text-center min-w-[120px]">
              <span className="block text-2xl font-black text-brand-400 font-mono">
                {extractedKeywords.length}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                Extracted Skills
              </span>
            </div>
            <div className="p-4 rounded-2xl glass-panel border border-slate-800 text-center min-w-[120px]">
              <span className="block text-2xl font-black text-cyan-400 font-mono">
                {jobDescription ? jobDescription.trim().split(/\s+/).length : 0}
              </span>
              <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                JD Words
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Role Picker Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-brand-400" />
            <span>Select an Industry Standard Preset or Build Custom</span>
          </h3>
          <span className="text-xs text-slate-400">Click any role to load standard qualifications</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PRESET_ROLES.map((preset) => {
            const Icon = preset.icon;
            const isSelected = selectedPreset === preset.id && targetRole === preset.title;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`group cursor-pointer p-5 rounded-2xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between ${
                  isSelected 
                    ? `glass-panel-elevated border-2 ${preset.border} shadow-lg ${preset.glow} bg-slate-900/90`
                    : 'glass-panel-interactive border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-2.5 right-2.5">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-brand-500"></span>
                    </span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${preset.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100 group-hover:text-white transition-colors">
                      {preset.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                      {preset.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap gap-1">
                  {preset.skills.slice(0, 4).map((sk, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-300 font-mono border border-slate-800"
                    >
                      {sk}
                    </span>
                  ))}
                  {preset.skills.length > 4 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950/80 text-slate-500 font-mono">
                      +{preset.skills.length - 4}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Editor & Live Extractor Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="glass-panel p-6 rounded-2xl space-y-5">
            {/* Target Job Title Input */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span>Target Job Title</span>
                <span className="text-[11px] text-brand-400 font-normal lowercase">used as role anchor</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => {
                    setTargetRole(e.target.value);
                    setSelectedPreset(null);
                  }}
                  placeholder="e.g. Senior Backend Engineer"
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm font-medium focus:ring-2 focus:ring-brand-500/30"
                />
                <Target className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
            </div>

            {/* Target Job Description Text Area */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Target Job Description (Requirements & Tech Stack)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setJobDescription('')}
                  className="text-[11px] text-slate-400 hover:text-rose-400 transition-colors"
                >
                  Clear Text
                </button>
              </div>

              <textarea
                rows={12}
                value={jobDescription}
                onChange={(e) => {
                  setJobDescription(e.target.value);
                  setSelectedPreset(null);
                }}
                placeholder="Paste the target job description or requirements here..."
                className="w-full p-4 rounded-xl glass-input text-xs font-mono text-slate-200 leading-relaxed resize-y focus:ring-2 focus:ring-brand-500/30"
              />
            </div>

            {/* Actions Bar */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Synchronizes across Self-Assessment and Gap Analysis</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSaveAndSync}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white shadow-lg glow-brand transition-all flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{copiedNotification ? '✓ Config Saved!' : 'Save & Sync Role'}</span>
                </button>

                {onNavigateToMatrix && (
                  <button
                    type="button"
                    onClick={onNavigateToMatrix}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-all flex items-center gap-1.5"
                  >
                    <span>Assess Skills</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Requirement Extractor (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <div className="glass-panel p-6 rounded-2xl space-y-5 flex flex-col justify-between h-full">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-cyan-400">
                    <Zap className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">Live Requirement Extractor</h4>
                    <p className="text-[11px] text-slate-400">Parsed dynamically from JD content</p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
                  {extractedKeywords.length} Detected
                </span>
              </div>

              {/* Seniority Assessment */}
              <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Role Seniority:</span>
                  <span className="font-bold text-indigo-400">
                    {targetRole.toLowerCase().includes('senior') || targetRole.toLowerCase().includes('lead')
                      ? 'Senior / Staff Tier'
                      : 'Mid / Core Tier'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Scoring Weight Formula:</span>
                  <span className="font-mono text-brand-300 text-[11px]">
                    (Matched + 0.5×Partial) / Total
                  </span>
                </div>
              </div>

              {/* Extracted Requirement Badges */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Identified Target Tech Stack:
                </span>

                {extractedKeywords.length > 0 ? (
                  <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
                    {extractedKeywords.map((kw, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/90 text-slate-200 border border-slate-700/80 shadow-sm hover:border-brand-500/40 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No recognized keywords identified yet. Paste a complete job description on the left to extract requirements.
                  </div>
                )}
              </div>
            </div>

            {/* Matrix Quick Link Footer */}
            <div className="pt-4 border-t border-slate-800/80">
              <div className="p-4 rounded-xl bg-gradient-to-r from-brand-950/40 via-indigo-950/30 to-slate-950 border border-brand-500/30 flex items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <p className="text-xs font-semibold text-slate-200">
                    Ready to rate your confidence?
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Check which of these {extractedKeywords.length} tools you know.
                  </p>
                </div>
                {onNavigateToMatrix && (
                  <button
                    type="button"
                    onClick={onNavigateToMatrix}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shrink-0 flex items-center gap-1 shadow"
                  >
                    <span>Matrix</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
