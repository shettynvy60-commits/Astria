import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  HelpCircle, 
  CheckCircle2, 
  XCircle, 
  Lightbulb, 
  X, 
  RotateCcw,
  Zap,
  Terminal,
  BookOpen
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function AITutorSandbox({
  skill = 'PostgreSQL',
  moduleTitle = 'Core Architecture & Indexing',
  isOpen = false,
  onClose,
  contextInfo = ''
}) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const messagesEndRef = useRef(null);

  // Initialize initial welcome message and default diagnostic quiz when skill changes
  useEffect(() => {
    if (skill) {
      setMessages([
        {
          id: 'welcome',
          sender: 'tutor',
          text: `Welcome to the Socratic Sandbox for **${skill}**! I am your Senior Technical Mentor. We are bridging your specific skill gap from the roadmap. What architectural pattern, concurrency trade-off, or failure scenario would you like to explore?`,
          tip: `Focus on production trade-offs (e.g. latency vs consistency, connection limits) rather than basic syntax.`
        }
      ]);
      setActiveQuiz({
        question: `In high-throughput environments with ${skill}, what is the primary consideration when tuning connection pool limits?`,
        options: [
          'Matching pool size to active CPU cores and disk I/O limits',
          'Setting pool size to maximum possible (e.g. 5,000) to avoid rejection',
          'Disabling pool timeouts and query retries entirely',
          'Using a single shared singleton connection across all worker threads'
        ],
        correct_option_index: 0,
        explanation: 'Oversized connection pools cause context switching thrash and memory pressure. Sizing pools to available CPU threads and hardware throughput maximizes query speed.'
      });
      setSelectedOption(null);
      setQuizSubmitted(false);
    }
  }, [skill]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || isLoading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/tutor/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skill: skill,
          user_message: query,
          context: `${moduleTitle} - ${contextInfo}`
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();
      const tutorMsg = {
        id: `t-${Date.now()}`,
        sender: 'tutor',
        text: data.explanation || 'Great question! Let us examine how this scales in production.',
        tip: data.practical_tip
      };

      setMessages((prev) => [...prev, tutorMsg]);

      if (data.mini_quiz) {
        setActiveQuiz(data.mini_quiz);
        setSelectedOption(null);
        setQuizSubmitted(false);
      }
    } catch (err) {
      console.warn('Tutor API offline or error; providing local Socratic pedagogical fallback:', err);
      // Fallback pedagogical response
      const fallbackMsg = {
        id: `t-${Date.now()}`,
        sender: 'tutor',
        text: `In a production cluster utilizing **${skill}**, the critical consideration is isolating failure domains and avoiding cascading saturation. When evaluating "${query}", always quantify the trade-off between read latency, write amplification, and recovery time.`,
        tip: `In technical rounds, always explain how you would measure this using Prometheus metrics or distributed tracing.`
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOptionClick = (index) => {
    if (quizSubmitted) return;
    setSelectedOption(index);
    setQuizSubmitted(true);
  };

  const quickPrompts = [
    `How does ${skill} handle connection pooling under high traffic?`,
    `Explain a catastrophic failure scenario in ${skill} and how to prevent it.`,
    `What are the most common interview traps regarding ${skill}?`,
    `Give me a production code design exercise for ${skill}.`
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-4xl h-[85vh] rounded-2xl border border-brand-500/30 flex flex-col shadow-2xl overflow-hidden bg-slate-900/95">
        
        {/* Header Bar */}
        <div className="p-4 px-6 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-950/90 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  AI Socratic Tutor Sandbox
                </h3>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-brand-950 text-brand-300 border border-brand-500/30 font-mono">
                  {skill}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Module: {moduleTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setMessages([messages[0]]);
                setSelectedOption(null);
                setQuizSubmitted(false);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title="Reset Conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
              title="Close Sandbox"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content: Split Chat + Diagnostic Quiz */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left Column: Chat Conversation (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950/40">
            
            {/* Messages Scroll Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[90%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.text}</div>
                    
                    {msg.tip && (
                      <div className="pt-2 border-t border-slate-800/80 flex items-start gap-2 text-amber-300/90 text-[11px]">
                        <Lightbulb className="w-3.5 h-3.5 shrink-0 text-amber-400 mt-0.5" />
                        <span>{msg.tip}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-start gap-2">
                  <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-brand-500/30 border-t-brand-400 rounded-full animate-spin" />
                    <span>Analyzing technical concept & formulating Socratic challenge...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Socratic Prompts */}
            <div className="p-3 border-t border-slate-800/60 bg-slate-950/80">
              <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider flex items-center gap-1 mb-2">
                <Sparkles className="w-3 h-3 text-brand-400" /> Socratic Starters
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                {quickPrompts.map((prompt, pIdx) => (
                  <button
                    key={pIdx}
                    type="button"
                    onClick={() => handleSendMessage(prompt)}
                    disabled={isLoading}
                    className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="p-3 px-4 border-t border-slate-800 bg-slate-950 flex items-center gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Ask a deep Socratic question about ${skill}...`}
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-colors"
              />
              <button
                type="submit"
                disabled={isLoading || !inputText.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white disabled:opacity-40 transition-all glow-brand"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Right Column: Diagnostic Quiz & Key Takeaways (5 cols) */}
          <div className="lg:col-span-5 p-5 flex flex-col justify-between overflow-y-auto space-y-4 bg-slate-900/40">
            {activeQuiz ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wide flex items-center gap-1.5">
                    <HelpCircle className="w-4 h-4" /> Adaptive Concept Quiz
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Focus: {skill}
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-100 leading-relaxed">
                    {activeQuiz.question}
                  </h4>

                  <div className="space-y-2 pt-1">
                    {activeQuiz.options?.map((option, optIdx) => {
                      const isSelected = selectedOption === optIdx;
                      const isCorrect = optIdx === activeQuiz.correct_option_index;

                      let btnStyle = 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700';
                      if (quizSubmitted) {
                        if (isCorrect) {
                          btnStyle = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200';
                        } else if (isSelected && !isCorrect) {
                          btnStyle = 'bg-rose-950/60 border-rose-500/60 text-rose-200';
                        } else {
                          btnStyle = 'bg-slate-900/40 border-slate-800/40 text-slate-500';
                        }
                      } else if (isSelected) {
                        btnStyle = 'bg-brand-950 border-brand-500 text-brand-200';
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleOptionClick(optIdx)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                        >
                          <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 shrink-0">
                            {String.fromCharCode(65 + optIdx)}
                          </span>
                          <span className="flex-1">{option}</span>
                          {quizSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                          {quizSubmitted && isSelected && !isCorrect && (
                            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs space-y-1.5 animate-fadeIn">
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        {selectedOption === activeQuiz.correct_option_index ? (
                          <span className="text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Correct Assessment!
                          </span>
                        ) : (
                          <span className="text-rose-400 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Architectural Revision Needed
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed">
                        {activeQuiz.explanation}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 space-y-2">
                <BookOpen className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-xs">Ask the tutor a question to trigger interactive quizzes.</p>
              </div>
            )}

            {/* Quick Best Practice Badge */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-brand-950/40 via-indigo-950/20 to-slate-950 border border-brand-500/20 text-xs space-y-1">
              <span className="text-brand-300 font-semibold flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-brand-400" /> Interview Success Strategy
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                When discussing {skill}, anchor your answers with quantifiable metrics: latency reduction (ms), concurrency ceilings, or cluster recovery time (RTO).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
