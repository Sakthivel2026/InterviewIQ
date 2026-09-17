import React, { useState } from 'react';
import { useSearchParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, User, ArrowRight, Bot, AlertCircle, Loader2, KeyRound } from 'lucide-react';
import { apiFetch } from '../services/api';

export const AuthPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup } = useAuth();

  const isSignup = searchParams.get('mode') === 'signup';
  const isReset = searchParams.get('mode') === 'forgot';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setInfoMessage(null);
    setLoading(true);

    try {
      if (isReset) {
        const res = await apiFetch('/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        setInfoMessage(data.message || 'Check your server console for the simulated password reset token.');
      } else if (isSignup) {
        if (!name || name.trim().length < 2) {
          setError('Please provide your full name.');
          setLoading(false);
          return;
        }
        const result = await signup(email, password, name);
        if (result.success) {
          navigate(from, { replace: true });
        } else {
          setError(result.message || 'Signup failed.');
        }
      } else {
        const result = await login(email, password);
        if (result.success) {
          navigate(from, { replace: true });
        } else {
          setError(result.message || 'Invalid email or password.');
        }
      }
    } catch {
      setError('An unexpected connection error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-32 pb-20 flex items-center justify-center px-4">
      <div className="w-full max-w-md glass-card rounded-2xl p-8 border border-slate-700/80 shadow-2xl relative">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4 text-indigo-400">
            <Bot className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-white font-['Outfit']">
            {isReset ? 'Reset Your Password' : isSignup ? 'Create Your Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {isReset
              ? 'Enter your email to receive password reset instructions'
              : isSignup
              ? 'Join InterviewIQ to practice AI voice interviews'
              : 'Sign in to access your interview history & score analytics'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
            <KeyRound className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{infoMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Alex Reed"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="alex@example.com"
                className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          {!isReset && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Password
                </label>
                {!isSignup && (
                  <Link to="/auth?mode=forgot" className="text-xs text-indigo-400 hover:underline">
                    Forgot?
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="w-5 h-5 absolute left-3.5 top-3 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-11 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isReset ? (
              'Send Reset Instructions'
            ) : isSignup ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-800 text-xs text-slate-400">
          {isReset ? (
            <Link to="/auth?mode=login" className="text-indigo-400 font-semibold hover:underline">
              Back to Sign in
            </Link>
          ) : isSignup ? (
            <span>
              Already have an account?{' '}
              <Link to="/auth?mode=login" className="text-indigo-400 font-semibold hover:underline">
                Sign in
              </Link>
            </span>
          ) : (
            <span>
              Don't have an account?{' '}
              <Link to="/auth?mode=signup" className="text-indigo-400 font-semibold hover:underline">
                Sign up free
              </Link>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
