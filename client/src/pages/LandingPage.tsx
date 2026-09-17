import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  Bot,
  Mic,
  FileText,
  Target,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Zap,
  Activity,
  Award,
  ChevronRight,
  Cpu,
} from 'lucide-react';

interface HealthData {
  status: string;
  system: string;
  version: string;
  timestamp: string;
  environment: string;
}

export const LandingPage: React.FC = () => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/v1/health')
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        return res.json();
      })
      .then((data) => setHealth(data))
      .catch((err) => setHealthError(err.message));
  }, []);

  return (
    <div className="relative overflow-hidden pt-28 pb-20">
      {/* Background Animated Lights */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-cyan-400/20 blur-[120px] rounded-full pointer-events-none -z-10 animate-blob-1" />
      <div className="absolute top-80 -left-40 w-[500px] h-[500px] bg-indigo-900/20 blur-[140px] rounded-full pointer-events-none -z-10 animate-blob-2" />

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        <div className="text-center max-w-4xl mx-auto">
          {/* System API Live Status Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-xs mb-8 shadow-xl backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-medium">Express API v1:</span>
            {health ? (
              <span className="text-emerald-400 font-mono font-semibold">{health.status.toUpperCase()} ({health.environment})</span>
            ) : healthError ? (
              <span className="text-amber-400 font-mono">CONNECTING...</span>
            ) : (
              <span className="text-slate-400 font-mono">PINGING SERVER...</span>
            )}
            <span className="text-slate-600">|</span>
            <span className="text-indigo-400 font-semibold flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> Anthropic Claude Sonnet 4.6
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6 leading-[1.15] font-['Outfit']">
            Ace Your Next Interview with <br />
            <span className="gradient-text">Real-Time Voice AI Simulation</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed font-normal">
            Upload your resume & target job description. Experience voice-based mock interviews customized to your background, get instant multi-dimensional evaluation, and boost your readiness.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/interview/setup"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group"
            >
              Start Free Mock Interview
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/dashboard"
              className="w-full sm:w-auto px-7 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 text-slate-200 font-semibold text-base transition-all flex items-center justify-center gap-2 hover:border-slate-600"
            >
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              View Sample Reports
            </Link>
          </div>

          {/* Platform Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl glass-panel border border-slate-800">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white font-['Outfit']">8-10</div>
              <div className="text-xs text-slate-400 mt-1">Adaptive Questions</div>
            </div>
            <div className="text-center border-l border-slate-800">
              <div className="text-2xl sm:text-3xl font-bold gradient-text-gold font-['Outfit']">5 Rubrics</div>
              <div className="text-xs text-slate-400 mt-1">Multi-Dimension Scoring</div>
            </div>
            <div className="text-center border-l border-slate-800">
              <div className="text-2xl sm:text-3xl font-bold text-cyan-400 font-['Outfit']">&lt; 2s</div>
              <div className="text-xs text-slate-400 mt-1">Real-time STT / TTS</div>
            </div>
            <div className="text-center border-l border-slate-800">
              <div className="text-2xl sm:text-3xl font-bold text-indigo-400 font-['Outfit']">100%</div>
              <div className="text-xs text-slate-400 mt-1">Structured JSON AI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive AI Preview Card */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-slate-700/60 shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-xs font-mono text-slate-400 ml-2">InterviewIQ Voice Studio — Live Interactive Preview</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono border border-indigo-500/30">
              LIVE SIMULATOR
            </span>
          </div>

          {/* Simulated Dialogue */}
          <div className="space-y-4 font-sans text-sm">
            {/* AI Question */}
            <div className="flex items-start gap-4 bg-indigo-950/40 p-4 rounded-xl border border-indigo-900/50">
              <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-indigo-300 text-xs">AI INTERVIEWER (Claude 3.5 Sonnet)</span>
                  <span className="text-[10px] text-slate-500">Question 3 of 8</span>
                </div>
                <p className="text-slate-200 leading-relaxed font-medium">
                  "In your resume, you listed experience optimizing PostgreSQL query performance. Can you walk me through a specific scenario where you diagnosed a slow query under heavy load and how you restructured indexes or queries to fix it?"
                </p>
              </div>
            </div>

            {/* Candidate Voice Answer */}
            <div className="flex items-start gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 ml-6">
              <div className="w-9 h-9 rounded-lg bg-cyan-600 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-cyan-300 text-xs">YOU (Candidate Audio Transcript)</span>
                  <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Speech Recognition Active
                  </span>
                </div>
                <p className="text-slate-300 leading-relaxed">
                  "At my previous startup, our analytics endpoint response time spiked above 4 seconds during peak hours. I used `EXPLAIN ANALYZE` to identify a missing composite index on `(user_id, created_at)` during heavy pagination..."
                </p>
              </div>
            </div>

            {/* Instant AI Evaluation pill preview */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-400">Score Breakdown:</div>
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">Technical: 92/100</span>
                  <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 text-xs font-semibold border border-indigo-500/20">Clarity: 88/100</span>
                  <span className="px-2.5 py-1 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-semibold border border-cyan-500/20">Relevance: 95/100</span>
                </div>
              </div>
              <span className="text-xs text-indigo-300 flex items-center gap-1 font-semibold">
                Adaptive Follow-up Ready <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Grid */}
      <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-['Outfit']">
            Engineered for High-Stakes Technical Preparation
          </h2>
          <p className="text-slate-400 text-base">
            Everything you need to transform interview anxiety into confident, offer-winning performance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-5 text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Resume & JD Parser</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Extracts tech stacks, projects, leadership signals, and skill gap metrics directly from your resume and targeted job postings.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> PDF & DOCX document parsing</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-indigo-400" /> Skill match compatibility %</li>
            </ul>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center mb-5 text-cyan-400">
              <Mic className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Voice Interview Studio</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Speak naturally into your microphone. Web Speech API converts your speech into real-time transcriptions while the AI reads questions aloud.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Text-to-Speech & Speech-to-Text</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-400" /> Adaptive AI follow-up probes</li>
            </ul>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800">
            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center mb-5 text-purple-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Multi-Dimensional Analytics</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-4">
              Receive actionable feedback on technical precision, clarity, communication, and completeness with historical progress charts.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Readiness score & topic plans</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-400" /> Performance progression line charts</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
