import React, { useState } from 'react';
import { Target, FileText, CheckCircle2, AlertTriangle, Sparkles, Loader2, BarChart2 } from 'lucide-react';
import { apiFetch, ResumeRecord } from '../services/api';

export interface SkillMatchResult {
  matchPercentage: number;
  matchingSkills: string[];
  missingSkills: string[];
  preferredMatches: string[];
  experienceMatchScore: number;
  summaryFeedback: string;
}

export interface JdRecord {
  id: string;
  createdAt: string;
  parsed: {
    roleTitle: string;
    company: string;
    experienceLevel: string;
    summary: string;
    requiredSkills: string[];
    preferredSkills: string[];
    tech: string[];
  };
}

interface JdUploadAndMatchProps {
  selectedResume: ResumeRecord | null;
  onJdParsed?: (jd: JdRecord, matchAnalysis?: SkillMatchResult) => void;
}

export const JdUploadAndMatch: React.FC<JdUploadAndMatchProps> = ({ selectedResume, onJdParsed }) => {
  const [jdText, setJdText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJd, setCurrentJd] = useState<JdRecord | null>(null);
  const [matchResult, setMatchResult] = useState<SkillMatchResult | null>(null);

  const handleParseAndMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim() || jdText.trim().length < 20) {
      setError('Please paste complete job description content (min 20 characters).');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // 1. Parse JD
      const parseRes = await apiFetch('/jds/parse', {
        method: 'POST',
        body: JSON.stringify({ rawText: jdText }),
      });
      const parseData = await parseRes.json();

      if (!parseRes.ok) {
        throw new Error(parseData.message || 'Failed to parse Job Description.');
      }

      const parsedJdRecord: JdRecord = parseData.jd;
      setCurrentJd(parsedJdRecord);

      let computedMatch: SkillMatchResult | undefined = undefined;

      // 2. If resume selected, compute skill match vs resume
      if (selectedResume) {
        const matchRes = await apiFetch('/jds/match', {
          method: 'POST',
          body: JSON.stringify({ resumeId: selectedResume.id, jdId: parsedJdRecord.id }),
        });
        if (matchRes.ok) {
          const matchData = await matchRes.json();
          computedMatch = matchData.matchAnalysis;
          setMatchResult(computedMatch || null);
        }
      }

      if (onJdParsed) {
        onJdParsed(parsedJdRecord, computedMatch);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while analyzing job description.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-6">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
        <div className="w-10 h-10 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Target className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white font-['Outfit']">Target Job Description & Skill Match</h3>
          <p className="text-xs text-slate-400">Paste job post requirements to calculate match score & skill gaps</p>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleParseAndMatch} className="space-y-4">
        <div>
          <textarea
            rows={5}
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
            placeholder="Paste raw target job description (role title, required skills, responsibilities, tech stack)..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-cyan-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-mono">Analyzing JD & Computing Skill Match...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Analyze JD & Compute Match Percentage
            </>
          )}
        </button>
      </form>

      {/* Match Results Visualizer UI */}
      {matchResult && (
        <div className="p-5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Candidate Match Compatibility</div>
              <div className="text-2xl font-bold text-white font-['Outfit'] mt-0.5">
                {currentJd?.parsed.roleTitle || 'Target Role'}
              </div>
            </div>

            {/* Radial progress score badge */}
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950 border border-indigo-500/40 flex flex-col items-center justify-center">
                <span className="text-xl font-extrabold text-cyan-400 font-['Outfit']">{matchResult.matchPercentage}%</span>
                <span className="text-[9px] text-slate-400 uppercase font-mono">MATCH</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            {matchResult.summaryFeedback}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Matching Skills */}
            <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
              <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Matching Skills ({matchResult.matchingSkills.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.matchingSkills.map((sk, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/20 font-mono">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            {/* Missing Skills */}
            <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-900/40">
              <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Missing / Gap Skills ({matchResult.missingSkills.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {matchResult.missingSkills.length > 0 ? (
                  matchResult.missingSkills.map((sk, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-xs border border-amber-500/20 font-mono">
                      {sk}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500">No major skill gaps identified!</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
