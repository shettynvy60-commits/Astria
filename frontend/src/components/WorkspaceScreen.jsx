import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, X, Sparkles, AlertTriangle } from 'lucide-react';
import QuickRolePresets from './QuickRolePresets';
import PrivacyShield from './PrivacyShield';
import { useUser } from '../context/UserContext';
import { API_BASE } from '../config';

export default function WorkspaceScreen({
  onExecuteAnalysis,
  isLoading,
  initialResumeText = '',
  initialStrengths = '',
  initialJobDescription = '',
  error = '',
  onClearError
}) {
  const { user } = useUser();
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [strengths, setStrengths] = useState(initialStrengths);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [inputMode, setInputMode] = useState('paste'); // 'upload' | 'paste'
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [activePreset, setActivePreset] = useState(null);
  const fileInputRef = useRef(null);

  // Preset pills only HIGHLIGHT — they do NOT auto-fill any input blocks
  const handlePresetSelect = (presetId) => {
    setActivePreset(prev => prev === presetId ? null : presetId);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length > 0) handleFileSelection(e.dataTransfer.files[0]);
  };

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile) return;
    const validExts = ['.pdf', '.txt', '.docx'];
    if (!validExts.some(ext => selectedFile.name.toLowerCase().endsWith(ext))) {
      alert('Please upload a PDF or plain text resume file.');
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = () => {
    if (onExecuteAnalysis) {
      onExecuteAnalysis({
        resumeText: inputMode === 'paste' ? resumeText : '',
        file: inputMode === 'upload' ? file : null,
        strengths,
        jobDescription,
      });
    }
  };

  const canSubmit = jobDescription.trim() && (file || resumeText.trim());

  return (
    <div className="animate-fade-in">
      {/* Header & Title Block */}
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Astria Career Co-Pilot
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-400 max-w-3xl mt-2 leading-relaxed">
          Your intelligent career companion that evaluates skill gaps against target roles,
          provides official learning paths and capstone projects, analyzes technical interview
          accuracy, and tailors ATS-optimized resumes — all with zero-trust privacy protection.
        </p>
      </div>

      {/* Quick-Role Preset Bar — highlight only, no auto-fill */}
      <QuickRolePresets activePreset={activePreset} onSelect={handlePresetSelect} />

      {/* Backend Offline / Analysis Error Notice */}
      {error && (
        <div className="mb-6 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/90 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 flex items-start justify-between gap-3 shadow-sm animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold">Astria AI Backend Required</h3>
              <div className="text-xs text-rose-700 dark:text-rose-300 mt-1 leading-relaxed">
                {error === 'backend_offline' ? (
                  <>
                    The AI analysis backend is currently offline or unreachable at <code className="bg-rose-100 dark:bg-rose-900/50 px-1 py-0.5 rounded font-mono text-[11px]">{API_BASE}</code>.
                    <br />
                    To run real AI skill extraction and gap analysis, please launch the backend service:
                    <span className="block mt-1 font-mono text-[11px] bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-md w-fit">
                      python backend/run_combined_backend.py
                    </span>
                    <button
                      type="button"
                      onClick={onClearError}
                      className="mt-2.5 inline-flex items-center px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
                    >
                      Dismiss & Retry
                    </button>
                  </>
                ) : (
                  <>
                    <span>{error}</span>
                    <button
                      type="button"
                      onClick={onClearError}
                      className="mt-2 block px-2.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-medium"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
          {onClearError && (
            <button
              onClick={onClearError}
              className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 p-1"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 3-Column Horizontal Input Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        {/* Column 1: Upload Resume */}
        <section id="block-resume" className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-3">1. Upload Resume</h2>
          
          {/* Toggle tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg mb-4">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                inputMode === 'upload'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              PDF Upload
            </button>
            <button
              type="button"
              onClick={() => setInputMode('paste')}
              className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-all ${
                inputMode === 'paste'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              Paste Raw Text
            </button>
          </div>

          {inputMode === 'upload' ? (
            !file ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all h-64 flex flex-col items-center justify-center ${
                  isDragging
                    ? 'border-slate-700 bg-slate-100 dark:border-slate-300 dark:bg-slate-800'
                    : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={(e) => handleFileSelection(e.target.files?.[0])}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-slate-400 mb-3" />
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Drag & drop your resume, or <span className="text-slate-900 dark:text-white underline underline-offset-2">browse</span>
                </p>
                <p className="text-xs text-slate-400">Supports PDF, TXT, DOCX</p>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between h-64">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">{file.name}</p>
                    <p className="text-xs text-slate-400">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                <button type="button" onClick={() => { setFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }} className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )
          ) : (
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your full resume text here..."
              className="w-full h-64 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
            />
          )}
        </section>

        {/* Column 2: Core Strengths */}
        <section id="block-strengths" className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">2. Your Verified Top Strengths</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Specify languages/tools you are truly expert at to prioritize over general resume items.
          </p>
          <textarea
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            placeholder="Python (Expert), System Design, REST APIs, Docker..."
            className="w-full h-64 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
          />
        </section>

        {/* Column 3: Target Job Description */}
        <section id="block-job-description" className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-1">3. Target Job Description</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Paste the full job requirements from LinkedIn or any job board.
          </p>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste job requirements from LinkedIn or job boards..."
            className="w-full h-64 p-3 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all resize-none"
          />
        </section>
      </div>

      {/* Data Privacy & AI Shield Block */}
      <PrivacyShield user={user} resumeText={resumeText} />

      {/* Primary Action Button */}
      <div className="flex flex-col items-center justify-center mt-2 mb-8 gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isLoading}
          className={`w-full max-w-md py-3.5 font-semibold rounded-lg transition-all shadow-sm text-center flex items-center justify-center gap-2 ${
            !canSubmit || isLoading
              ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
              : 'bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-slate-200 dark:text-slate-900 dark:hover:bg-white'
          }`}
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white dark:border-slate-900/30 dark:border-t-slate-900 rounded-full animate-spin" />
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Execute Gap Analysis & Match Formula</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
