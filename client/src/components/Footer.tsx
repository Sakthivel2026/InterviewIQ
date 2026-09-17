import React from 'react';
import { Bot, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/60 bg-[#060810] py-12 text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <span className="font-extrabold text-lg text-white font-['Outfit']">
                Interview<span className="gradient-text">IQ</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Next-generation AI mock interview platform powered by Claude Sonnet. Adaptable questions, voice interaction, and multidimensional feedback.
            </p>
          </div>

          {/* Product links */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#features" className="hover:text-indigo-400 transition">Resume Parser</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition">JD Match Engine</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition">Voice Studio</a></li>
              <li><a href="#features" className="hover:text-indigo-400 transition">AI Scoring & Feedback</a></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Resources</h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-indigo-400 transition">Interview Question Bank</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">System Design Guides</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">FAANG Preparation</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">API Documentation</a></li>
            </ul>
          </div>

          {/* Architecture info */}
          <div>
            <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-3">Stack Info</h4>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] space-y-1.5">
              <div className="flex justify-between"><span className="text-slate-500">Frontend:</span> <span className="text-slate-300 font-mono">React + Vite</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Backend:</span> <span className="text-slate-300 font-mono">Express REST</span></div>
              <div className="flex justify-between"><span className="text-slate-500">ORM:</span> <span className="text-slate-300 font-mono">Prisma ORM</span></div>
              <div className="flex justify-between"><span className="text-slate-500">AI Model:</span> <span className="text-indigo-400 font-mono">Claude Sonnet</span></div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800/40 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 InterviewIQ Platform. All rights reserved.</p>
          <div className="flex items-center gap-1">
            <span>Built with precision for software engineering candidates.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
