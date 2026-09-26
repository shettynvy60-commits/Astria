import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle, AlertCircle, X, Sparkles, Compass, Zap } from 'lucide-react';

export default function FileUpload({
  file,
  setFile,
  resumeText,
  setResumeText,
  jobDescription,
  setJobDescription,
  targetRole,
  setTargetRole,
  onAnalyze,
  isLoading
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [inputMode, setInputMode] = useState('upload'); // 'upload' | 'paste'
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      handleFileSelection(droppedFile);
    }
  };

  const handleFileSelection = (selectedFile) => {
    if (!selectedFile) return;
    const validExtensions = ['.pdf', '.txt', '.docx'];
    const fileName = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      alert("Please upload a PDF or plain text resume file.");
      return;
    }
    setFile(selectedFile);
  };

  const clearFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Preset demo options
  const loadPreset = (role) => {
    if (role === 'backend') {
      setTargetRole('Senior Backend Engineer');
      setJobDescription(`We are looking for a Senior Backend Engineer to join our distributed platform team.
Requirements:
- Strong proficiency in Python and FastAPI microservices.
- Experience with PostgreSQL schema design, indexing, and query optimization.
- Familiarity with containerization and orchestration using Docker and Kubernetes.
- Distributed event streaming with Apache Kafka.
- Nice to have: Redis caching, GraphQL, and AWS cloud infrastructure.`);
      setResumeText(`ALEX CHEN
Email: alex.chen@example.com | Phone: (555) 321-9876 | San Francisco, CA
GitHub: https://github.com/alexchen | LinkedIn: https://linkedin.com/in/alexchen

SUMMARY:
Software Engineer with 4 years of experience building asynchronous REST APIs and backend systems.

EXPERIENCE:
Software Engineer | CloudScale Inc (2022 - Present)
- Developed and maintained 12+ high-throughput microservices using FastAPI and Python.
- Designed database migrations and indexed relational tables using MySQL.
- Containerized development and deployment workflows using Docker.
- Implemented in-memory caching solutions using Redis to reduce API latency by 40%.

SKILLS:
Languages: Python, JavaScript, SQL
Frameworks: FastAPI, Flask, Django
Databases: MySQL, SQLite, Redis
DevOps: Docker, Git, CI/CD`);
    } else if (role === 'frontend') {
      setTargetRole('Full Stack Engineer');
      setJobDescription(`Looking for a Full Stack Engineer to lead our next-generation web application.
Requirements:
- Extensive production experience with React and Tailwind CSS.
- Modern TypeScript development and state management.
- Backend API integration with Node.js and PostgreSQL.
- Experience with CI/CD automation and Docker.
- Bonus: Next.js SSR and GraphQL.`);
      setResumeText(`JORDAN TAYLOR
Email: jordan.taylor@example.com | Phone: (555) 789-0123
GitHub: https://github.com/jordant

SUMMARY:
Frontend Engineer with 3 years building responsive web interfaces in React and Vue.js.

EXPERIENCE:
Frontend Developer | WebWorks (2023 - Present)
- Built interactive customer dashboards using React, JavaScript, and Tailwind CSS.
- Transitioned legacy UI components from Vue to React.
- Integrated REST APIs with backend Node.js endpoints.

SKILLS:
React, Vue.js, JavaScript, Tailwind CSS, HTML5, CSS3, Docker, Git`);
    }
    setInputMode('paste');
  };

  return (
    <div className="space-y-6">
      {/* Preset Demo Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl glass-panel border border-slate-800/80">
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <Sparkles className="w-4 h-4 text-brand-400" />
          <span className="font-semibold text-slate-200">Load Demo Profile:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => loadPreset('backend')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-brand-950/80 text-brand-300 border border-brand-500/40 hover:bg-brand-900/80 transition-all hover:border-brand-400 shadow-sm"
          >
            Backend: Alex Chen (Python / FastAPI / Docker)
          </button>
          <button
            type="button"
            onClick={() => loadPreset('frontend')}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-900/80 transition-all hover:border-cyan-400 shadow-sm"
          >
            Full Stack: Jordan Taylor (React / Tailwind)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Resume Ingestion */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-400" />
                Step 1: Candidate Resume
              </h3>
              <div className="flex bg-slate-950/90 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('upload')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    inputMode === 'upload' ? 'bg-brand-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('paste')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    inputMode === 'paste' ? 'bg-brand-600 text-white font-bold shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {inputMode === 'upload' ? (
              <div>
                {!file ? (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-brand-400 bg-brand-950/40 scale-[1.01]'
                        : 'border-slate-800 hover:border-brand-500/50 hover:bg-slate-900/40'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt,.docx"
                      onChange={(e) => handleFileSelection(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-brand-950/80 border border-brand-500/30 flex items-center justify-center text-brand-400 shadow-md">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200 mb-1">
                      Drag & drop your resume PDF here, or <span className="text-brand-400 underline underline-offset-2">browse</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Supports PDF, TXT • Zero Cloud Leak: Presidio PII redaction runs locally
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-brand-500/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-brand-950/80 border border-brand-500/30 text-brand-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-200 truncate max-w-[220px]">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-400">
                          {(file.size / 1024).toFixed(1)} KB • Ready for privacy scan
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearFile}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your raw resume text here..."
                  rows={8}
                  className="w-full rounded-xl glass-input p-3.5 text-xs text-slate-200 placeholder-slate-500 font-mono resize-none"
                />
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <CheckCircle className="w-4 h-4" /> Presidio & spaCy local sanitization active
            </span>
          </div>
        </div>

        {/* Right: Job Description */}
        <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Step 2: Target Job Description
              </h3>
              <input
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Target Role"
                className="px-3 py-1.5 text-xs rounded-xl glass-input text-slate-200 max-w-[200px]"
              />
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or requirements here..."
              rows={8}
              className="w-full rounded-xl glass-input p-3.5 text-xs text-slate-200 placeholder-slate-500 resize-none font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-800/80 flex justify-end">
            <button
              type="button"
              onClick={onAnalyze}
              disabled={isLoading || (!file && !resumeText.trim()) || !jobDescription.trim()}
              className={`w-full py-3 px-6 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg ${
                isLoading || (!file && !resumeText.trim()) || !jobDescription.trim()
                  ? 'bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-800'
                  : 'bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white glow-brand hover:scale-[1.01]'
              }`}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Running Privacy Scan & Gap Analysis...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Analyze Resume & Calculate Deterministic Score</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
