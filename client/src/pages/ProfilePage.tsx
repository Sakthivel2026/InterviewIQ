import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ResumeUpload } from '../components/ResumeUpload';
import { CandidateProfileCard } from '../components/CandidateProfileCard';
import { apiFetch, deleteResume, ResumeRecord } from '../services/api';
import { User, FileText, Upload, Shield, LogOut, CheckCircle2, Loader2, Trash2, AlertTriangle, X } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [resumes, setResumes] = useState<ResumeRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showUpload, setShowUpload] = useState<boolean>(false);
  const [profileToDelete, setProfileToDelete] = useState<ResumeRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchResumes = async () => {
    try {
      const res = await apiFetch('/resumes');
      if (res.ok) {
        const data = await res.json();
        setResumes(data.resumes || []);
      }
    } catch (err) {
      console.error('Failed to load resumes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResumes();
  }, []);

  const handleUploadSuccess = (newResume: ResumeRecord) => {
    setResumes((prev) => [newResume, ...prev]);
    setShowUpload(false);
  };

  const handleConfirmDelete = async () => {
    if (!profileToDelete) return;
    setIsDeleting(true);
    setDeleteError(null);

    try {
      const res = await deleteResume(profileToDelete.id);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete profile');
      }

      setResumes((prev) => prev.filter((r) => r.id !== profileToDelete.id));
      setProfileToDelete(null);
    } catch (err: any) {
      console.error('Delete profile error:', err);
      setDeleteError(err.message || 'Failed to delete candidate profile. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 pb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header Info Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[2px] shadow-lg shadow-indigo-500/25">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center font-bold text-xl text-white font-['Outfit']">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : user?.email ? user.email.slice(0, 2).toUpperCase() : ''}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white font-['Outfit']">{user?.name || user?.email || ''}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 text-[11px] font-mono border border-indigo-500/20">
              Verified Candidate Account
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> {showUpload ? 'Close Upload' : 'Upload New Resume'}
          </button>
          <button
            onClick={logout}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 font-semibold text-xs border border-slate-700 transition flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>

      {/* Upload Toggle Box */}
      {showUpload && (
        <div className="transition-all duration-300">
          <ResumeUpload onSuccess={handleUploadSuccess} />
        </div>
      )}

      {/* Resumes / Candidate Profiles Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white font-['Outfit'] flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" /> Candidate Profiles ({resumes.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 glass-card rounded-2xl">
            <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
          </div>
        ) : resumes.length > 0 ? (
          <div className="space-y-6">
            {resumes.map((resRecord) => (
              <CandidateProfileCard
                key={resRecord.id}
                parsed={resRecord.parsed}
                uploadedAt={resRecord.uploadedAt}
                onDelete={() => {
                  setDeleteError(null);
                  setProfileToDelete(resRecord);
                }}
              />
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-2xl p-12 text-center border border-slate-800 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-indigo-400">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">No Resume Uploaded Yet</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Upload a PDF/DOCX resume or paste your text resume to let Claude AI parse your tech stack, skills, and experience level.
              </p>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 transition inline-flex items-center gap-2"
            >
              Upload Resume Now
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {profileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-md w-full rounded-2xl p-6 border border-slate-700/80 shadow-2xl space-y-5 text-left relative animate-in fade-in zoom-in-95">
            <button
              onClick={() => {
                if (!isDeleting) {
                  setProfileToDelete(null);
                  setDeleteError(null);
                }
              }}
              disabled={isDeleting}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">Delete Candidate Profile</h3>
                <p className="text-xs text-slate-400">Confirm permanent deletion</p>
              </div>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Are you sure you want to delete this profile? This action cannot be undone.
            </p>

            {deleteError && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{deleteError}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setProfileToDelete(null);
                  setDeleteError(null);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition border border-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
