import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { speakText, stopSpeech, createSpeechRecognition } from '../utils/speech';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Bot,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Square,
  SkipForward,
  Award,
  Zap,
  RotateCcw,
  Check,
} from 'lucide-react';

export const InterviewStudioPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const interviewId = searchParams.get('id');

  // Interview state
  const [interview, setInterview] = useState<any | null>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Audio & Speech states
  const [isSpeakingTTS, setIsSpeakingTTS] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [transcript, setTranscript] = useState<string>('');
  const recognitionRef = useRef<any>(null);

  // Evaluation & Follow-up states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [followUpBanner, setFollowUpBanner] = useState<string | null>(null);

  // Load Interview & Questions
  useEffect(() => {
    const fetchInterview = async () => {
      try {
        if (!interviewId) {
          // If no specific interview ID in URL, fetch latest user interview
          const listRes = await apiFetch('/interviews');
          if (listRes.ok) {
            const listData = await listRes.json();
            const latest = listData.interviews?.[0];
            if (latest) {
              const fullRes = await apiFetch(`/interviews/${latest.id}`);
              if (fullRes.ok) {
                const fullData = await fullRes.json();
                setInterview(fullData.interview);
                setQuestions(fullData.interview.questions || []);
              }
            }
          }
        } else {
          const fullRes = await apiFetch(`/interviews/${interviewId}`);
          if (fullRes.ok) {
            const fullData = await fullRes.json();
            setInterview(fullData.interview);
            setQuestions(fullData.interview.questions || []);
          }
        }
      } catch (err: any) {
        setError('Failed to load interview session.');
      } finally {
        setLoading(false);
      }
    };
    fetchInterview();
  }, [interviewId]);

  const currentQuestion = questions[currentIndex];

  // Text-To-Speech (TTS) handler
  const handleToggleTTS = () => {
    if (isSpeakingTTS) {
      stopSpeech();
      setIsSpeakingTTS(false);
    } else if (currentQuestion) {
      setIsSpeakingTTS(true);
      speakText(currentQuestion.questionText, () => setIsSpeakingTTS(false));
    }
  };

  // Speech-To-Text (STT) handler
  const toggleRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setTranscript('');
      const rec = createSpeechRecognition((newText) => {
        setTranscript(newText);
      });
      if (rec) {
        recognitionRef.current = rec;
        rec.start();
        setIsRecording(true);
      } else {
        setError('Web Speech API is not supported in this browser. You can type your response below.');
      }
    }
  };

  // Submit Answer & Evaluate
  const handleSubmitAnswer = async () => {
    if (!currentQuestion) return;
    if (!transcript.trim()) {
      setError('Please record or type your answer before submitting.');
      return;
    }

    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
    stopSpeech();

    setError(null);
    setSubmitting(true);
    setFollowUpBanner(null);

    try {
      const res = await apiFetch('/interviews/evaluate-answer', {
        method: 'POST',
        body: JSON.stringify({
          questionId: currentQuestion.id,
          answerText: transcript,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Evaluation failed.');
      }

      setEvaluation(data.evaluation);

      // If an adaptive follow-up was created by Claude, append to question sequence!
      if (data.followUpQuestion) {
        setQuestions((prev) => [...prev, data.followUpQuestion]);
        setFollowUpBanner(
          `AI Interviewer Probe: Applied an adaptive follow-up question ("${data.followUpQuestion.questionText.slice(
            0,
            65
          )}...")`
        );
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer for evaluation.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!interview?.id) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/interviews/${interview.id}/finish`, { method: 'POST' });
      if (res.ok) {
        navigate(`/interview/report/${interview.id}`);
      } else {
        navigate(`/interview/report/${interview.id}`);
      }
    } catch (err) {
      navigate(`/interview/report/${interview.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = () => {
    setEvaluation(null);
    setTranscript('');
    setFollowUpBanner(null);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      handleFinishInterview();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-32 flex items-center justify-center bg-[#070a12]">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-20 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Header Bar */}
      <div className="glass-card rounded-2xl p-6 border border-slate-700/80 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white font-['Outfit']">
              {interview?.role || 'Voice Mock Interview'}
            </h2>
            <p className="text-xs text-slate-400">
              {interview?.experienceLevel?.toUpperCase()} • {interview?.difficulty?.toUpperCase()} • {interview?.interviewType}
            </p>
          </div>
        </div>

        {/* Question Counter Progress */}
        <div className="flex items-center gap-3">
          <span className="px-3.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono font-semibold border border-indigo-500/30">
            Question {currentIndex + 1} of {questions.length}
          </span>
          <button
            onClick={handleFinishInterview}
            className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1.5 transition"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Finish & View Report
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}

      {/* Question Card */}
      {currentQuestion && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-indigo-800/40 relative shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono border border-indigo-500/30 uppercase">
                {currentQuestion.questionType}
              </span>
              {currentQuestion.questionType === 'follow_up' && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30 font-semibold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-400" /> Adaptive Follow-Up Probe
                </span>
              )}
            </div>

            {/* TTS Audio Controls */}
            <button
              onClick={handleToggleTTS}
              className="px-3 py-1.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              {isSpeakingTTS ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
              <span>{isSpeakingTTS ? 'Stop Audio' : 'Listen Question (TTS)'}</span>
            </button>
          </div>

          <p className="text-xl font-medium text-white leading-relaxed font-['Outfit']">
            "{currentQuestion.questionText}"
          </p>
        </div>
      )}

      {/* Voice Interaction & Microphone Box */}
      <div className="glass-card rounded-2xl p-8 border border-slate-800 text-center relative overflow-hidden space-y-6">
        <div className="relative inline-block">
          <button
            onClick={toggleRecording}
            className={`w-24 h-24 rounded-full p-[3px] transition-all duration-300 ${
              isRecording
                ? 'bg-gradient-to-tr from-rose-500 to-amber-500 scale-110 shadow-2xl shadow-rose-500/40 ai-pulse-mic'
                : 'bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 hover:scale-105 shadow-xl shadow-indigo-500/25'
            }`}
          >
            <div className="w-full h-full bg-slate-900 rounded-full flex items-center justify-center">
              {isRecording ? <MicOff className="w-10 h-10 text-rose-400" /> : <Mic className="w-10 h-10 text-indigo-400" />}
            </div>
          </button>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-200">
            {isRecording ? 'Listening... Speak your answer now' : 'Click Microphone to Start Recording'}
          </p>
          <p className="text-xs text-slate-500 mt-1">Web Speech API • Live Audio Speech-to-Text</p>
        </div>

        {/* Live Audio Transcript Box */}
        <div className="text-left bg-slate-950/90 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex justify-between">
            <span>Candidate Answer Transcript (Editable)</span>
            {transcript && <span className="text-indigo-400">{transcript.split(' ').length} words</span>}
          </div>
          <textarea
            rows={4}
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="Your spoken transcript will stream here live. You can also type or edit your answer manually..."
            className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
          />
        </div>

        {/* Submit & Navigation Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <button
            onClick={() => setTranscript('')}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Clear Transcript
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleNextQuestion}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 border border-slate-700"
            >
              <SkipForward className="w-3.5 h-3.5 text-amber-400" /> Skip Question
            </button>

            <button
              onClick={handleSubmitAnswer}
              disabled={submitting || !transcript.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="font-mono">Claude AI Evaluating Rubric...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Submit Answer for AI Evaluation
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic Adaptive Follow-up Banner */}
      {followUpBanner && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 font-medium">
          <Zap className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
          <span>{followUpBanner}</span>
        </div>
      )}

      {/* Real-Time Evaluation Result Card */}
      {evaluation && (
        <div className="glass-card rounded-2xl p-6 sm:p-8 border border-emerald-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-['Outfit']">Multi-Dimensional Evaluation Score</h3>
                <p className="text-xs text-slate-400">Claude AI 5-Dimension Rubric Feedback</p>
              </div>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-emerald-950 border border-emerald-500/40 text-center">
                <span className="text-2xl font-extrabold text-emerald-400 font-['Outfit']">{evaluation.overallScore}</span>
                <span className="text-[10px] text-slate-400 block font-mono">OVERALL / 100</span>
              </div>
            </div>
          </div>

          {/* 5 Dimension Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Technical</span>
              <span className="text-lg font-bold text-indigo-400 font-['Outfit']">{evaluation.technicalScore}/100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Relevance</span>
              <span className="text-lg font-bold text-cyan-400 font-['Outfit']">{evaluation.relevanceScore}/100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Clarity</span>
              <span className="text-lg font-bold text-purple-400 font-['Outfit']">{evaluation.clarityScore}/100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Completeness</span>
              <span className="text-lg font-bold text-emerald-400 font-['Outfit']">{evaluation.completenessScore}/100</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Communication</span>
              <span className="text-lg font-bold text-amber-400 font-['Outfit']">{evaluation.communicationScore}/100</span>
            </div>
          </div>

          {/* Feedback details */}
          <div className="space-y-3">
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              {evaluation.feedback.summary}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-900/40">
                <div className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Key Strengths
                </div>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {evaluation.feedback.strengths?.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>

              {/* Areas for Improvement */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-900/40">
                <div className="text-xs font-semibold text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> Areas for Improvement
                </div>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {evaluation.feedback.areasForImprovement?.map((s: string, idx: number) => (
                    <li key={idx}>{s}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Ideal Answer Draft */}
            {evaluation.feedback.idealAnswerDraft && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                <span className="text-xs font-semibold text-indigo-400 block mb-1 uppercase tracking-wider">
                  Ideal Answer Breakdown
                </span>
                <p className="text-xs text-slate-300 leading-relaxed italic">
                  "{evaluation.feedback.idealAnswerDraft}"
                </p>
              </div>
            )}
          </div>

          {/* Next Question Button */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleNextQuestion}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
            >
              Proceed to Next Question <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
