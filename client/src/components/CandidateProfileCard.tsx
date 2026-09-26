import React from 'react';
import { ParsedResume } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { User, Award, Code, Cpu, Wrench, GraduationCap, Briefcase, FolderGit2, CheckCircle, Trash2 } from 'lucide-react';

interface CandidateProfileCardProps {
  parsed: ParsedResume;
  uploadedAt?: string;
  onDelete?: () => void;
}

export const CandidateProfileCard: React.FC<CandidateProfileCardProps> = ({ parsed, uploadedAt, onDelete }) => {
  const { user } = useAuth();

  const getLevelBadgeClass = (level?: string) => {
    switch (level?.toLowerCase()) {
      case 'lead':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'senior':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'mid':
        return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30';
      case 'entry':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const rawName = parsed?.name && parsed.name.trim() !== '' && parsed.name !== 'Sarah Connor' ? parsed.name.trim() : '';
  const displayName = rawName || user?.name || user?.email || '';
  const displayEmail = (parsed?.email && parsed.email !== 'sarah.connor@example.com') ? parsed.email : user?.email;
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : '';

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-6">
      {/* Header Profile Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-4">
          {initials && (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 p-[2px] shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-lg text-white font-['Outfit']">
                {initials}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              {displayName && <h3 className="text-xl font-bold text-white font-['Outfit']">{displayName}</h3>}
              {parsed?.experienceLevel && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getLevelBadgeClass(parsed.experienceLevel)}`}>
                  {parsed.experienceLevel} Level
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {displayEmail && <span>{displayEmail}</span>}
              {displayEmail && uploadedAt && <span> • </span>}
              {uploadedAt && <span>Parsed {new Date(uploadedAt).toLocaleDateString()}</span>}
            </p>
          </div>
        </div>

        {onDelete && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={onDelete}
              title="Delete Profile"
              className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-rose-950/60 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-400 transition-all shadow-sm group"
              aria-label="Delete Profile"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          </div>
        )}
      </div>

      {/* Professional Summary */}
      {parsed?.summary && parsed.summary.trim() !== '' && (
        <div className="bg-slate-900/60 p-4 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed">
          <span className="font-semibold text-indigo-400 block mb-1 uppercase tracking-wider">Executive Summary</span>
          {parsed.summary}
        </div>
      )}

      {/* Categorized Skills Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Code className="w-4 h-4 text-indigo-400" /> Extracted Skill Ecosystem
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Languages */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-[11px] font-semibold text-indigo-300 mb-2 flex items-center gap-1">
              <Code className="w-3.5 h-3.5 text-indigo-400" /> Languages
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parsed?.languages && parsed.languages.length > 0 ? (
                parsed.languages.map((item, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-xs border border-indigo-500/20 font-mono">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No languages added yet</span>
              )}
            </div>
          </div>

          {/* Frameworks */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-[11px] font-semibold text-cyan-300 mb-2 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Frameworks
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parsed?.frameworks && parsed.frameworks.length > 0 ? (
                parsed.frameworks.map((item, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-300 text-xs border border-cyan-500/20 font-mono">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No frameworks added yet</span>
              )}
            </div>
          </div>

          {/* Tools & Databases */}
          <div className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800">
            <div className="text-[11px] font-semibold text-purple-300 mb-2 flex items-center gap-1">
              <Wrench className="w-3.5 h-3.5 text-purple-400" /> Tools & Databases
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parsed?.tools && parsed.tools.length > 0 ? (
                parsed.tools.map((item, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 text-xs border border-purple-500/20 font-mono">
                    {item}
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500">No tools or databases added yet</span>
              )}
            </div>
          </div>
        </div>

        {/* General Skills */}
        {parsed?.skills && parsed.skills.length > 0 && (
          <div className="pt-2">
            <div className="text-[11px] font-semibold text-emerald-300 mb-1.5 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" /> General Skills
            </div>
            <div className="flex flex-wrap gap-1.5">
              {parsed.skills.map((item, idx) => (
                <span key={idx} className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 text-xs border border-emerald-500/20 font-mono">
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Experience & Education / Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Experience Timeline */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Briefcase className="w-4 h-4 text-emerald-400" /> Key Experience
          </h4>
          {parsed?.experience && parsed.experience.length > 0 ? (
            <div className="space-y-3">
              {parsed.experience.map((exp, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-white text-xs">{exp.role}</span>
                    {exp.duration && <span className="text-[10px] text-slate-500 font-mono">{exp.duration}</span>}
                  </div>
                  {exp.company && <div className="text-xs text-emerald-400 mt-0.5">{exp.company}</div>}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <ul className="mt-2 space-y-1 text-[11px] text-slate-400 list-disc list-inside">
                      {exp.highlights.slice(0, 3).map((h, i) => (
                        <li key={i} className="truncate">{h}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
              No experience entries added yet
            </div>
          )}
        </div>

        {/* Projects & Certifications */}
        <div>
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <FolderGit2 className="w-4 h-4 text-amber-400" /> Featured Projects & Certifications
          </h4>
          <div className="space-y-3">
            {parsed?.projects && parsed.projects.length > 0 ? (
              parsed.projects.map((proj, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
                  <div className="font-semibold text-white text-xs">{proj.title}</div>
                  {proj.description && <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-2">{proj.description}</p>}
                  {proj.techStack && proj.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {proj.techStack.map((tech, i) => (
                        <span key={i} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-800 text-amber-300 font-mono">
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : null}

            {parsed?.certifications && parsed.certifications.length > 0 ? (
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1.5">
                <div className="text-[11px] font-semibold text-amber-300 flex items-center gap-1">
                  <Award className="w-3.5 h-3.5 text-amber-400" /> Certifications
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.certifications.map((cert, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 text-xs border border-amber-500/20 font-mono">
                      {cert}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {(!parsed?.projects || parsed.projects.length === 0) && (!parsed?.certifications || parsed.certifications.length === 0) && (
              <div className="text-xs text-slate-500 bg-slate-900/30 p-3 rounded-xl border border-slate-800/50">
                No projects or certifications added yet
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Education */}
      {parsed?.education && parsed.education.length > 0 && (
        <div className="pt-2 border-t border-slate-800/60">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4 text-cyan-400" /> Education
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {parsed.education.map((edu, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80 flex justify-between items-center">
                <div>
                  <div className="font-semibold text-white text-xs">{edu.degree}</div>
                  {edu.institution && <div className="text-xs text-cyan-400 mt-0.5">{edu.institution}</div>}
                </div>
                {edu.year && <span className="text-[10px] text-slate-500 font-mono">{edu.year}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

