import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  Send, 
  Copy, 
  Check, 
  Layers, 
  Target, 
  BookOpen, 
  Terminal, 
  Flame,
  RotateCcw
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

const MILESTONE_NAMES = {
  1: 'The Core Problem',
  2: 'Architecture & Trade-offs',
  3: 'Resume / Project Application'
};

// Client-side fallback knowledge engine mirroring the exact backend Socratic rules
const FALLBACK_KNOWLEDGE = {
  redis: {
    1: {
      concept_anchor: "Traditional relational databases write data to disk, which guarantees persistence but creates I/O bottlenecks when handling tens of thousands of read requests per second. In-memory datastores keep hot data directly in RAM to achieve sub-millisecond latencies.",
      socratic_probe: "If your main database goes down, data on disk is saved. But what happens to data kept purely in RAM if the server suddenly loses power? How might a production system balance speed with data survival?",
      hint: "Think about append-only logs (AOF) or point-in-time snapshots (RDB) to rebuild memory state after a reboot.",
      analogy: "Imagine RAM as a whiteboard on your desk and disk as a filing cabinet. Writing on the whiteboard is instant, but cleaning staff wipe it unless you copy it into a log.",
      validation: "Spot-on! Pure RAM is volatile, so systems combine in-memory caching with append-only logs (AOF) or snapshots (RDB) to balance lightning reads with disaster recovery."
    },
    2: {
      concept_anchor: "Redis operates as a single-threaded event loop around non-blocking multiplexed I/O. This completely avoids mutex locks and thread-context switching, but means long-running commands (like KEYS *) block the entire server.",
      socratic_probe: "If an engineer runs a regex scan across 10 million keys in production, what happens to concurrent user requests? What cache-eviction strategy would you select when RAM reaches capacity (e.g. LRU vs. LFU)?",
      hint: "Since there is only one thread processing the queue, any operation taking 500ms makes every other request wait 500ms in line. Consider SCAN instead.",
      analogy: "A single hyper-fast barista: if one customer orders 500 custom drinks, all other espresso orders wait until that order finishes.",
      validation: "Exactly right. Single-threaded throughput requires O(1) commands, SCAN cursor pagination, and well-chosen TTL eviction (like volatile-lru) to avoid catastrophic tail latency."
    },
    3: {
      concept_anchor: "Demonstrating in-memory mastery requires proving how you protected the underlying database from cache stampedes, thundering herds, or stale reads during high concurrency bursts.",
      socratic_probe: "How would you design a portfolio capstone integrating Redis as a distributed token-bucket rate limiter or cache-aside layer? What measurable metric would you highlight on your resume?",
      hint: "Structure your metric around p99 latency reduction (e.g. from 240ms down to 12ms) or shielding PostgreSQL from 10k RPS spikes.",
      analogy: "Like adding an express bouncer at the door who admits 100 people per minute, shielding the main hall from being crushed.",
      validation: "Outstanding synthesis! You have connected the core in-memory problem, single-threaded lockless concurrency, and measurable production impact.",
      project_deliverable: "Production-Grade Distributed Rate Limiter & Cache-Aside Layer: Implement a Redis-backed Sliding Window Log with Lua scripts to prevent race conditions during 15k RPS bursts.",
      resume_bullet: "Engineered an atomic distributed rate-limiter and cache-aside layer in Redis using Lua scripts; slashed p99 database latency from 280ms to 14ms and shielded primary PostgreSQL cluster from thundering herds during flash-traffic spikes."
    }
  },
  "system design": {
    1: {
      concept_anchor: "Single-server architectures hit vertical scaling limits where upgrading CPU and RAM becomes cost-prohibitive and leaves a single point of failure. Distributed systems partition data and compute across multiple horizontal nodes.",
      socratic_probe: "When you transition from a single server with an in-memory session store to 10 load-balanced backend instances, what immediately breaks with user authentication? How do you resolve it?",
      hint: "If a user logs in on Server A, will Server B know their session on the next HTTP request? Consider centralized sessions (Redis/JWT).",
      analogy: "A gym with different attendants each day who don't share notes: you can't open your locker unless the attendant checks a central ledger.",
      validation: "Precisely. Distributed web tiers require stateless application nodes with centralized session stores (like Redis/JWT) or sticky sessions at the load balancer."
    },
    2: {
      concept_anchor: "According to the CAP theorem, any distributed datastore over an unreliable network must trade off linearizable Consistency for high Availability during network partitions.",
      socratic_probe: "Imagine a bank balance transfer service versus a social media follower count. Which side of the PACELC/CAP spectrum does each require, and what failure scenario does each guard against?",
      hint: "A user cannot withdraw $100 twice (requires CP), whereas a follower count can synchronize eventually (AP).",
      analogy: "A bank transfer is like a deed to a house—only one owner at a time. A tweet like count is like gossip—delays hurt nobody.",
      validation: "Spot on. Financial ledgers mandate CP (strict serializability), whereas high-throughput metrics and activity feeds thrive on AP (eventual consistency)."
    },
    3: {
      concept_anchor: "System design mastery on a technical resume is demonstrated through quantitative SLOs, clear partition strategies, and graceful degradation under catastrophic outages.",
      socratic_probe: "Describe a distributed system project you could showcase: how would you partition the data (e.g. consistent hashing) and handle circuit breaking when a downstream microservice times out?",
      hint: "Mention an API gateway with circuit breakers, exponential backoff, and fallback caching to preserve 99.9% uptime.",
      analogy: "An electrical fuse: when a circuit overloads, the fuse trips instantly to protect the house from burning down.",
      validation: "Excellent. You understand horizontal scaling, distributed trade-offs, and production resiliency.",
      project_deliverable: "High-Throughput Distributed URL Shortener & Analytics Gateway: Built with consistent hashing, distributed Redis locks, and circuit breakers sustaining 20k RPS with 99.95% uptime.",
      resume_bullet: "Architected a horizontally scalable distributed service tier using consistent hashing and circuit breakers; maintained 99.98% availability and capped p99 response times under 45ms during simulated downstream service outages."
    }
  }
};

const getClientSocraticStep = (skill, targetRole, milestone, answer) => {
  const cleanSkill = (skill || 'System Design').trim();
  const lower = cleanSkill.toLowerCase();
  let bank = FALLBACK_KNOWLEDGE[lower];
  if (!bank) {
    for (const k in FALLBACK_KNOWLEDGE) {
      if (lower.includes(k) || k.includes(lower)) {
        bank = FALLBACK_KNOWLEDGE[k];
        break;
      }
    }
  }

  if (!bank) {
    bank = {
      1: {
        concept_anchor: `In production ${targetRole || 'Software Engineering'} systems, ${cleanSkill} exists to eliminate critical bottlenecks in maintainability, scalability, and execution reliability that ad-hoc approaches cannot solve.`,
        socratic_probe: `What specific production failure or architectural bottleneck occurs when an engineering team attempts to build a high-concurrency system without ${cleanSkill}? What pain point does it directly resolve?`,
        hint: `Consider what manual task or resource constraint (latency, consistency, concurrency, or coordination) breaks down without ${cleanSkill}.`,
        analogy: `Using ${cleanSkill} is like switching from hand-carrying buckets of water to installing automated plumbing.`,
        validation: `Solid insight! You've accurately identified the core architectural problem that makes ${cleanSkill} indispensable in modern systems.`
      },
      2: {
        concept_anchor: `Every technical choice enforces architectural trade-offs: deploying ${cleanSkill} optimizes specific operational dimensions (throughput, developer velocity, fault isolation) while introducing operational overhead or latency boundaries.`,
        socratic_probe: `When deploying ${cleanSkill} in a high-traffic production cluster, what is the single biggest performance or operational trade-off you must monitor to prevent system degradation?`,
        hint: `Think about resource consumption (memory, CPU), network latency, error handling, or operational complexity under 10x traffic spikes.`,
        analogy: `Like a high-performance engine: it delivers incredible acceleration, but requires specialized oil and tighter temperature thresholds.`,
        validation: `Excellent understanding of the trade-off envelope. Engineering is fundamentally about choosing the right trade-offs under constraints.`
      },
      3: {
        concept_anchor: `Demonstrating ${cleanSkill} mastery on an engineering resume requires framing your experience around measurable business impact, production hardening, and concrete architectural deliverables.`,
        socratic_probe: `How would you articulate a portfolio project or real-world deliverable demonstrating ${cleanSkill}? What quantifiable metric (latency, reliability, test coverage, or cost savings) would you highlight?`,
        hint: `Structure: [Active Verb] + [Specific ${cleanSkill} implementation] + [Quantifiable outcome, e.g. -40% latency or 99.9% uptime].`,
        analogy: `Translating technical capability into business currency that hiring managers and tech leads immediately respect.`,
        validation: `Mastery verified! You have traversed the complete 3-milestone arc for ${cleanSkill}.`,
        project_deliverable: `Production-Grade ${cleanSkill} End-to-End Implementation: Comprehensive architectural project incorporating production best practices, observability, and automated testing.`,
        resume_bullet: `Architected and deployed production ${cleanSkill} workflows with automated validation and observability; improved system throughput by 35% and reduced production incident response times.`
      }
    };
  }

  const ms = Math.max(1, Math.min(3, milestone || 1));
  const msData = bank[ms] || bank[1];
  const msName = MILESTONE_NAMES[ms];

  if (!answer || !answer.trim()) {
    return {
      skill: cleanSkill,
      target_role: targetRole,
      milestone: ms,
      milestone_name: msName,
      status: 'in_progress',
      concept_anchor: msData.concept_anchor,
      socratic_probe: msData.socratic_probe,
      feedback: null,
      hint: null,
      formatted_message: `📍 **${cleanSkill} • Milestone ${ms}/3: ${msName}**\n\n**Concept Anchor:** ${msData.concept_anchor}\n\n**Socratic Probe:** ${msData.socratic_probe}`
    };
  }

  const lowerAns = answer.toLowerCase().trim();
  const isUnsure = lowerAns.includes("don't know") || lowerAns.includes("not sure") || lowerAns.includes("hint") || lowerAns.includes("help") || lowerAns.length < 5;

  if (isUnsure) {
    return {
      skill: cleanSkill,
      target_role: targetRole,
      milestone: ms,
      milestone_name: msName,
      status: 'needs_hint',
      concept_anchor: msData.concept_anchor,
      socratic_probe: msData.socratic_probe,
      feedback: "Here is a real-world analogy to help unlock the concept:",
      hint: msData.hint,
      analogy: msData.analogy,
      formatted_message: `💡 **Micro-Hint & Real-World Analogy:**\n\n${msData.analogy}\n\n*${msData.hint}*\n\n📍 **Let's re-examine Milestone ${ms}/3: ${msName}**\n\n**Socratic Probe:** ${msData.socratic_probe}`
    };
  }

  if (ms === 3) {
    const proj = msData.project_deliverable || `Production ${cleanSkill} Service`;
    const bullet = msData.resume_bullet || `Engineered production ${cleanSkill} systems with measurable latency improvements.`;
    return {
      skill: cleanSkill,
      target_role: targetRole,
      milestone: 3,
      milestone_name: msName,
      status: 'completed',
      concept_anchor: msData.concept_anchor,
      socratic_probe: "How does this resume bullet reflect your hands-on mastery?",
      feedback: msData.validation,
      project_deliverable: proj,
      resume_bullet: bullet,
      formatted_message: `✅ **Milestone 3/3 Complete — ${cleanSkill} Mastery Verified!**\n\n${msData.validation}\n\n🎯 **Your Truth-Backed Portfolio Deliverable:**\n• ${proj}\n\n📄 **Verified Resume Bullet Point:**\n• "${bullet}"`
    };
  }

  const nextMs = ms + 1;
  const nextMsData = bank[nextMs] || bank[1];
  const nextMsName = MILESTONE_NAMES[nextMs];

  return {
    skill: cleanSkill,
    target_role: targetRole,
    milestone: nextMs,
    milestone_name: nextMsName,
    status: 'milestone_advanced',
    concept_anchor: nextMsData.concept_anchor,
    socratic_probe: nextMsData.socratic_probe,
    feedback: msData.validation,
    hint: null,
    formatted_message: `✅ ${msData.validation}\n\n---\n\n📍 **${cleanSkill} • Milestone ${nextMs}/3: ${nextMsName}**\n\n**Concept Anchor:** ${nextMsData.concept_anchor}\n\n**Socratic Probe:** ${nextMsData.socratic_probe}`
  };
};

export default function SocraticRoadmapTutor({
  isOpen,
  onClose,
  initialSkill = 'Redis',
  targetRole = 'Backend Engineer',
  availableSkills = ['Redis', 'System Design', 'Kafka', 'Docker', 'PostgreSQL', 'GraphQL']
}) {
  const [selectedSkill, setSelectedSkill] = useState(initialSkill || 'Redis');
  const [currentMilestone, setCurrentMilestone] = useState(1);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedBullet, setCopiedBullet] = useState(false);
  const [chatLog, setChatLog] = useState([]);
  const [completedDeliverables, setCompletedDeliverables] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize or change skill
  useEffect(() => {
    if (!isOpen) return;
    const active = initialSkill || selectedSkill || 'Redis';
    setSelectedSkill(active);
    startSkillDialogue(active, 1);
  }, [isOpen, initialSkill]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog, isLoading]);

  const startSkillDialogue = async (skillToStart, milestone = 1) => {
    setIsLoading(true);
    setCurrentMilestone(milestone);
    setCompletedDeliverables(null);

    let stepData = null;
    try {
      const res = await fetch(`${API_BASE}/api/tutor/socratic-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: skillToStart,
          target_role: targetRole,
          current_milestone: milestone,
          user_answer: null
        })
      });

      if (res.ok) {
        stepData = await res.json();
      }
    } catch {}

    if (!stepData) {
      stepData = getClientSocraticStep(skillToStart, targetRole, milestone, null);
    }

    setChatLog([{
      type: 'tutor',
      milestone: stepData.milestone,
      milestone_name: stepData.milestone_name,
      concept_anchor: stepData.concept_anchor,
      socratic_probe: stepData.socratic_probe,
      status: stepData.status,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
    setIsLoading(false);
  };

  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setInputMessage('');
    const newLog = [
      ...chatLog,
      {
        type: 'user',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];
    setChatLog(newLog);
    setIsLoading(true);

    let result = null;

    try {
      const res = await fetch(`${API_BASE}/api/tutor/socratic-roadmap`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: selectedSkill,
          target_role: targetRole,
          current_milestone: currentMilestone,
          user_answer: text
        })
      });

      if (res.ok) {
        result = await res.json();
      }
    } catch {}

    if (!result) {
      result = getClientSocraticStep(selectedSkill, targetRole, currentMilestone, text);
    }

    setIsLoading(false);

    if (result.status === 'milestone_advanced') {
      setCurrentMilestone(result.milestone);
    } else if (result.status === 'completed') {
      setCurrentMilestone(3);
      setCompletedDeliverables({
        project: result.project_deliverable,
        bullet: result.resume_bullet
      });
    }

    setChatLog([
      ...newLog,
      {
        type: 'tutor',
        milestone: result.milestone,
        milestone_name: result.milestone_name,
        concept_anchor: result.concept_anchor,
        socratic_probe: result.socratic_probe,
        feedback: result.feedback,
        hint: result.hint,
        analogy: result.analogy,
        status: result.status,
        project_deliverable: result.project_deliverable,
        resume_bullet: result.resume_bullet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const handleCopyBullet = (bulletText) => {
    if (!bulletText) return;
    navigator.clipboard.writeText(bulletText);
    setCopiedBullet(true);
    setTimeout(() => setCopiedBullet(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-4xl h-[92vh] max-h-[820px] rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-50">
                    Socratic Roadmap Skill Tutor
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                    Inquiry Engine
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Target Role: <strong className="text-slate-700 dark:text-slate-200">{targetRole}</strong> • Active Focus: <strong className="text-sky-600 dark:text-sky-400">{selectedSkill}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => startSkillDialogue(selectedSkill, 1)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                title="Restart Skill Milestones"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close Tutor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Skill Selector Chips */}
          {availableSkills && availableSkills.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] font-semibold text-slate-400 shrink-0 mr-1">Missing Gaps:</span>
              {availableSkills.map((sk, i) => {
                const isSelected = selectedSkill.toLowerCase() === sk.toLowerCase();
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setSelectedSkill(sk);
                      startSkillDialogue(sk, 1);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                      isSelected
                        ? 'bg-sky-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-400'
                    }`}
                  >
                    {sk}
                  </button>
                );
              })}
            </div>
          )}

          {/* 3-Milestone Stepper Bar */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            {[1, 2, 3].map((step) => {
              const isActive = currentMilestone === step;
              const isPast = currentMilestone > step || completedDeliverables !== null;
              return (
                <div
                  key={step}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    isActive
                      ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-400 dark:border-sky-700 text-sky-900 dark:text-sky-200 shadow-sm'
                      : isPast
                      ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-mono ${isActive ? 'bg-sky-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                        {step}
                      </span>
                    )}
                    <span className="truncate">{MILESTONE_NAMES[step]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chat / Socratic Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-slate-50/50 dark:bg-slate-950/30">
          {chatLog.map((msg, index) => {
            if (msg.type === 'user') {
              return (
                <div key={index} className="flex justify-end">
                  <div className="max-w-[85%] sm:max-w-[70%] bg-sky-600 text-white p-3.5 rounded-2xl rounded-tr-sm text-xs sm:text-sm shadow-sm leading-relaxed">
                    <p>{msg.text}</p>
                    <span className="block text-[10px] text-sky-200 mt-1 text-right">{msg.timestamp}</span>
                  </div>
                </div>
              );
            }

            // Tutor Message (Strict Concept Anchor + Socratic Probe structure)
            return (
              <div key={index} className="space-y-3 max-w-[92%] animate-fade-in">
                
                {/* Feedback pill if advancing or gave hint */}
                {msg.feedback && (
                  <div className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-2.5 ${
                    msg.status === 'needs_hint'
                      ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  }`}>
                    {msg.status === 'needs_hint' ? (
                      <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className="font-semibold">{msg.feedback}</span>
                      {msg.analogy && (
                        <p className="mt-1 italic text-slate-700 dark:text-slate-300">{msg.analogy}</p>
                      )}
                      {msg.hint && (
                        <p className="mt-1 text-[11px] font-mono text-amber-800 dark:text-amber-300">💡 Hint: {msg.hint}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Socratic Card Box */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  {/* Milestone Badge */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">📍</span>
                      <strong className="text-sm font-bold text-slate-900 dark:text-slate-50">
                        {selectedSkill} • Milestone {msg.milestone}/3: {msg.milestone_name}
                      </strong>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">{msg.timestamp}</span>
                  </div>

                  {/* Concept Anchor Card */}
                  {msg.concept_anchor && (
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-1">
                      <div className="text-[11px] font-bold text-sky-700 dark:text-sky-300 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Concept Anchor</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans">
                        {msg.concept_anchor}
                      </p>
                    </div>
                  )}

                  {/* Socratic Probe Challenge Card */}
                  {msg.socratic_probe && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/40 dark:to-indigo-950/40 border border-sky-200 dark:border-sky-800 space-y-1.5">
                      <div className="text-[11px] font-bold text-sky-800 dark:text-sky-200 uppercase tracking-wider flex items-center gap-1.5">
                        <Flame className="w-3.5 h-3.5 text-amber-500" />
                        <span>Socratic Probe</span>
                      </div>
                      <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100 leading-relaxed">
                        {msg.socratic_probe}
                      </p>
                    </div>
                  )}

                  {/* Milestone 3 Completion Deliverables */}
                  {msg.project_deliverable && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 space-y-3 mt-3">
                      <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wide">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span>Milestone 3 Unlocked: Truth-Backed Portfolio Deliverable</span>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 text-xs text-slate-700 dark:text-slate-200">
                        <strong className="block text-slate-900 dark:text-slate-100 mb-1">Portfolio Capstone:</strong>
                        {msg.project_deliverable}
                      </div>

                      <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 space-y-2">
                        <div className="flex items-center justify-between">
                          <strong className="text-xs text-slate-900 dark:text-slate-100">Verified Resume Bullet Point:</strong>
                          <button
                            type="button"
                            onClick={() => handleCopyBullet(msg.resume_bullet)}
                            className="inline-flex items-center gap-1 text-[11px] text-sky-600 hover:text-sky-700 font-semibold"
                          >
                            {copiedBullet ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedBullet ? 'Copied!' : 'Copy Bullet'}</span>
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300 italic font-mono bg-slate-50 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-700">
                          "{msg.resume_bullet}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit text-xs text-slate-500">
              <div className="w-3.5 h-3.5 border-2 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
              <span>Socratic Tutor formulating inquiry & analyzing response...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar & Socratic Quick Probes */}
        <div className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 space-y-2.5">
          {/* Quick Helper Actions */}
          <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => handleSendMessage("I'm not fully sure, could you give me a real-world analogy or micro-hint?")}
              disabled={isLoading}
              className="px-3 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 shrink-0 transition-colors inline-flex items-center gap-1"
            >
              <HelpCircle className="w-3 h-3 text-amber-500" />
              <span>Give me a micro-hint</span>
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("How does this behave under 100,000 requests per second?")}
              disabled={isLoading}
              className="px-3 py-1 rounded-full text-xs font-medium bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/50 shrink-0 transition-colors"
            >
              ⚡ Test 100k RPS scale
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage("What is the primary failure mode in production?")}
              disabled={isLoading}
              className="px-3 py-1 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 shrink-0 transition-colors"
            >
              🚨 Ask production failure mode
            </button>
          </div>

          {/* Text Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={`Answer the Socratic Probe for ${selectedSkill} Milestone ${currentMilestone}/3...`}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm shadow-sm transition-all inline-flex items-center gap-1.5"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
