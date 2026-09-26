import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Check, 
  Plus, 
  Trash2, 
  Award, 
  Calculator, 
  Layers, 
  Search, 
  ArrowRight, 
  Filter, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Cpu,
  Flame
} from 'lucide-react';

// Default initial skill catalog with categories
const INITIAL_SKILLS = [
  // Languages
  { id: 'python', name: 'Python', category: 'Languages', confidence: 'Expert', evidence: 'Primary language for 4+ years' },
  { id: 'javascript', name: 'JavaScript', category: 'Languages', confidence: 'Intermediate', evidence: 'ES6+, Async/Await' },
  { id: 'typescript', name: 'TypeScript', category: 'Languages', confidence: 'Beginner', evidence: 'Working on side projects' },
  { id: 'sql', name: 'SQL', category: 'Languages', confidence: 'Expert', evidence: 'Complex joins, indexing & CTEs' },
  { id: 'go', name: 'Go', category: 'Languages', confidence: 'None', evidence: '' },

  // Backend
  { id: 'fastapi', name: 'FastAPI', category: 'Backend & APIs', confidence: 'Expert', evidence: '12+ async microservices in prod' },
  { id: 'django', name: 'Django', category: 'Backend & APIs', confidence: 'Intermediate', evidence: 'REST framework experience' },
  { id: 'flask', name: 'Flask', category: 'Backend & APIs', confidence: 'Intermediate', evidence: 'Internal tooling & webhooks' },
  { id: 'graphql', name: 'GraphQL', category: 'Backend & APIs', confidence: 'None', evidence: '' },

  // Databases & Storage
  { id: 'postgresql', name: 'PostgreSQL', category: 'Databases & Storage', confidence: 'Beginner', evidence: 'Basic queries, learning schema tuning' },
  { id: 'mysql', name: 'MySQL', category: 'Databases & Storage', confidence: 'Expert', evidence: 'Table sharding, query execution plans' },
  { id: 'redis', name: 'Redis', category: 'Databases & Storage', confidence: 'Intermediate', evidence: 'Caching & pub/sub channels' },

  // DevOps & Cloud
  { id: 'docker', name: 'Docker', category: 'DevOps & Cloud', confidence: 'Intermediate', evidence: 'Multi-stage container builds' },
  { id: 'kubernetes', name: 'Kubernetes', category: 'DevOps & Cloud', confidence: 'Beginner', evidence: 'Pod manifests & kubectl basics' },
  { id: 'kafka', name: 'Apache Kafka', category: 'DevOps & Cloud', confidence: 'None', evidence: '' },
  { id: 'aws', name: 'AWS', category: 'DevOps & Cloud', confidence: 'Beginner', evidence: 'S3, EC2, IAM basics' },

  // Frontend & UI
  { id: 'react', name: 'React', category: 'Frontend & UI', confidence: 'Intermediate', evidence: 'Hooks, component lifecycles' },
  { id: 'tailwind', name: 'Tailwind CSS', category: 'Frontend & UI', confidence: 'Intermediate', evidence: 'Responsive utility layouts' },
];

const CATEGORIES = [
  'All',
  'Required by Role',
  'Languages',
  'Backend & APIs',
  'Databases & Storage',
  'DevOps & Cloud',
  'Frontend & UI'
];

// Adjacency graph for transferable skill detection
const TRANSFERABLE_MAP = {
  'postgresql': ['mysql', 'sqlite', 'sql'],
  'mysql': ['postgresql', 'sqlite', 'sql'],
  'fastapi': ['flask', 'django', 'express'],
  'kubernetes': ['docker'],
  'typescript': ['javascript'],
  'react': ['vue', 'angular'],
  'kafka': ['rabbitmq', 'redis']
};

export default function SelfAssessmentMatrix({
  targetRole,
  jobDescription,
  onSyncWithAnalysis,
  onNavigateToRoadmap
}) {
  const [skills, setSkills] = useState(INITIAL_SKILLS);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState('Languages');
  const [newSkillConfidence, setNewSkillConfidence] = useState('Intermediate');
  const [showAddModal, setShowAddModal] = useState(false);

  // Parse required skills from the target job description or default list
  const requiredRoleSkills = useMemo(() => {
    const textLower = (jobDescription || '').toLowerCase();
    const defaults = ['fastapi', 'python', 'postgresql', 'docker', 'kubernetes', 'kafka', 'redis'];
    const detected = [];

    const testList = [
      'fastapi', 'python', 'postgresql', 'postgres', 'docker', 'kubernetes', 'k8s',
      'kafka', 'apache kafka', 'redis', 'react', 'typescript', 'javascript',
      'tailwind', 'node.js', 'aws', 'terraform', 'ci/cd', 'mysql', 'graphql'
    ];

    testList.forEach(k => {
      try {
        const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`(^|\\W)${escaped}(\\W|$)`, 'i');
        if (regex.test(textLower)) {
          const canonical = k === 'k8s' ? 'kubernetes' 
            : k === 'postgres' ? 'postgresql' 
            : k === 'apache kafka' ? 'kafka'
            : k;
          if (!detected.includes(canonical)) detected.push(canonical);
        }
      } catch (err) {
        if (textLower.includes(k.toLowerCase())) {
          detected.push(k);
        }
      }
    });

    return detected.length > 0 ? detected : defaults;
  }, [jobDescription]);

  // Handle confidence change
  const handleSetConfidence = (id, confidence) => {
    setSkills(prev => prev.map(s => s.id === id ? { ...s, confidence } : s));
  };

  // Add custom skill
  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (!newSkillName.trim()) return;
    const id = newSkillName.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (skills.some(s => s.id === id)) {
      alert("This skill is already in your matrix!");
      return;
    }
    const newSkill = {
      id,
      name: newSkillName.trim(),
      category: newSkillCategory,
      confidence: newSkillConfidence,
      evidence: `Self-assessed as ${newSkillConfidence}`
    };
    setSkills(prev => [newSkill, ...prev]);
    setNewSkillName('');
    setShowAddModal(false);
  };

  // Remove skill
  const handleRemoveSkill = (id) => {
    setSkills(prev => prev.filter(s => s.id !== id));
  };

  // DYNAMIC DETERMINISTIC MATCH ENGINE CALCULATION
  const matchEvaluation = useMemo(() => {
    let matchedCount = 0;
    let partialCount = 0;
    let missingCount = 0;

    const matchedList = [];
    const partialList = [];
    const missingList = [];

    const candidateSkillMap = {};
    skills.forEach(s => {
      candidateSkillMap[s.id.toLowerCase()] = s;
      candidateSkillMap[s.name.toLowerCase()] = s;
    });

    requiredRoleSkills.forEach(reqKey => {
      const userSkill = candidateSkillMap[reqKey];
      const displayName = reqKey.charAt(0).toUpperCase() + reqKey.slice(1);

      if (userSkill && (userSkill.confidence === 'Expert' || userSkill.confidence === 'Intermediate')) {
        // Direct Full Match (1.0 weight)
        matchedCount += 1;
        matchedList.push({
          name: userSkill.name,
          confidence: userSkill.confidence,
          weight: 1.0,
          reason: `Verified ${userSkill.confidence} competence in ${userSkill.name}`
        });
      } else if (userSkill && userSkill.confidence === 'Beginner') {
        // Direct Beginner -> Partial Match (0.5 weight)
        partialCount += 1;
        partialList.push({
          name: userSkill.name,
          confidence: 'Beginner',
          weight: 0.5,
          reason: `Foundational/Beginner exposure to ${userSkill.name}`
        });
      } else {
        // Check for adjacent transferable skill
        const adjacents = TRANSFERABLE_MAP[reqKey] || [];
        const foundAdj = adjacents.find(adj => {
          const s = candidateSkillMap[adj];
          return s && s.confidence !== 'None';
        });

        if (foundAdj) {
          const adjSkill = candidateSkillMap[foundAdj];
          partialCount += 1;
          partialList.push({
            name: displayName,
            confidence: 'Transferable',
            weight: 0.5,
            reason: `Transferable background via ${adjSkill.name} (${adjSkill.confidence})`
          });
        } else {
          missingCount += 1;
          missingList.push({
            name: displayName,
            confidence: 'Missing',
            weight: 0.0,
            reason: `No candidate exposure found for ${displayName}`
          });
        }
      }
    });

    const totalRequired = requiredRoleSkills.length;
    const numerator = matchedCount + 0.5 * partialCount;
    const score = totalRequired > 0 ? Number(((numerator / totalRequired) * 100).toFixed(1)) : 0;

    const formulaString = `(${matchedCount} Matched + 0.5 × ${partialCount} Partial) / ${totalRequired} Required = ${numerator} / ${totalRequired} = ${score}%`;

    return {
      score,
      totalRequired,
      matchedCount,
      partialCount,
      missingCount,
      matchedList,
      partialList,
      missingList,
      numerator,
      formulaString
    };
  }, [skills, requiredRoleSkills]);

  // Filter skills for matrix table
  const filteredSkills = useMemo(() => {
    return skills.filter(skill => {
      // Category filter
      if (activeCategory === 'Required by Role') {
        const isReq = requiredRoleSkills.includes(skill.id.toLowerCase()) || 
                      requiredRoleSkills.includes(skill.name.toLowerCase());
        if (!isReq) return false;
      } else if (activeCategory !== 'All' && skill.category !== activeCategory) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return skill.name.toLowerCase().includes(query) || 
               skill.category.toLowerCase().includes(query) ||
               skill.evidence.toLowerCase().includes(query);
      }
      return true;
    });
  }, [skills, activeCategory, searchQuery, requiredRoleSkills]);

  // Sync to Parent State & Gap Analysis
  const handleSync = () => {
    if (onSyncWithAnalysis) {
      onSyncWithAnalysis({
        evaluatedScore: matchEvaluation.score,
        matched: matchEvaluation.matchedList,
        partial: matchEvaluation.partialList,
        missing: matchEvaluation.missingList,
        auditFormula: matchEvaluation.formulaString,
        skills
      });
    }
  };

  // Radial SVG styling
  const radius = 64;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (matchEvaluation.score / 100) * circumference;

  const scoreTheme = matchEvaluation.score >= 75
    ? { stroke: '#10B981', text: 'text-emerald-400', badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/30', label: 'Strong Fit' }
    : matchEvaluation.score >= 50
    ? { stroke: '#F59E0B', text: 'text-amber-400', badge: 'bg-amber-950/80 text-amber-300 border-amber-500/30', label: 'Moderate Gap' }
    : { stroke: '#F43F5E', text: 'text-rose-400', badge: 'bg-rose-950/80 text-rose-300 border-rose-500/30', label: 'High Skill Gap' };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero & Live Engine HUD */}
      <div className="glass-panel-elevated p-6 sm:p-8 rounded-3xl relative overflow-hidden">
        {/* Glow ambient spots */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-gradient-to-br from-indigo-500/20 via-purple-500/15 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
          {/* Left: Summary description */}
          <div className="space-y-3 max-w-xl text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-950/80 border border-brand-500/40 text-brand-300 text-xs font-semibold tracking-wide">
              <Zap className="w-3.5 h-3.5 text-brand-400" />
              <span>Dynamic Match Engine HUD</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Self-Assessment <span className="text-gradient-brand">Matrix</span>
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              Rate your confidence level across known tools and frameworks. Watch the deterministic ATS match engine dynamically recalculate your qualification score in real-time as you upgrade proficiencies from Beginner (0.5x) to Intermediate/Expert (1.0x).
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-4 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Expert (1.0x Full Match)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span> Intermediate (1.0x)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Beginner (0.5x Partial)
              </span>
            </div>
          </div>

          {/* Right: Live Dynamic Radial Score & Formula Card */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl glass-panel border border-brand-500/30 bg-slate-900/80 shadow-2xl">
            {/* SVG Circular Radial Gauge */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-36 h-36 transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth={strokeWidth}
                  className="text-slate-800/80"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  stroke={scoreTheme.stroke}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  style={{
                    transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.4s ease'
                  }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className={`text-3xl font-black tracking-tight ${scoreTheme.text}`}>
                  {matchEvaluation.score}%
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400">
                  Target Fit
                </span>
              </div>
            </div>

            {/* Formula & Live Counters */}
            <div className="space-y-2.5 text-center sm:text-left">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-400">Target Role:</span>
                <span className="text-xs font-bold text-slate-200 truncate max-w-[150px]">
                  {targetRole}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30">
                  <span className="block text-emerald-400 font-bold text-sm">{matchEvaluation.matchedCount}</span>
                  <span className="text-[10px] text-emerald-300/80">Matched</span>
                </div>
                <div className="p-2 rounded-xl bg-amber-950/40 border border-amber-500/30">
                  <span className="block text-amber-400 font-bold text-sm">{matchEvaluation.partialCount}</span>
                  <span className="text-[10px] text-amber-300/80">Partial</span>
                </div>
                <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/30">
                  <span className="block text-rose-400 font-bold text-sm">{matchEvaluation.missingCount}</span>
                  <span className="text-[10px] text-rose-300/80">Missing</span>
                </div>
              </div>

              {/* Dynamic Formula Display */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-[10px] text-slate-400 block mb-0.5">Live Deterministic Expression:</span>
                <p className="font-mono text-[11px] text-brand-300 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate">
                  {matchEvaluation.formulaString}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toolbar: Category Filters, Search, Add Skill */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                activeCategory === cat
                  ? cat === 'Required by Role'
                    ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow glow-amber'
                    : 'bg-brand-600 text-white shadow glow-brand'
                  : 'glass-panel text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {cat === 'Required by Role' && <Flame className="w-3.5 h-3.5 inline mr-1 text-amber-300" />}
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Add Action */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-60">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools or skills..."
              className="w-full pl-9 pr-4 py-2 rounded-xl glass-input text-xs font-medium"
            />
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4 text-brand-400" />
            <span>Add Tool</span>
          </button>

          <button
            type="button"
            onClick={handleSync}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg glow-brand flex items-center gap-1.5 transition-all shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sync with Analysis</span>
          </button>
        </div>
      </div>

      {/* Add Custom Skill Modal Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div className="glass-panel-elevated p-6 rounded-2xl max-w-md w-full border border-brand-500/40 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-brand-400" />
                Add Skill to Matrix
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomSkill} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Skill / Tool Name
                </label>
                <input
                  type="text"
                  required
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  placeholder="e.g. Next.js, Rust, Snowflake, Terraform"
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Category
                </label>
                <select
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs bg-slate-900 text-slate-200"
                >
                  <option value="Languages">Languages</option>
                  <option value="Backend & APIs">Backend & APIs</option>
                  <option value="Databases & Storage">Databases & Storage</option>
                  <option value="DevOps & Cloud">DevOps & Cloud</option>
                  <option value="Frontend & UI">Frontend & UI</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                  Initial Confidence Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Beginner', 'Intermediate', 'Expert'].map(lvl => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setNewSkillConfidence(lvl)}
                      className={`py-2 rounded-xl text-xs font-semibold border transition-all ${
                        newSkillConfidence === lvl
                          ? lvl === 'Expert' ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : lvl === 'Intermediate' ? 'bg-blue-950 text-blue-300 border-blue-500'
                            : 'bg-amber-950 text-amber-300 border-amber-500'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white shadow-lg glow-brand"
                >
                  Add to Matrix
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Interactive Matrix Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSkills.map((skill) => {
          const isRequiredByRole = requiredRoleSkills.includes(skill.id.toLowerCase()) || 
                                   requiredRoleSkills.includes(skill.name.toLowerCase());

          return (
            <div
              key={skill.id}
              className={`glass-panel p-5 rounded-2xl flex flex-col justify-between transition-all duration-200 relative overflow-hidden ${
                isRequiredByRole 
                  ? 'border-amber-500/30 hover:border-amber-500/60 bg-gradient-to-b from-slate-900/90 to-amber-950/10'
                  : 'hover:border-brand-500/30'
              }`}
            >
              {/* Target Role Requirement Ribbon */}
              {isRequiredByRole && (
                <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/40 text-[10px] font-bold text-amber-300 tracking-wide uppercase">
                  <Flame className="w-3 h-3 text-amber-400" />
                  <span>Target Requirement</span>
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800">
                    {skill.category}
                  </span>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <h4 className="text-base font-bold text-slate-100 flex items-center gap-1.5">
                    <span>{skill.name}</span>
                  </h4>
                </div>

                {skill.evidence && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1 italic">
                    "{skill.evidence}"
                  </p>
                )}
              </div>

              {/* Confidence Level 3-Way Segmented Control */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Confidence Level:</span>
                  <span className={`font-semibold ${
                    skill.confidence === 'Expert' ? 'text-emerald-400'
                    : skill.confidence === 'Intermediate' ? 'text-blue-400'
                    : skill.confidence === 'Beginner' ? 'text-amber-400'
                    : 'text-slate-500'
                  }`}>
                    {skill.confidence} {skill.confidence === 'Beginner' ? '(0.5x)' : skill.confidence !== 'None' ? '(1.0x)' : '(0.0x)'}
                  </span>
                </div>

                {/* 3 Buttons Toggle Pill */}
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950/90 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetConfidence(skill.id, 'None')}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      skill.confidence === 'None'
                        ? 'bg-slate-800 text-slate-300 shadow font-bold'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    None
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetConfidence(skill.id, 'Beginner')}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      skill.confidence === 'Beginner'
                        ? 'bg-amber-950/90 text-amber-300 border border-amber-500/50 shadow font-bold'
                        : 'text-slate-400 hover:text-amber-300'
                    }`}
                  >
                    Beginner
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetConfidence(skill.id, 'Intermediate')}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      skill.confidence === 'Intermediate'
                        ? 'bg-blue-950/90 text-blue-300 border border-blue-500/50 shadow font-bold'
                        : 'text-slate-400 hover:text-blue-300'
                    }`}
                  >
                    Mid
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetConfidence(skill.id, 'Expert')}
                    className={`py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                      skill.confidence === 'Expert'
                        ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-500/50 shadow font-bold'
                        : 'text-slate-400 hover:text-emerald-300'
                    }`}
                  >
                    Expert
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky Action Banner */}
      <div className="glass-panel-elevated p-6 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-brand-500/30 bg-gradient-to-r from-brand-950/40 via-indigo-950/30 to-slate-900">
        <div>
          <h4 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-brand-400" />
            <span>Ready to generate a tailored pedagogical curriculum?</span>
          </h4>
          <p className="text-xs text-slate-400 mt-0.5">
            Your self-assessment rates you at <strong className={scoreTheme.text}>{matchEvaluation.score}% match fit</strong> for {targetRole}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSync}
            className="px-5 py-3 rounded-xl text-xs font-semibold bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white shadow-lg glow-brand transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Score to Analysis</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
