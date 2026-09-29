import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import AIResumeAssistant from './AIResumeAssistant';
import RobotCharacter from './RobotCharacter';
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

function createFallbackQuiz(skill, userQuestion) {
  const topic = userQuestion.trim().replace(/[?!.]+$/, '').slice(0, 110);
  return {
    question: `For your question about ${skill}${topic ? ` (${topic})` : ''}, what is the strongest next step?`,
    options: [
      'Define expected behavior, test edge cases, and measure under realistic conditions',
      'Assume the happy path represents production behavior',
      'Increase resource limits before identifying the bottleneck',
      'Remove failure handling so the system has fewer branches'
    ],
    correct_option_index: 0,
    explanation: 'A reliable engineering answer states the expected behavior, checks failure and boundary cases, and validates the result with realistic measurements.'
  };
}

export default function AITutorSandbox({
  skill = 'PostgreSQL',
  moduleTitle = 'Core Architecture & Indexing',
  isOpen = false,
  onClose,
  contextInfo = '',
  targetRole = '',
  resumeText = '',
  jobDescription = ''
}) {
  const [guideMessage, setGuideMessage] = useState('Choose an AI tool, add your details, then run it to get a result. I’ll offer tips as you go.');
  const [topRobotTipIndex, setTopRobotTipIndex] = useState(0);
  const [robotFlight, setRobotFlight] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const messagesEndRef = useRef(null);
  const flyingRobotRef = useRef(null);
  const closeDrawerButtonRef = useRef(null);
  const topRobotTips = [
    'Choose a tool, add your details, then run it to get a result.',
    'Keep every resume detail accurate and based on your own experience.',
    'Switch tools from the left menu; your selected tool is marked by the moving robot.'
  ];
  const updateGuide = (message) => {
    setGuideMessage(message);
  };
  const handleTopRobotClick = () => {
    const nextIndex = (topRobotTipIndex + 1) % topRobotTips.length;
    setTopRobotTipIndex(nextIndex);
    updateGuide(topRobotTips[nextIndex]);
  };
  const handleRobotFly = (sourceRect, targetRect) => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    if (!sourceRect || !targetRect) return;

    const sourceX = sourceRect.left - 15.12;
    const sourceY = sourceRect.top - 19.44;
    const destinationX = targetRect.right - 40 - 15.12;
    const destinationY = targetRect.top + (targetRect.height - 36) / 2 - 19.44;
    setRobotFlight({
      id: Date.now(),
      left: sourceX,
      top: sourceY,
      deltaX: destinationX - sourceX,
      deltaY: destinationY - sourceY
    });
  };

  useEffect(() => {
    if (!robotFlight || !flyingRobotRef.current) return undefined;
    const { deltaX, deltaY } = robotFlight;
    const animation = flyingRobotRef.current.animate([
      { transform: 'translate3d(0, 0, 0) scale(0.46) rotate(0deg)', opacity: 1, offset: 0 },
      { transform: `translate3d(${deltaX * 0.2}px, ${deltaY * 0.2 - 72}px, 0) scale(0.62) rotate(-8deg)`, opacity: 1, offset: 0.2 },
      { transform: `translate3d(${deltaX * 0.5}px, ${deltaY * 0.5 - 112}px, 0) scale(0.78) rotate(6deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate3d(${deltaX * 0.8}px, ${deltaY * 0.8 - 72}px, 0) scale(0.62) rotate(-4deg)`, opacity: 1, offset: 0.8 },
      { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.46) rotate(0deg)`, opacity: 1, offset: 1 }
    ], { duration: 1400, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' });
    animation.onfinish = () => setRobotFlight(null);
    return () => animation.cancel();
  }, [robotFlight]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    closeDrawerButtonRef.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Initialize a clean session whenever the learning focus changes.
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
      setActiveQuiz(null);
      setSelectedOption(null);
      setQuizSubmitted(false);
      setInputText('');
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

    const conversationHistory = messages
      .filter((message) => message.id !== 'welcome')
      .slice(-8)
      .map((message) => `${message.sender === 'user' ? 'Learner' : 'Tutor'}: ${message.text}`)
      .join('\n');
    const conversationContext = [
      moduleTitle,
      contextInfo,
      conversationHistory && `Recent conversation:\n${conversationHistory}`
    ].filter(Boolean).join('\n\n').slice(-10000);

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
          context: conversationContext
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
        tip: data.practical_tip,
        source: data.source
      };

      setMessages((prev) => [...prev, tutorMsg]);

      if (data.mini_quiz) {
        setActiveQuiz(data.mini_quiz);
        setSelectedOption(null);
        setQuizSubmitted(false);
      } else {
        setActiveQuiz(createFallbackQuiz(skill, query));
        setSelectedOption(null);
        setQuizSubmitted(false);
      }
    } catch (err) {
      console.warn('Tutor API offline or error; providing local Socratic pedagogical fallback:', err);
      const fallbackMsg = {
        id: `t-${Date.now()}`,
        sender: 'tutor',
        text: `I couldn't reach the tutor service, so this is a local practice response. For your question about ${skill}, identify the expected behavior, consider failure cases, and explain how you would verify the result.`,
        tip: 'Try sending your question again when the tutor service is available; follow-up context is kept within this session.'
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      setActiveQuiz(createFallbackQuiz(skill, query));
      setSelectedOption(null);
      setQuizSubmitted(false);
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
  const hasAskedQuestion = messages.some((message) => message.sender === 'user');
  const guideStep = isLoading ? 1 : quizSubmitted ? 2 : hasAskedQuestion ? 1 : 0;
  const guideText = isLoading
    ? 'I’m working through your question. Your next step will appear here.'
    : quizSubmitted
      ? 'Review the explanation, then ask a follow-up or reset for another round.'
      : hasAskedQuestion
        ? 'Read the tutor’s explanation, then choose an answer in the quiz panel.'
        : 'Tap a starter prompt below or type your own question. Then try the quiz to check your understanding.';

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label="Close AI tools"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="ai-tools-title"
        className="ai-tools-drawer glass-panel relative z-[61] flex h-[100dvh] w-screen min-w-0 max-w-[76rem] flex-col overflow-hidden border-l border-y border-brand-500/30 bg-slate-900/95 shadow-2xl sm:w-[92vw] sm:rounded-l-2xl"
      >
        
        {/* Header Bar */}
        <div className="p-3 sm:p-4 sm:px-6 border-b border-slate-800 bg-slate-950/60 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-950/90 border border-brand-500/40 flex items-center justify-center text-brand-400">
              <Bot className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 id="ai-tools-title" className="truncate text-sm sm:text-base font-bold text-slate-100">AI Resume Assistant</h3>
              </div>
              <p className="truncate text-xs text-slate-400">
                Writing, grammar, ATS matching, and resume tools
              </p>
            </div>
          </div>

          <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
            <button
              ref={closeDrawerButtonRef}
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
  <div className="hidden">
          
          {/* Left Column: Chat Conversation (7 cols) */}
          <div className="lg:col-span-7 min-w-0 min-h-[55vh] lg:min-h-0 lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950/40">
            
            {/* Messages Scroll Area */}
            <div className="tutor-popup-scrollbar flex-1 min-h-0 p-4 overflow-y-auto space-y-4">
              <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-900/80 p-3" aria-live="polite">
                <div className="robot-guide" aria-hidden="true">
                  <span className="robot-guide__antenna" />
                  <span className="robot-guide__antenna-light" />
                  <div className="robot-guide__head">
                    <div className="robot-guide__screen">
                      <span className="robot-guide__eye" />
                      <span className="robot-guide__eye" />
                    </div>
                  </div>
                  <span className="robot-guide__neck" />
                  <span className="robot-guide__arm robot-guide__arm--left" />
                  <div className="robot-guide__body">
                    <span className="robot-guide__chest-light" />
                  </div>
                  <span className="robot-guide__arm robot-guide__arm--right" />
                  <span className="robot-guide__leg robot-guide__leg--left" />
                  <span className="robot-guide__leg robot-guide__leg--right" />
                  <span className="robot-guide__shadow" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="text-xs font-bold text-slate-100">Your learning guide</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400" aria-label={`Step ${guideStep + 1} of 3`}>
                      {['Ask', 'Explore', 'Check'].map((step, index) => (
                        <span key={step} className={`rounded-full px-2 py-0.5 ${index === guideStep ? 'bg-slate-200 text-slate-900' : 'bg-slate-800 text-slate-400'}`}>
                          {step}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-300">{guideText}</p>
                </div>
              </div>

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
                    {msg.source && (
                      <span className="block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                        {msg.source === 'mock' ? 'Offline practice' : `${msg.source} AI`}
                      </span>
                    )}
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
          <div className="tutor-popup-scrollbar lg:col-span-5 min-w-0 min-h-[45vh] lg:min-h-0 p-5 flex flex-col justify-between overflow-y-auto space-y-4 bg-slate-900/40">
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
                          <span className="min-w-0 flex-1 break-words">{option}</span>
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

        <div className="tutor-popup-scrollbar flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 p-3" aria-live="polite">
            <button
              type="button"
              onClick={handleTopRobotClick}
              className="robot-guide-button"
              aria-label="Ask the AI guide for another tip"
              title="Click for another AI tool tip"
            >
              <RobotCharacter className="robot-guide--wave" />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-100">AI guide</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">{guideMessage}</p>
            </div>
          </div>
          <AIResumeAssistant
            targetRole={targetRole}
            resumeText={resumeText}
            jobDescription={jobDescription}
            onGuideChange={updateGuide}
            onRobotFly={handleRobotFly}
            isRobotFlying={Boolean(robotFlight)}
          />
        </div>
      </div>
      {robotFlight && (
        createPortal(
          <div
            key={robotFlight.id}
            ref={flyingRobotRef}
            className="robot-flight"
            style={{ left: robotFlight.left, top: robotFlight.top }}
            aria-hidden="true"
          >
            <RobotCharacter />
          </div>,
          document.body
        )
      )}
    </div>
  );
}
