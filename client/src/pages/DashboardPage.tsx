import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { LayoutDashboard, Plus, History, Award, TrendingUp, Mic, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const DashboardPage: React.FC = () => {
  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInterviews = async () => {
      try {
        const res = await apiFetch('/interviews');
        if (res.ok) {
          const data = await res.json();
          setInterviews(data.interviews || []);
        }
      } catch (err) {
        console.error('Failed to fetch interviews for dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchInterviews();
  }, []);

  const totalSessions = interviews.length;

  const scoredInterviews = interviews.filter((i) => i.overallScore !== null && i.overallScore !== undefined);
  const avgScore = scoredInterviews.length
    ? Math.round(scoredInterviews.reduce((sum, i) => sum + (i.overallScore || 0), 0) / scoredInterviews.length)
    : 0;

  const readinessInterviews = interviews.filter((i) => i.readinessPercent !== null && i.readinessPercent !== undefined);
  const avgReadiness = readinessInterviews.length
    ? Math.round(readinessInterviews.reduce((sum, i) => sum + (i.readinessPercent || 0), 0) / readinessInterviews.length)
    : 0;

  // Chart data for score progression over time
  const chartData = [...interviews]
    .reverse()
    .map((i, idx) => ({
      name: `Session ${idx + 1}`,
      score: i.overallScore ?? 0,
      readiness: i.readinessPercent ?? 0,
      role: i.role,
    }));

  return (
    <div className="min-h-screen pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white font-['Outfit']">Interview Analytics & History</h1>
          <p className="text-slate-400 text-sm mt-1">Track your score progression and review AI interview feedback.</p>
        </div>
        <Link
          to="/interview/setup"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition"
        >
          <Plus className="w-4 h-4" /> Start New Interview
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Total Practice Sessions</div>
          <div className="text-3xl font-bold text-white font-['Outfit']">{loading ? '...' : totalSessions}</div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> Practice active
          </div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Average Score</div>
          <div className="text-3xl font-bold text-indigo-400 font-['Outfit']">{loading ? '...' : `${avgScore} / 100`}</div>
          <div className="text-xs text-slate-400 mt-2">Top candidate score benchmark</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Overall Readiness</div>
          <div className="text-3xl font-bold text-cyan-400 font-['Outfit']">{loading ? '...' : `${avgReadiness}%`}</div>
          <div className="text-xs text-slate-400 mt-2">Target Role Job Readiness</div>
        </div>
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="text-slate-400 text-xs uppercase tracking-wider mb-2 font-semibold">Primary Focus Area</div>
          <div className="text-xl font-bold text-amber-400 font-['Outfit'] truncate">Distributed Systems</div>
          <div className="text-xs text-slate-400 mt-2">Recommended for next practice</div>
        </div>
      </div>

      {/* Recharts Score Progression Over Time Line Chart */}
      {chartData.length > 0 && (
        <div className="glass-card rounded-2xl border border-slate-800 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-400" /> Candidate Score Progression Over Time
            </h2>
            <span className="text-xs text-indigo-300 font-mono">Live Session Data</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', color: '#fff' }}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ r: 5, fill: '#6366f1' }} activeDot={{ r: 8 }} />
                <Line type="monotone" dataKey="readiness" stroke="#06b6d4" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 4, fill: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Mock Interview History Table */}
      <div className="glass-card rounded-2xl border border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" /> Recent Mock Interviews
          </h2>
          <span className="text-xs text-slate-400">{interviews.length} Sessions Total</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-400" />
            Loading mock interview history...
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-8 text-center text-slate-400 space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto" />
            <p className="text-sm">No practice sessions completed yet.</p>
            <Link
              to="/interview/setup"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold"
            >
              Start Your First Mock Interview
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Role & Level</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Difficulty</th>
                  <th className="py-3 px-4">Overall Score</th>
                  <th className="py-3 px-4">Readiness</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {interviews.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-4 font-semibold text-white">
                      {item.role}
                      <span className="block text-[11px] text-slate-400 font-normal uppercase">{item.experienceLevel}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20">
                        {item.interviewType}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-mono text-xs uppercase text-slate-400">{item.difficulty}</td>
                    <td className="py-4 px-4 font-bold text-emerald-400">
                      {item.overallScore ? `${item.overallScore}/100` : 'In Progress'}
                    </td>
                    <td className="py-4 px-4 font-bold text-cyan-400">
                      {item.readinessPercent ? `${item.readinessPercent}%` : '-'}
                    </td>
                    <td className="py-4 px-4 text-xs text-slate-400">
                      {new Date(item.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <Link
                        to={`/interview/report/${item.id}`}
                        className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1 bg-indigo-950/60 border border-indigo-800/60 px-3 py-1.5 rounded-xl transition"
                      >
                        View Report <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
export default DashboardPage;
