import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { JdUploadAndMatch, SkillMatchResult, JdRecord } from '../components/JdUploadAndMatch';
import { CandidateProfileCard } from '../components/CandidateProfileCard';
import { apiFetch, ResumeRecord } from '../services/api';
import {
  Mic,
  Bot,
  Sparkles,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  FileText,
  Target,
  HelpCircle,
  Loader2,
  Zap,
} from 'lucide-react';

export const InterviewSetupWizardPage: React.FC = () => {
  const navigate = useNavigate();

  // Step control: 1 = Resume & JD, 2 = Config, 3 = Question Preview
  const [step, setStep] = useState<number>(1);

  // User Resumes state
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [selectedResume, setSelectedResume] = useState<ResumeRecord | null>(null);
  const [loadingResumes, setLoadingResumes] = useState<boolean>(true);

  // Target JD state
  const [selectedJd, setSelectedJd] = useState<JdRecord | null>(null);
  const [matchAnalysis, setMatchAnalysis] = useState<SkillMatchResult | null>(null);

  // Config parameters
  const [role, setRole] = useState<string>('Senior Software Engineer');
  const [experienceLevel, setExperienceLevel] = useState<'entry' | 'mid' | 'senior' | 'lead'>('senior');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard' | 'faang'>('hard');
  const [interviewType, setInterviewType] = useState<'technical' | 'behavioral' | 'system-design' | 'mixed'>('technical');

  // Generated Questions state
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInterview, setCreatedInterview] = useState<any | null>(null);

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const res = await apiFetch('/resumes');
        if (res.ok) {
          const data = await res.json();
          const list: ResumeRecord[] = data.resumes || [];
          setResumes(list);
          if (list.length > 0) {
            setSelectedResume(list[0]);
            if (list[0].parsed?.experienceLevel) {
              setExperienceLevel(list[0].parsed.experienceLevel);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load user resumes:', err);
      } finally {
        setLoadingResumes(false);
      }
    };
    fetchResumes();
  }, []);

  const handleJdParsed = (jd: JdRecord, match?: SkillMatchResult) => {
    setSelectedJd(jd);
    if (jd.parsed?.roleTitle) {
      setRole(jd.parsed.roleTitle);
    }
    if (match) {
      setMatchAnalysis(match);
    }
  };

  const handleGenerateQuestions = async () => {
    setError(null);
    setGenerating(true);

    try {
      const res = await apiFetch('/interviews/create', {
        method: 'POST',
        body: JSON.stringify({
          role,
          experienceLevel,
          difficulty,
          interviewType,
          resumeId: selectedResume?.id,
          jdId: selectedJd?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to generate questions.');
      }

      setCreatedInterview(data.interview);
      setStep(3);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating questions.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono border border-indigo-500/30">
              SETUP WIZARD
            </span>
            <span className="text-slate-400 text-xs font-mono">Claude Sonnet AI 4.6</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white font-['Outfit']">Configure AI Voice Interview</h1>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-2 rounded-xl border border-slate-800 text-xs font-semibold">
          <span className={`px-3 py-1 rounded-lg ${step === 1 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            1. Resume & JD
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`px-3 py-1 rounded-lg ${step === 2 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            2. Parameters
          </span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
          <span className={`px-3 py-1 rounded-lg ${step === 3 ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>
            3. AI Questions
          </span>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* STEP 1: Select Resume & Target JD */}
      {step === 1 && (
        <div className="space-y-8">
          {/* Resume Selection Section */}
          <div className="glass-card rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" /> 1. Select Candidate Profile / Resume
              </h3>
              <button
                onClick={() => navigate('/profile')}
                className="text-xs text-indigo-400 hover:underline font-semibold"
              >
                + Upload New Resume
              </button>
            </div>

            {loadingResumes ? (
              <div className="py-6 text-center text-slate-400 text-xs">Loading resumes...</div>
            ) : resumes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {resumes.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedResume(r)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedResume?.id === r.id
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-500/20'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-white text-sm">{r.parsed.name}</span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30 uppercase">
                        {r.parsed.experienceLevel}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">{r.parsed.summary}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400">
                No resumes found. <button onClick={() => navigate('/profile')} className="text-indigo-400 underline">Upload a resume</button> to unlock personalized AI questions.
              </div>
            )}
          </div>

          {/* Target JD Section */}
          <JdUploadAndMatch selectedResume={selectedResume} onJdParsed={handleJdParsed} />

          {/* Action Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              className="px-8 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2"
            >
              Continue to Interview Parameters <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Configure Parameters */}
      {step === 2 && (
        <div className="glass-card rounded-2xl p-8 border border-slate-700/80 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">2. Configure Interview Parameters</h3>
              <p className="text-xs text-slate-400">Tailor the difficulty, interview style, and target role level</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Target Role Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Target Role Title
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="e.g. Senior Full-Stack Engineer"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Experience Level
              </label>
              <select
                value={experienceLevel}
                onChange={(e: any) => setExperienceLevel(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="entry">Entry Level (0 - 2 years)</option>
                <option value="mid">Mid Level (2 - 5 years)</option>
                <option value="senior">Senior Level (5 - 8 years)</option>
                <option value="lead">Staff / Lead Level (8+ years)</option>
              </select>
            </div>

            {/* Difficulty */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Question Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e: any) => setDifficulty(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="easy">Easy (Fundamentals & Core Syntax)</option>
                <option value="medium">Medium (Standard Industry Rigor)</option>
                <option value="hard">Hard (Deep Architecture & Edge Cases)</option>
                <option value="faang">FAANG / Big Tech Level (Extreme Rigor)</option>
              </select>
            </div>

            {/* Interview Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Interview Type
              </label>
              <select
                value={interviewType}
                onChange={(e: any) => setInterviewType(e.target.value)}
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              >
                <option value="technical">Technical Deep Dive</option>
                <option value="system-design">System Design & Architecture</option>
                <option value="behavioral">Behavioral & Leadership STAR</option>
                <option value="mixed">Mixed Comprehensive Round</option>
              </select>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-800">
            <button
              onClick={() => setStep(1)}
              className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold hover:bg-slate-700"
            >
              Back to Step 1
            </button>
            <button
              onClick={handleGenerateQuestions}
              disabled={generating}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-xl shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-mono">Claude AI Generating Personalized Questions...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Generate 8–10 AI Questions
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Preview Questions & Start Interview */}
      {step === 3 && createdInterview && (
        <div className="glass-card rounded-2xl p-8 border border-slate-700/80 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">Questions Generated Successfully</h3>
                <p className="text-xs text-slate-400">
                  {createdInterview.questions?.length || 8} personalized questions created for {createdInterview.role}
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/interview/studio')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 transition flex items-center gap-2"
            >
              <Mic className="w-4 h-4" /> Launch Voice Interview Studio
            </button>
          </div>

          {/* Questions List */}
          <div className="space-y-3">
            {createdInterview.questions?.map((q: any, idx: number) => (
              <div key={q.id || idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-indigo-400">Question {idx + 1} of {createdInterview.questions.length}</span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-mono border border-indigo-500/20 uppercase">
                    {q.questionType}
                  </span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-medium">{q.questionText}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
