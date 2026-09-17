import React, { useState } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { apiFetch, ResumeRecord } from '../services/api';

interface ResumeUploadProps {
  onSuccess?: (resume: ResumeRecord) => void;
}

export const ResumeUpload: React.FC<ResumeUploadProps> = ({ onSuccess }) => {
  const [activeTab, setActiveTab] = useState<'file' | 'text'>('file');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        setError('File size exceeds maximum 5MB limit.');
        return;
      }
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const formData = new FormData();
      if (activeTab === 'file') {
        if (!selectedFile) {
          setError('Please select a resume file (.pdf, .docx, .txt).');
          setLoading(false);
          return;
        }
        formData.append('resumeFile', selectedFile);
      } else {
        if (!rawText.trim() || rawText.trim().length < 20) {
          setError('Please paste complete resume content (min 20 characters).');
          setLoading(false);
          return;
        }
        formData.append('rawText', rawText);
      }

      const res = await apiFetch('/resumes/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to parse resume.');
      }

      if (onSuccess) {
        onSuccess(data.resume);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while parsing resume.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6 border border-slate-700/80 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Upload className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-['Outfit']">Upload Candidate Resume</h3>
            <p className="text-xs text-slate-400">Claude AI parses skills, experience & tech stack automatically</p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`px-3 py-1 rounded-md transition ${activeTab === 'file' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1 rounded-md transition ${activeTab === 'text' ? 'bg-indigo-600 text-white font-semibold' : 'text-slate-400 hover:text-white'}`}
          >
            Paste Text
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {activeTab === 'file' ? (
          <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-2xl p-8 text-center bg-slate-900/40 transition">
            <input
              type="file"
              id="resume-file-input"
              accept=".pdf,.docx,.doc,.txt"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="resume-file-input" className="cursor-pointer block">
              <FileText className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
              {selectedFile ? (
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-emerald-400 flex items-center justify-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> {selectedFile.name}
                  </div>
                  <div className="text-xs text-slate-500">{(selectedFile.size / 1024).toFixed(1)} KB — Click to change file</div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-200">Click to browse or drop PDF / DOCX file</div>
                  <div className="text-xs text-slate-500">Maximum file size: 5MB</div>
                </div>
              )}
            </label>
          </div>
        ) : (
          <div>
            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste raw text resume here..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="font-mono">Claude AI Extracting Skills & Tech Stack...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" /> Parse Candidate Profile with AI
            </>
          )}
        </button>
      </form>
    </div>
  );
};
