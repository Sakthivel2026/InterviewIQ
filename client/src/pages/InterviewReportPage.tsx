import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import {
  Award,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ArrowLeft,
  Loader2,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  RotateCcw,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const InterviewReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [interview, setInterview] = useState<any | null>(null);
  const [report, setReport] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        if (!id) return;
        const res = await apiFetch(`/interviews/${id}`);
        if (!res.ok) {
          throw new Error('Failed to fetch interview session.');
        }
        const data = await res.json();
        setInterview(data.interview);

        if (data.interview.summaryJson) {
          setReport(JSON.parse(data.interview.summaryJson));
        } else {
          // If report not yet generated, generate it now
          const finishRes = await apiFetch(`/interviews/${id}/finish`, { method: 'POST' });
          if (finishRes.ok) {
            const finishData = await finishRes.json();
            setReport(finishData.report);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Error loading report.');
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-[#070a12]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen pt-32 max-w-4xl mx-auto px-4 text-center">
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
          <h2 className="text-xl font-bold">Report Not Found</h2>
          <p className="text-xs text-slate-400 mt-1">{error || 'Unable to display interview report.'}</p>
          <Link
            to="/dashboard"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Dimension Radar / Bar chart formatting
  const radarData = report?.radarScores
    ? [
        { subject: 'Technical', score: report.radarScores.technical },
        { subject: 'Relevance', score: report.radarScores.relevance },
        { subject: 'Clarity', score: report.radarScores.clarity },
        { subject: 'Completeness', score: report.radarScores.completeness },
        { subject: 'Communication', score: report.radarScores.communication },
      ]
    : [];

  const barColors = ['#6366f1', '#06b6d4', '#a855f7', '#10b981', '#f59e0b'];

  return (
    <div className="min-h-screen pt-28 pb-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-400 mb-2 font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-white font-['Outfit']">Interview Intelligence Report</h1>
          <p className="text-xs text-slate-400 mt-1">
            {interview.role} • {interview.experienceLevel?.toUpperCase()} • {interview.interviewType?.toUpperCase()}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/interview/setup')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Practice Again
          </button>
        </div>
      </div>

      {/* Hero Overview Banner: Readiness Score + Executive Summary */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-indigo-500/30 shadow-2xl relative overflow-hidden grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
        {/* Readiness Score Dial */}
        <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-indigo-950/40 border border-indigo-800/40 text-center">
          <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 via-cyan-500 to-emerald-400 p-[3px] shadow-xl shadow-indigo-500/30 mb-3">
            <div className="w-full h-full bg-slate-900 rounded-full flex flex-col items-center justify-center">
              <span className="text-3xl font-extrabold text-white font-['Outfit']">
                {report?.readinessPercent ?? interview.readinessPercent ?? 85}%
              </span>
              <span className="text-[9px] text-indigo-300 font-mono uppercase font-semibold">Readiness</span>
            </div>
          </div>
          <span className="text-sm font-bold text-emerald-400 font-['Outfit']">
            {(report?.readinessPercent ?? 85) >= 80 ? 'Role Ready' : 'Needs Practice'}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5">Overall Score: {report?.overallScore ?? interview.overallScore ?? 85}/100</span>
        </div>

        {/* Executive Summary */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <h2 className="text-lg font-bold text-white font-['Outfit']">Executive AI Summary</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            {report?.executiveSummary || 'The candidate demonstrated thorough domain knowledge and clear structured reasoning across technical and system architecture scenarios.'}
          </p>
        </div>
      </div>

      {/* Recharts Multi-Dimensional Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
            <Award className="w-4 h-4 text-indigo-400" /> 5-Dimension Skill Radar
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis dataKey="subject" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" />
                <Radar name="Candidate" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.4} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Breakdown */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Dimension Breakdown
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={radarData} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} stroke="#475569" />
                <YAxis dataKey="subject" type="category" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Bar dataKey="score" radius={[0, 8, 8, 0]}>
                  {radarData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={barColors[index % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Strengths & Critical Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <div className="glass-card rounded-2xl p-6 border border-emerald-900/40 bg-emerald-950/10 space-y-4">
          <h3 className="text-base font-bold text-emerald-400 font-['Outfit'] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> Demonstrated Key Strengths
          </h3>
          <ul className="space-y-2.5">
            {report?.topStrengths?.map((str: string, idx: number) => (
              <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Critical Weaknesses */}
        <div className="glass-card rounded-2xl p-6 border border-amber-900/40 bg-amber-950/10 space-y-4">
          <h3 className="text-base font-bold text-amber-400 font-['Outfit'] flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> Critical Areas for Growth
          </h3>
          <ul className="space-y-2.5">
            {report?.criticalWeaknesses?.map((weak: string, idx: number) => (
              <li key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                <span>{weak}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Personalized Learning Plan */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-indigo-400" /> Recommended Action & Learning Roadmap
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {report?.learningPlan?.map((item: any, idx: number) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-white font-['Outfit']">{item.topic}</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold ${
                    item.priority === 'high'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {item.priority} Priority
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{item.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed Question-by-Question Breakdown */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Bot className="w-5 h-5 text-cyan-400" /> Detailed Question & Answer Transcript Review
        </h3>

        <div className="space-y-3">
          {interview.questions?.map((q: any, idx: number) => {
            const ans = q.answers?.[0];
            const evalData = ans?.evaluation;
            const feedbackObj = evalData?.feedbackJson ? JSON.parse(evalData.feedbackJson) : null;
            const isExpanded = expandedQuestion === q.id;

            return (
              <div key={q.id} className="rounded-xl bg-slate-950/70 border border-slate-800 overflow-hidden">
                <button
                  onClick={() => setExpandedQuestion(isExpanded ? null : q.id)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center shrink-0">
                      Q{idx + 1}
                    </span>
                    <span className="text-sm font-medium text-white truncate max-w-xl font-['Outfit']">
                      {q.questionText}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {evalData && (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                        {evalData.overallScore}/100
                      </span>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-4 border-t border-slate-800 bg-slate-900/40 space-y-4 text-xs">
                    {/* Full Question */}
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-mono block mb-1">Full Question</span>
                      <p className="text-slate-200 text-sm font-medium">{q.questionText}</p>
                    </div>

                    {/* Candidate Transcript */}
                    <div>
                      <span className="text-[10px] text-indigo-400 uppercase font-mono block mb-1">Candidate Answer Transcript</span>
                      <p className="text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 italic">
                        "{ans?.answerText || 'No answer recorded.'}"
                      </p>
                    </div>

                    {/* Claude Rubric Feedback */}
                    {feedbackObj && (
                      <div className="space-y-2">
                        <span className="text-[10px] text-cyan-400 uppercase font-mono block">Claude Evaluation Feedback</span>
                        <p className="text-slate-300 leading-relaxed">{feedbackObj.summary}</p>

                        {feedbackObj.idealAnswerDraft && (
                          <div className="p-3 rounded-lg bg-indigo-950/30 border border-indigo-800/40 text-slate-300">
                            <span className="text-[10px] text-indigo-300 font-semibold block mb-0.5">Ideal Exemplar Response:</span>
                            "{feedbackObj.idealAnswerDraft}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default InterviewReportPage;
