import React from 'react';
import { X, Sparkles, ExternalLink, Github, BookOpen } from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 text-xs select-none">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden text-slate-800">
        <div className="bg-slate-100 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="font-bold text-sm text-slate-900">About DGet+</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-slate-700 leading-relaxed text-xs bg-slate-50/40">
          <div className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200 shadow-xs">
            <div className="w-10 h-10 rounded-lg bg-sky-100 border border-sky-300 flex items-center justify-center text-sky-700 font-bold text-lg">
              D+
            </div>
            <div>
              <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <span>DGet+ Scientific Analytical Suite</span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  v2.0 (React/TS)
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                High-Resolution Mass Spectrometry Deuteration Quantification
              </p>
            </div>
          </div>

          <p>
            <strong>DGet+</strong> is an enhanced, pure client-side web and desktop suite for determining
            the percentage and distribution of deuterium in labeled molecules from high-resolution mass
            spectrometry data.
          </p>

          <div className="space-y-1.5 bg-white p-3 rounded-lg border border-slate-200 font-mono text-[11px] shadow-xs">
            <div className="text-amber-700 font-semibold flex items-center gap-1.5 mb-1">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Scientific Foundation</span>
            </div>
            <p className="text-slate-700">
              Based on the deconvolution methodology developed by <strong>Thomas E. Lockwood</strong> and{' '}
              <strong>Alexander Angeloski</strong>:
            </p>
            <p className="text-slate-500 italic">
              "DGet! A toolkit for the quantification of deuterium incorporation."
            </p>
          </div>

          <div className="space-y-2 pt-1">
            <span className="font-semibold text-slate-800 block">Repository & Deployment</span>
            <div className="flex flex-col gap-2">
              <a
                href="https://github.com/giancarlopascali-hub/DGet-plus"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-sky-700 transition shadow-xs"
              >
                <div className="flex items-center gap-2">
                  <Github className="w-4 h-4 text-slate-800" />
                  <span className="font-mono text-xs font-semibold">giancarlopascali-hub/DGet-plus</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <a
                href="https://github.com/djdt/dget"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 transition text-[11px] shadow-xs"
              >
                <span>Original Python / Qt6 DGet repository (djdt/dget)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>

        <div className="bg-slate-100 px-4 py-2.5 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
